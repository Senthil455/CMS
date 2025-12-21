# Frontend Data Fetching Rules (Authoritative)

These rules define how frontend code fetches data from APIs.

---

## 1. Required Library

- All frontend API data fetching MUST use `useSWR`
- `fetch()` or `axios()` must NOT be called directly inside components

---

## 2. Separation of Concerns

- UI components must not perform data fetching
- All API calls live inside hooks
- Hooks must return typed data and states

---

## 3. Endpoint Source

- API endpoints must be imported from `/packages/shared/endpoints.ts`
- **Base URL**: All API calls MUST use the `config.API_BASE_URL` from `@/config.ts`
- No hardcoded URLs, protocols, or ports in hooks or components

---

## 4. Typing

- All SWR hooks must be strongly typed
- Response types come from shared contracts

---

## 5. Forbidden Patterns

- `fetch()` inside React components
- Inline async calls in `useEffect`
- Hardcoded API paths
