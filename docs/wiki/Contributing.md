# Contributing to CMS

This guide covers how to extend CMS with new components and features.

---

## Developing a New Page Component

To add a new component (e.g., a "Follow Button"), follow these steps:

### Step 1: Create the Prompt

Add a new file in **cms** repo at `packages/backend/resources/prompts/components/`:

```
resources/prompts/components/follow-button.html
```

This file contains the Handlebars + Alpine.js template that the AI will inject.

### Step 2: Update the AI Prompt Instructions

Modify the relevant prompt (e.g., `page-builder.md`) to tell the AI:
- **What** the component does.
- **Where** to place it in the page structure.
- **When** to use it (e.g., on user profile pages).

### Step 3: Create or Update the Agent

If the component requires new orchestration logic:

1. Create a new agent file in **cms** repo at `packages/backend/src/models/agents/`:
   ```
   follow-agent.ts
   ```
2. Define the agent's responsibilities (when it runs, what it outputs).

Existing agents:
- `page-builder-agent.ts` – Generates page HTML
- `query-generator-agent.ts` – Creates GraphQL queries
- `entity-generator-agent.ts` – Generates schema definitions

### Step 4: Add a Frontend Command

To allow users to trigger the agent:

1. Add a new command handler in the frontend.
2. Wire it to the backend's chat/agent router.

Example flow:
```
User Command → Frontend → Backend Router → Agent → AI → Output
```

---

## Existing Component Prompts

Located in **cms** repo at `packages/backend/resources/prompts/components/`:

| Component | File | Purpose |
|-----------|------|---------|
| Engagement Bar | `engagement-bar.html` | Likes, shares, bookmarks |
| User Avatar | `user-avatar.html` | Profile display with dropdown |
| Top List | `top-list.html` | Ranked item display |

---

## Future Topics

- [ ] Adding new SDK services
- [ ] Creating new AI agents
- [ ] Backend API development
- [ ] Testing guidelines
