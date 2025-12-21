# Environment Configuration Rules

## General
- All runtime configuration MUST come from environment variables
- No hardcoded config values are allowed
- No direct access to `process.env` outside config modules

## Validation
- Environment variables MUST be validated at startup
- Invalid or missing variables MUST fail fast

## Typing
- Environment variables MUST be strongly typed
- Shared config types live in `/packages/shared`

---

## Backend Rules

- Backend config is loaded from `.env`
- Use a single config module (e.g. `config.ts`)
- Fastify plugins/services MUST receive config via dependency injection
- Repositories MUST receive DB config via constructor injection

## Frontend Rules

- Frontend configuration MUST be centralized in `src/config.ts`
- Use Vite-prefixed environment variables (e.g., `VITE_API_URL`)
- Provide sensible defaults for local development
- No direct use of `import.meta.env` outside the config module

Example `src/config.ts`:
```ts
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
};
```

Example:
```ts
export interface DbConfig {
  path: string
}
