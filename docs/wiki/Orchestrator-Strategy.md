# Orchestrator Strategy

The orchestrator turns one chat message into a sequence of reviewed CMS writes. It is a **single-process, in-memory coordinator** on top of stateless agents and a persistent task list.

---

## 1. Why multiple agents

A single giant prompt that designs entities, writes GraphQL, and emits HTML is unreliable:

- context grows and accuracy drops;
- a bad intermediate result silently corrupts everything downstream;
- there is no natural place to pause for user review;
- failures are hard to attribute.

CMS splits the work into narrow agents with typed plans, logs every model response, and pauses whenever a decision should be confirmed.

---

## 2. Agent contract

Every agent implements `Agent` from `src/agent/chat-assistant.ts`:

```typescript
interface Agent<T> {
  think(input: string, context: AgentContext): Promise<ThinkResult<T>>;
  act(plan: T, context: AgentContext): Promise<ActResult<T>>;
  finalize(feedback: any, context: AgentContext): Promise<FinalizeResult>;
}
```

| Phase | Meaning |
|---|---|
| `think()` | Build system/developer/user prompts, call the provider, parse a JSON plan, log it |
| `act()` | Validate and apply the plan through CMS APIs. Returns `feedback` if user confirmation is required, plus synced schema IDs and any follow-up task items |
| `finalize()` | Runs after the user confirms feedback; performs the commit and can append follow-up items |

`AgentContext` carries the CMS cookie, the optional schema ID, the signal used for cancellation, a message-saving callback, and free-form metadata (for example, a component ID).

This is a ReAct-style split: reasoning in `think`, side effects in `act`, and a separate commit path in `finalize`.

---

## 3. Agent catalogue

Registered in `src/plugins/04-agents.ts` for each configured AI provider.

| Agent | Prompt | Responsibility |
|---|---|---|
| `intent_classifier` | `intent-classifier.md` | Route a free-form message to one agent; can return `null` |
| `system_architect` | `system-architect.md` | Break a whole-system request into task items and entity/query/page intents |
| `entity_designer` | `entity-designer.md` | Design entities, attributes, and relationships |
| `data_synthesizer` | `data-synthesizer.md` | Generate and insert sample records |
| `query_builder` | `query-builder.md` | Write GraphQL and save named queries |
| `page_planner` | `page-planner.md` | Choose entity, page type, name, and design style |
| `page_architect` | `page-architect.md` | Design layout sections and select components |
| `component_builder` | `page-components/common-component/prompt.md` | Generate custom HTML |
| `page_engagement_bar_builder` | `page-components/engagement-bar/prompt.md` | Engagement bar |
| `page_user_avatar_builder` | `page-components/user-avatar/prompt.md` | User avatar/menu |
| `page_top_list_builder` | `page-components/top-list/prompt.md` | Ranked list |
| `page_search_bar_builder` | `page-components/search-bar/prompt.md` | Search/filter UI |
| `page_data_list_builder` | `page-components/data-list/prompt.md` | Record list |
| `page_pagination_builder` | `page-components/pagination/prompt.md` | Cursor pagination |
| `page_breadcrumb_builder` | `page-components/breadcrumb/prompt.md` | Breadcrumb trail |
| `page_detail_hero_builder` | `page-components/detail-hero/prompt.md` | Detail hero |
| `page_table_view_builder` | `page-components/table-view/prompt.md` | Table view |
| `page_contact_form_builder` | `page-components/contact-form/prompt.md` | Contact form |
| `page_image_carousel_builder` | `page-components/image-carousel/prompt.md` | Image carousel |
| `page_faq_accordion_builder` | `page-components/faq-accordion/prompt.md` | FAQ accordion |

`AGENT_NAMES.SYSTEM_IMPLEMENTER` is declared in shared constants but is **not registered or used** by the orchestrator. `PAGE_RELATED_ITEMS_BUILDER` is declared, and its resource directory exists, but it is commented out of `PAGE_COMPONENT_REGISTRY`.

---

## 4. Message lifecycle

```text
socket 'chat:send_message'
  │
  ├─ starts an AbortController for this user
  ├─ special command?  → replay / execute-task / modify-component
  │
  ├─ '@agent...'?      → explicit agent (+ optional #schemaId)
  ├─ otherwise         → intent_classifier.resolve()
  │
  ├─ no agent          → help message
  │
  └─ executeAgent()
       ├─ statusService.setStatus(agent)
       ├─ agent.think()  → AI provider → JSON plan → AiResponseLog
       ├─ agent.act()    → CMS writes
       ├─ feedback?      → emit chat:agent_plan_to_confirm, wait
       ├─ emit chat:schemas_sync
       ├─ commit task item
       └─ next pending task item → repeat
```

### Status

`StatusService` keeps an in-memory map of `userId → { agentName, createdAt }`. It emits `chat:agent_status` on every change and re-emits the current status when a socket reconnects. It does not persist across process restarts.

### Cancellation

`POST /cmsapi/chat/cancel` calls `cancelActiveRequest(userId)`, which aborts the `AbortController` for that user. Agents pass the signal into provider and CMS calls. Cancellation is per user and in-memory; a restart clears it.

---

## 5. Confirmations and feedback

When `act()` needs a decision, it returns a non-null `feedback` payload. The orchestrator emits:

```json
{
  "agentName": "entity_designer",
  "data": { "...": "agent-specific" },
  "agentTaskItem": { "taskId": 12, "index": 0 }
}
```

The Studio renders the appropriate confirmation UI (entity summary, design template picker, system plan, and so on). The user's response returns as `chat:agent_feedback_response`:

```json
{
  "agentName": "entity_designer",
  "feedbackData": { "...": "includes agentTaskItem" },
  "selection": "gemini/gemini-3-pro"
}
```

The orchestrator calls `finalize()`, emits schema syncs, optionally inserts follow-up items, commits the current item, and continues the task.

Important: **no CMS write occurs for the parts gated by `feedback` until `finalize()` runs.** Earlier, non-gated steps (for example, creating a subset of entities) may already have been applied.

---

## 6. Task queue

`AgentTask` stores a JSON array of items:

```typescript
interface AgentTaskItem {
  index: number;
  type: AgentName;
  description: string;
  status: 'pending' | 'completed';
  input?: string;
  payload?: unknown;
}
```

`TaskOperator` provides:

| Operation | Behavior |
|---|---|
| `checkout(taskId)` | Return the first pending item |
| `commit({ taskId, index })` | Mark an item complete and persist |
| `reset({ taskId, index })` | Reset an item to pending |
| `toggleItemStatus(taskId, index)` | Manual check/uncheck from the UI |
| `insertItemsAfter({ taskId, index }, items)` | Insert follow-up work |
| `createTaskFromItems(items, description?)` | Persist a new task |

The queue is **global**, not per user. `GET /cmsapi/tasks` returns the latest tasks for everyone. There is no atomic claim or row locking, so two concurrent requests could execute the same task item.

---

## 7. Replay

Every `think()` result is stored in `AiResponseLog`:

| Field | Contents |
|---|---|
| `handler` | Agent name |
| `modelSelection` | e.g. `gemini/gemini-3-pro` |
| `input` | Full prompt text (system + developer + user) |
| `response` | JSON plan |
| `schemaId` | Optional target schema |
| `timestamp` | Creation time |

`@replay <logId>` loads the stored plan and calls `act()` directly. It does **not** call the model again and does **not** re-run `think()`. This makes replay deterministic with respect to the stored plan, but it re-applies side effects: replaying an entity-create plan can create duplicates or fail on conflicts.

Replay is available from the chat command and from the AI Logs list.

---

## 8. Prompt and resource loading

- Agent prompts live next to agents in `src/agent/*.md`; page component prompts live in `src/agent/page-components/<component>/prompt.md`.
- Optional snippets live beside the prompt as `snippet.html`.
- Shared JSON schemas for entity/attribute/relationship output live in `resources/schemas/`.
- Design style prompts are read from the `DesignStyle` table at request time.
- Each provider gets its own agent instances, so switching providers does not reset stored tasks or conversations.

Prompt files are read at startup. Changing a prompt requires restarting the service.

---

## 9. Failure handling

| Failure | Result |
|---|---|
| Provider error or timeout | `AgentProviderError` → user-visible chat error where possible |
| CMS error | `CmsError` → user-visible error |
| Invalid model JSON | Agent throws; orchestrator reports the failure and logs it |
| Unknown intent | Help message listing capabilities |
| Missing log/task | `UserVisibleError` with the ID |
| Process crash | In-flight status, cancellation, and socket state are lost; persisted tasks and logs remain |

There are **no automatic retries, validation gates between stages, per-stage timeouts, or token/cost accounting**. These are listed as future work in the roadmap.

---

## 10. Design trade-offs

**Strengths**

- Small prompts and typed plans are easier to inspect.
- Logging and replay make failures reproducible without another model call.
- Confirmation gates prevent most unintended schema writes.
- The task list gives long builds a visible, resumable structure.

**Limits**

- In-memory coordination prevents horizontal scaling of the Node service.
- A global queue has no ownership or concurrency control.
- Replay is not idempotent against CMS state.
- Agents trust prior outputs; there is no schema validation between stages.
- One slow provider call blocks that user's pipeline until it finishes or is cancelled.
