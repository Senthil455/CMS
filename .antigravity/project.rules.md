# Project Rules (Authoritative)

These rules override any default code generation behavior.

## Language & Types
- Use TypeScript everywhere
- Enable strict type checking
- No `any` unless explicitly allowed
- **TypeScript Configuration**: 
  - Use `moduleResolution: "bundler"` in `tsconfig.json` to allow extension-less imports.
  - OMIT file extensions (like `.js`) in relative imports for cleaner code and better tooling integration.

## Monorepo
- This project is a monorepo
- Shared code MUST live in `/packages/shared`
- Frontend and backend MUST import from shared, never redefine contracts

## Communication
- Frontend ↔ Backend use:
  - REST (HTTP)
  - socket.io (real-time)
- All API paths are defined in shared config files
- No hardcoded endpoints or event names

## Storage
- Use repository pattern
- Define interfaces first
- Implement SQLite repositories in backend infrastructure layer
