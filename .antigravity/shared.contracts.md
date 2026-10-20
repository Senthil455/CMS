# Shared Contracts

## REST Endpoints

- All REST endpoint constants are defined in:
  `packages/shared/src/endpoints.ts`
- Service routers MUST read from this file.
- Frontend API hooks MUST import from this file.
- `/cmsapi/*` routes are owned by the Fastify service.
- `/api/*` and `/graphql` are owned by the external ASP.NET Core CMS and proxied by the service.

## Socket Events

- All Socket.IO event names are defined in:
  `packages/shared/src/events.ts`
- No inline event names are allowed; use the `SOCKET_EVENTS` constant.
- **Strong typing:** every event MUST be defined in `ClientToServerEvents` or `ServerToClientEvents`.
- **Payloads:** define the payload type explicitly. The current interfaces do not use acknowledgement callbacks.

Current events:

```typescript
export const SOCKET_EVENTS = {
    CHAT: {
        SEND_MESSAGE: 'chat:send_message',
        MESSAGE_RECEIVED: 'chat:message_received',
        SCHEMAS_SYNC: 'chat:schemas_sync',
        AGENT_PLAN_TO_CONFIRM: 'chat:agent_plan_to_confirm',
        AGENT_FEEDBACK_RESPONSE: 'chat:agent_feedback_response',
        AGENT_STATUS: 'chat:agent_status',
    }
} as const;
```

Example definition in `events.ts`:

```typescript
export interface ClientToServerEvents {
    [SOCKET_EVENTS.CHAT.SEND_MESSAGE]: (
        data: { content: string, providerName?: string }
    ) => void;
}

export interface ServerToClientEvents {
    [SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED]: (message: ChatMessage) => void;
}
```

The Socket.IO path is `/cmsapi/socket.io`.

## Ownership

`packages/shared/src/` contains:

- request/response types and DTOs,
- socket event payload types,
- endpoint constants,
- shared utility functions such as the LayoutCompiler.

`packages/shared` is built with `tsc` to `dist/`. Run `npm run build:shared` after changing it; the service consumes the compiled output.
