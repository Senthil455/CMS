# Backend Architecture (Fastify)

The backend in this repository is `packages/service`. The ASP.NET Core CMS is a separate runtime and is not part of this checkout.

## Tech Stack

- Fastify 4
- TypeScript (run with `tsx` in development and in the Docker image)
- Prisma + SQLite for service-owned data
- Socket.IO at `/cmsapi/socket.io`
- Zod for environment validation

## Structure Rules

- Routers and socket handlers only handle transport logic.
- Business logic lives in `src/services/` and `src/agent/`.
- Database access lives in `src/repositories/` and `src/infrastructures/`.
- Domain models live in `src/models/`.
- Agent orchestration lives in `src/operators/` and `src/services/`.
- Prompts and page-component templates live in `src/agent/` and `src/agent/page-components/`.

## Backend Rules

- Backend config is loaded from `.env` through `src/config.ts`.
- Use the single config module; do not read `process.env` ad hoc.
- **Autoload:** plugins and routers MUST be registered with `@fastify/autoload`.
  - Plugins directory: `packages/service/src/plugins`
  - Routers directory: `packages/service/src/routers`
- Fastify plugins and services MUST receive config via dependency injection.
- Repositories MUST receive the Prisma client via constructor injection.
- `/api` and `/graphql` are proxies to `CMS_BASE_URL`; do not re-implement CMS resources in this service.
- `/cmsapi` is service-owned. Authentication is enforced; CMS role checks are not.

## Fastify Best Practices

- **Thin handlers:** routers and socket handlers MUST be thin.
  - Move business logic, data processing, and long-running workflows into services.
  - Handlers parse input, call services, and send responses or emit events.
- Prefer autoload for plugins and routes.
- Use dependency injection.
- Avoid global singletons.
- Use Fastify plugins for cross-cutting concerns.
- Return the shared error envelope: `{ success: false, error: string }`, with the status codes handled in `src/index.ts`.

## Repository Pattern

- Define repository interfaces in the domain layer.
- SQLite implementations live in `src/repositories/` and use Prisma.
- The Prisma schema is `packages/service/prisma/schema.prisma`.
- Service sessions use a separate `sessions.db` in the process working directory, not the Prisma database.
