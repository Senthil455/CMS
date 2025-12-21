# Shared Contracts

## REST Endpoints
- All REST endpoints are defined in:
  `/packages/shared/endpoints.ts`
- Backend routers MUST read from this file
- Frontend API hooks MUST import from this file

## Socket Events
- All socket.io events are defined in:
  `/packages/shared/src/events.ts`
- No inline event names are allowed; use the `SOCKET_EVENTS` constant.
- **Strong Typing**: Every event MUST be defined in `ClientToServerEvents` or `ServerToClientEvents` interfaces.
- **Payloads & Acks**: Explicitly define the payload type and the acknowledgement (ack) callback if applicable.

Example definition in `events.ts`:
```typescript
export interface ClientToServerEvents {
    [SOCKET_EVENTS.CHAT.SEND_MESSAGE]: (
        payload: { content: string },
        ack?: (response: { ok: boolean; message?: string }) => void
    ) => void;
}

export interface ServerToClientEvents {
    [SOCKET_EVENTS.CHAT.NEW_MESSAGE]: (message: ChatMessage) => void;
}
```

## Ownership
- `/packages/shared` contains:
  - request/response types
  - event payload types
  - shared utility functions
