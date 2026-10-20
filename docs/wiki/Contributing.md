# Contributing

This guide covers the changes contributors most often make. The repository is a TypeScript monorepo with no automated test suite yet, so review and manual verification matter.

---

## 1. Before you start

```bash
npm install
npm run setup
npm run dev
```

Useful checks before opening a pull request:

```bash
npm run build:shared
npm run build:all          # skips workspaces without a build script
npx tsc --noEmit -p packages/service/tsconfig.json
```

There are `vitest` scripts in `@cms/service` (`npm test`, `npm run test:watch`) but **no test files**. Adding tests is welcome; do not claim a suite exists until it does.

---

## 2. Project conventions

| Rule | Details |
|---|---|
| Language | TypeScript everywhere |
| Module layout | Routers handle transport; services hold orchestration; repositories own persistence; infrastructure wraps external systems |
| Contracts | Endpoints in `packages/shared/src/endpoints.ts`, socket events in `events.ts`, agent names in `constants.ts` |
| Imports | Service uses ESM and relative imports; shared types come from `@cms/shared` |
| Config | Validate environment in `src/config.ts`; do not scatter `process.env` reads |
| Auth | Add `preHandler: [fastify.authenticate]` to every `/cmsapi` route |
| Prompts | Markdown files beside agents/components; loaded at startup |
| UI | Match the existing app's component library and styling; do not introduce a second design system into a package |

The service's plugin order is encoded by filename prefixes (`00-database`, `01-repositories`, `02-infrastructure`, `03-operators`, `04-agents`, `05-services`). Autoload uses alphabetical order, so preserve the prefixes.

---

## 3. Add an AI agent

### 3.1 Create the class

Add `src/agent/<name>.ts` implementing `Agent`:

```typescript
import type { Agent, AgentContext, ThinkResult, ActResult, FinalizeResult } from './chat-assistant';

export class ExampleAgent implements Agent<ExamplePlan> {
  constructor(
    private readonly provider: AiProvider,
    private readonly prompt: string,
    private readonly cms: CmsClient,
    private readonly logger: ServiceLogger,
  ) {}

  async think(input: string, context: AgentContext): Promise<ThinkResult<ExamplePlan>> {
    const systemPrompt = this.prompt;
    const developerMessage = '…';
    const userInput = input;
    const plan = await this.provider.generate(systemPrompt, developerMessage, userInput, { parseJson: true });
    return { plan, prompts: { systemPrompt, developerMessage, userInput } };
  }

  async act(plan: ExamplePlan, context: AgentContext): Promise<ActResult<ExamplePlan>> {
    // call CMS with context.externalCookie
    return { feedback: null, syncedSchemaIds: [] };
  }

  async finalize(feedback: any, context: AgentContext): Promise<FinalizeResult> {
    return { syncedSchemaIds: [] };
  }
}
```

### 3.2 Add the prompt

Put `src/agent/<name>.md` next to the class and load it in `src/plugins/04-agents.ts`. Prompts are read once at startup.

### 3.3 Register the agent

1. Add the identifier to `AGENT_NAMES` in `packages/shared/src/constants.ts`.
2. Instantiate it per provider in `04-agents.ts`.
3. Add it to `fastify.chatHandlers[providerName]`.
4. Teach `intent_classifier` when to route to it (update `intent-classifier.md`).
5. Rebuild `@cms/shared`.

### 3.4 Logging and confirmation

The orchestrator logs every `think()` result through the repository used by the agent base. If your `act()` needs confirmation, return a non-null `feedback` object and implement the matching `finalize()` commit. Never write gated data in `act()` before confirmation.

---

## 4. Add a page component

1. Create `src/agent/page-components/<component>/prompt.md`.
2. Optionally add `snippet.html` for a reference fragment.
3. Add an entry to `PAGE_COMPONENT_REGISTRY` in `index.ts`:

```typescript
{
  id: 'my_component',
  agentName: AGENT_NAMES.PAGE_MY_COMPONENT_BUILDER,
  label: 'My Component',
  icon: 'Box',
  color: 'gray',
  pageTypes: ['list', 'detail'],
  resourceDir: 'my-component',
  hasSnippet: true,
  needQueries: false,
  chatMessage: 'Add my component to this page',
}
```

4. Add the agent name to `AGENT_NAMES`.
5. No manual handler registration is needed: `04-agents.ts` builds one `PageComponentBuilder` per registry entry.
6. Restart the service and test with `@modify-component <schemaId> <componentId> …`.

### Prompt requirements

- Output **one HTML fragment**, not a full document.
- Use Tailwind utility classes and Alpine.js.
- Follow the HandlebarsDotNet subset in [Page Templates & Interactivity](./Page-Templates-Interactivity.md#3-handlebars-contract).
- Use `{{image.url}}` for asset fields.
- Do not use JavaScript expressions or sub-expressions in `#if`.
- Keep the fragment self-contained; the LayoutCompiler adds the document shell.

---

## 5. Add a service route

1. Add the path to `ENDPOINTS` in `packages/shared/src/endpoints.ts`.
2. Create or extend a router in `src/routers/`.
3. Guard it with `preHandler: [fastify.authenticate]`.
4. Validate input with Zod.
5. Put business logic in a service or operator, not in the handler.
6. Return `{ success: true, data }` on success.
7. Update [API Reference](./API-Reference.md).

Routers are autoloaded from `src/routers`; no central registration file exists.

---

## 6. Add a database model

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma generate` and `npx prisma db push` from `packages/service`.
3. Add a repository interface and a Prisma implementation in `src/repositories/`.
4. Register it in `src/plugins/01-repositories.ts`.
5. Decorate Fastify with the repository so routers can use it.

There are no migrations in the repo; `db push` is the workflow, and Docker runs it with `--accept-data-loss` on every start. Do not store CMS content in this database.

---

## 7. Add a UI feature

### Studio (`packages/app`)

- Routes and pages live in `src/pages/`.
- The studio is composed of `explorer-panel`, `chat-panel`, and `detail-panel`.
- Use existing API helpers and `@cms/shared` types.
- Schema mutations should refresh through SWR or the `chat:schemas_sync` event, not ad-hoc reloads.

### Admin / Portal

- Both use PrimeReact and the SDK.
- They are served from `/admin/` and `/portal/`; keep Vite `base` unchanged.
- They have no dev proxy. Test them through the service after building, or configure the API origin.

### Stash

- Follow the existing sage/zen token usage and bottom navigation.
- Any new IndexedDB store requires a DB version bump in `src/db/database.ts` and an upgrade branch.
- Test offline behavior with DevTools network throttling and a production build (`npm run build:stash`), because the service worker is disabled in dev.

---

## 8. Frontend apps and the SDK

`@cms/sdk` is consumed as source. If you change it:

- Keep `main`/`types` pointing at `index.ts`.
- Verify consumers (`admin`, `portal`, `stash`) still type-check.
- Do not add a build step unless you also update every consumer and the root scripts.

For an external frontend, see [Vite + React + AI](./Vite-React-Antigravity-Example.md).

---

## 9. Manual test checklist

Because there are no automated tests, verify the paths you touched:

- [ ] `npm run dev` starts the service and Studio without config errors.
- [ ] Login works through `127.0.0.1` and the session survives navigation.
- [ ] Chat returns a message and the status indicator clears.
- [ ] An entity plan shows a confirmation card and writes only after confirmation.
- [ ] `chat:schemas_sync` refreshes the explorer.
- [ ] A generated page previews and publishes.
- [ ] `/cmsapi/chat/cancel` stops a long request.
- [ ] `@replay <id>` reproduces a stored plan.
- [ ] Building the touched workspaces succeeds (`npm run build --workspace=…`).
- [ ] No new plaintext secrets, keys, or `dev.db` files are committed.

---

## 10. Pull request checklist

- [ ] Scope is focused; unrelated formatting is avoided.
- [ ] Shared contracts are updated rather than duplicated.
- [ ] New routes are authenticated and validated.
- [ ] New prompts follow the HandlebarsDotNet subset.
- [ ] Docs updated when behavior, paths, or configuration change.
- [ ] `README.md` and wiki links still resolve.
- [ ] No fabricated performance or test claims.

---

## 11. Known gaps worth contributing to

- Automated tests for the orchestrator, task operator, and LayoutCompiler.
- Per-user task ownership and atomic checkout.
- Role enforcement on `/cmsapi` admin routes.
- Encryption for stored AI keys.
- Validation/retry gates between agent stages.
- Removing CDN dependencies from generated pages.
- Replacing `build:sdk` with a real build or removing the script.

---

## 12. Related pages

- [Repository Structure](./Repository-Structure.md)
- [Orchestrator Strategy](./Orchestrator-Strategy.md)
- [API Reference](./API-Reference.md)
- [Page Templates & Interactivity](./Page-Templates-Interactivity.md)
