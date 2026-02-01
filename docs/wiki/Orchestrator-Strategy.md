# Orchestrator Strategy

How cms coordinates multiple AI agents to build schemas, queries, and pages.

---

## The Challenge

### 1. Single Large Prompt Confuses LLMs
Combining all instructions into one massive prompt leads to:
- Decreased accuracy as context grows
- Inconsistent outputs
- Difficulty pinpointing failures

### 2. Multi-Agent Orchestration is Hard to Debug
Complex pipelines like **Page Planner → Architecture → Builder** create:
- Cascading failures (one bad output breaks everything downstream)
- Opaque debugging (which agent failed?)
- Difficulty reproducing issues

---

## Our Solution

### 1. Mirror Real-World Workflow (DDD-Inspired)
We model the AI pipeline after how humans actually work, following **Domain-Driven Design** principles:

| Phase | Agent | Responsibility |
|-------|-------|----------------|
| **Plan** | Planner | Understand requirements, define scope |
| **Architecture** | Architect | Design structure, define relationships |
| **Build** | Builder | Generate the actual output |

**DDD Principles Applied:**
- **Ubiquitous Language**: Agent names match real-world roles (Planner, Architect, Builder) — easy for developers and stakeholders to understand
- **Bounded Contexts**: Each agent owns its domain — Planner doesn't know about templates, Builder doesn't care about intent classification
- **Domain Services**: Agents are services that encapsulate domain logic (schema generation, query building, page rendering)

This separation keeps each agent focused on a single, well-defined task.

### 2. Isolated & Idempotent Agent Execution
Each agent operates in isolation with idempotent behavior:
- **Independent context**: Agents receive only what they need
- **Clear inputs/outputs**: Well-defined interfaces between agents
- **No shared state**: Prevents unexpected side effects
- **Idempotent**: Same input always produces the same output, enabling safe retries

### 3. Full Logging & Replay
Every agent execution is logged:
- **Input prompt** captured
- **LLM response** recorded
- **Processing steps** tracked
- **Replay capability** for debugging

This makes it easy to:
- Identify which agent failed
- Reproduce issues consistently
- Test fixes in isolation

### 4. Pipeline Structure
Agents are composed into a linear pipeline:

```
┌──────────┐     ┌─────────────┐     ┌──────────┐
│  Planner │ ──▶ │ Architect   │ ──▶ │ Builder  │
└──────────┘     └─────────────┘     └──────────┘
     │                  │                  │
     ▼                  ▼                  ▼
  [Plan]           [Design]           [Output]
```

Benefits:
- **Predictable flow**: Easy to understand and debug
- **Checkpoint outputs**: Each stage produces reviewable artifacts
- **Partial retry**: Re-run from any failed stage

---

## User Experience

### Status Updates
Users see real-time feedback on what the backend is doing:

| Status | Meaning |
|--------|---------|
| 🔄 Planning... | Analyzing requirements |
| 🔄 Designing... | Creating architecture |
| 🔄 Building... | Generating output |
| ✅ Complete | Ready to review |

This transparency:
- Confirms the backend is working
- Sets expectations for longer operations
- Provides context if something fails

---

## Example: Page Generation Pipeline

```
User Prompt: "Create a blog post list page"
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ 1. Page Planner                             │
│    Input: User prompt + existing entities   │
│    Output: Page plan (name, entity, layout) │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ 2. Query Generator                          │
│    Input: Page plan + schema                │
│    Output: GraphQL query                    │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ 3. Page Builder                             │
│    Input: Plan + query + sample data        │
│    Output: HTML/CSS template                │
└─────────────────────────────────────────────┘
                    │
                    ▼
              Final Page
```

Each step is logged, reviewable, and independently re-runnable.

---

## 🧩 Design Patterns Applied

### ReAct Pattern (Reasoning + Acting)
The core `think()` → `act()` separation in `BaseAgent`:
```
think() = LLM reasoning phase (generate a plan)
act()   = Execution phase (apply the plan)
```
This is a well-documented pattern from AI agent research, enabling clear separation between AI decision-making and system actions.

### Template Method
`BaseAgent` defines the algorithm skeleton in `handle()`, while subclasses implement `think()` and `act()`:
```typescript
abstract class BaseAgent<T> {
    async handle() {
        const plan = await this.think();  // Subclass implements
        return await this.act(plan);       // Subclass implements
    }
}
```

### Chain of Responsibility
Agents chain via `AgentResponse.nextAgent`:
```
PagePlanner → PageArchitect → PageBuilder
```
Each agent decides whether to pass control downstream.

---

## Key Takeaways

1. **Small, focused agents** beat one large prompt
2. **Isolation + Idempotency** makes debugging tractable and retries safe
3. **Logging** enables replay and issue reproduction
4. **Pipeline structure** provides clarity and checkpoints
5. **Status updates** keep users informed

---

## 📋 Future Considerations

- [ ] **Validation gates** - Add schema validation between agents to catch bad outputs early
- [ ] **Retry with backoff** - Automatic retry (1-2 attempts) with modified prompts on failure
- [ ] **Partial results** - Show Plan + Query even if Builder fails (graceful degradation)
- [ ] **Temperature control** - Ensure LLM temperature is 0 for reliable idempotent replay
- [ ] **Token tracking** - Log token usage per agent for cost optimization
- [ ] **Per-stage timeouts** - Prevent one slow agent from hanging the whole pipeline
