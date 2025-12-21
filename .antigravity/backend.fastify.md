# Backend Architecture (Fastify)

## Tech Stack
- Fastify
- TypeScript
- SQLite

## Structure Rules
- Routers OR socket handlers only handle transport logic
- Business logic lives in services
- Database access lives in infrastructure layer
- Domain models live in models/

## Backend Rules

- Backend config is loaded from `.env`
- Use a single config module (e.g. `config.ts`)
- **Autoload**: Plugins and Routers MUST be registered using `@fastify/autoload`.
  - Plugins directory: `/packages/backend/src/plugins`
  - Routers directory: `/packages/backend/src/routers`
- Fastify plugins/services MUST receive config via dependency injection
- Repositories MUST receive DB config via constructor injection

## Fastify Best Practices
- **Thin Handlers**: Routers and Socket handlers MUST be "thin".
  - Move business logic, data processing, and complex asynchronous workflows to Services.
  - Handlers should only handle transport-level concerns (parsing input, calling services, and sending responses/emissions).
- Prefer auto-load for:
  - plugins
  - routes
- Use dependency injection
- Avoid global singletons
- Use Fastify plugins for cross-cutting concerns

## Repository Pattern
- Define repository interfaces in domain layer
- SQLite implementations live in infrastructures/
