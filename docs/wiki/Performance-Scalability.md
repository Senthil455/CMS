# Performance & Scalability

This page describes the performance characteristics that follow from the code and deployment, and the limits you should plan around. **No benchmarks are published for this repository.** Any latency or throughput figure would depend on the CMS implementation, database, hardware, agent prompts, and AI provider latency.

---

## 1. What is fast, what is slow

| Path | Expected cost | Why |
|---|---|---|
| Static SPA assets | Low | Served by Fastify (`@fastify/static`) or Nginx in front |
| `/api` and `/graphql` proxy | One extra hop | Fastify proxies to the CMS; Nginx also proxies in Docker |
| Session validation | One CMS call | `auth-guard` calls the CMS profile endpoint on requests with a cookie |
| Chat message | Seconds to minutes | Multiple sequential LLM calls and CMS writes |
| Page render | CMS-dependent | HandlebarsDotNet + query execution in the CMS |
| Engagement stats | CMS-dependent | Browser calls CMS directly through the SDK |
| Asset conversion | Seconds to minutes | ffmpeg video/audio conversion, if used |

The interactive Studio is dominated by **agent latency**, not by the Node service. Database queries against the service SQLite tables are small (chat history, logs, settings, tasks).

---

## 2. Actual architecture limits

### Node service is stateful and single-instance

In-memory state:

- `activeRequests` map for cancellation
- `StatusService` per-user agent status
- per-provider agent instances
- loaded prompts and registry

Consequences:

- You cannot run multiple Fastify replicas behind a load balancer without sticky sessions and shared state.
- A restart loses in-flight cancellations and status, though persisted tasks/logs survive.
- `sessions.db` is a local SQLite file, so session state is also node-local.

### SQLite is a single-writer database

Service data uses Prisma + SQLite. That is appropriate for a single Studio instance and moderate log volume. It is not appropriate for multiple writers or high concurrency. Moving to PostgreSQL requires changing the Prisma datasource and regenerating the client.

### The task queue is global and non-atomic

`AgentTask` rows are shared by all users, and checkout/commit are read-modify-write operations. Concurrent executions can duplicate work. There is no lock, lease, or worker pool.

### The proxy doubles the network hop

In Docker, `/api` goes Nginx → Fastify → CMS. Nginx already routes `/api` directly to the CMS for requests that do not need Fastify. The Fastify proxy exists for local development and for a single-origin browser experience.

### Generated pages depend on CDNs

Tailwind, Alpine.js, `marked`, and Google Fonts load from external CDNs. First paint and interactivity depend on those networks. There is no local bundling or subresource integrity in the generated head.

### AI cost and latency are unbounded by the service

There are no per-stage timeouts, retries, token limits, or cost tracking. A slow provider blocks that user's pipeline until it completes or is cancelled. A system-level prompt can fan out into many sequential calls.

---

## 3. Where time goes in a build

For a multi-step request such as *"build a library system"*:

```text
intent classification       1 model call
system architect            1 model call
per entity design           1 model call + 1 CMS write + confirmation
per data seed               1 model call + N CMS inserts
per query                   1 model call + 1 CMS write
page planning               1 model call
page architecture           1 model call
per component               1 model call + HTML generation
publish                     1 CMS write
```

The elapsed time is roughly the sum of provider latencies plus CMS writes. Parallelism is limited: the task queue processes items in sequence, and confirmation gates pause until the user responds.

---

## 4. Measuring your deployment

There are no built-in metrics endpoints. Use external tooling:

| Layer | How to measure |
|---|---|
| Nginx | Access log at `/var/log/nginx/access.log` (includes `$upstream_addr`); enable `log_format` timing fields if needed |
| Fastify | Set `LOG_LEVEL_FASTIFY=info` and inspect Pino output; `LOG_LEVEL_SERVICE`, `LOG_LEVEL_MODEL`, `LOG_LEVEL_INFRASTRUCTURE` control service logs |
| CMS | CMS logs and database query plans (outside this repository) |
| AI | `AiResponseLog.timestamp` and log volume; provider dashboards for tokens and latency |
| Browser | DevTools network panel for `/api`, `/graphql`, `/static`, and CDN requests |
| SQLite | `EXPLAIN QUERY PLAN` via `sqlite3` for slow service queries; check `dev.db` size |

Useful synthetic checks:

```bash
# Static asset latency
curl -w '%{time_total}\n' -o /dev/null -s http://localhost:5000/app/

# API proxy latency (requires a valid cookie)
curl -w '%{time_total}\n' -o /dev/null -s -b cookies.txt http://localhost:5000/api/me

# Chat round trip: time from send to first and last socket event in browser DevTools
```

---

## 5. Scaling guidance

### Small team / single Studio (recommended)

- One container, one PostgreSQL database for the CMS, `/data` volume.
- Keep the Studio behind authentication (VPN, SSO proxy, or network allowlist).
- Use provider keys with quotas and monitor usage in the provider console.
- Back up `/data` and the CMS database on a schedule.

This matches the current design.

### Multiple Studio users

- The global task queue and shared chat history become visible problems. Add user scoping before adding replicas.
- Keep one Node instance; scale the CMS/database if CMS traffic is the bottleneck.
- Consider moving the service database to PostgreSQL to reduce write contention on logs.

### Multiple Node replicas (requires code changes)

To run more than one Fastify instance you need:

1. Shared session storage (Redis or database-backed sessions) instead of `sessions.db`.
2. A shared cancellation/status mechanism (Redis pub/sub) instead of in-memory maps.
3. Atomic task checkout with ownership and leases.
4. Sticky Socket.IO sessions or a Socket.IO adapter (Redis) for cross-instance events.
5. A shared service database (PostgreSQL) instead of SQLite.

None of these are implemented.

### CMS scaling

The CMS is a separate application and may support read replicas, caching, or sharding. Those capabilities and their limits are defined outside this repository; do not infer them from the Node service.

---

## 6. Practical optimizations that do not require redesign

| Change | Effect |
|---|---|
| Enable Nginx caching for static SPA assets | Fewer requests to Fastify |
| Serve `/api` and `/graphql` directly from Nginx | Removes one proxy hop |
| Raise `LOG_LEVEL_FASTIFY` from `warn` only when debugging | Less log I/O |
| Prune `AiResponseLog` rows | Smaller SQLite file, faster log queries |
| Prune old chat messages | Smaller history queries |
| Use a smaller/faster model for classification and planning | Lower latency and cost |
| Build pages with fewer components per request | Fewer sequential model calls |
| Cancel runaway requests with `/cmsapi/chat/cancel` | Frees the user's pipeline |

---

## 7. Capacity planning checklist

- [ ] How many concurrent Studio users? (Current design assumes few.)
- [ ] How many chat messages per hour, and how many model calls per message?
- [ ] What is the provider's rate limit and per-token cost?
- [ ] How large will `AiResponseLog` grow, and what is the retention period?
- [ ] Is the CMS on SQLite or PostgreSQL? What are its backup and failover plans?
- [ ] How much asset storage is needed, and is `/data` sized for it?
- [ ] Is the Studio exposed to the public internet? If so, add access control before launch.

---

## 8. Honest summary

CMS is a **working single-node AI studio** with a strong separation between generation and the CMS runtime. It is not a horizontally scalable platform today. The main constraints are in-memory orchestration, a global task queue, SQLite for service state, and sequential LLM calls. Those are documented as roadmap work rather than presented as solved problems.
