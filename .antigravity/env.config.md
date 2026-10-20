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
- Use Vite-prefixed environment variables (e.g., `VITE_API_BASE_URL`)
- Provide sensible defaults for local development
- No direct use of `import.meta.env` outside the config module
- An empty base URL means same-origin and is the recommended default

Example `src/config.ts`:
```ts
export const config = {
  // Empty = same origin. In development, proxy /api and /graphql to CMS.
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
};
```

The CMS API default is `http://127.0.0.1:5000`. The Fastify service on `3001` serves `/cmsapi`, not the data API.

Example:
```ts
export interface DbConfig {
  path: string
}
