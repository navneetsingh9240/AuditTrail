# AuditTrail

**Event-Sourced Inventory & Logistics Ledger**

A production-quality, full-stack demonstration of **Event Sourcing + CQRS** applied to a supply-chain / container-logistics domain, built with Node.js, Express, MongoDB, and React.

---

## Overview

AuditTrail lets a logistics manager search for a shipping container and see:

- Its current state, reconstructed live from an immutable event log
- The complete chronological history of everything that ever happened to it
- Historical state at any previous point in time ("time travel")
- Temperature/sensor history with spike detection
- Cryptographic (SHA-256) proof that its history has not been tampered with
- Concurrency/version metadata for safe concurrent updates

## Problem

Traditional CRUD systems only ever store *the current row*. When a container's status changes, the old value is overwritten and lost. This makes it impossible to answer questions like "what did this container's state look like last Tuesday?" or "can we prove nobody quietly edited this shipment's history?" — both of which matter enormously in logistics auditing, compliance, and dispute resolution.

## Solution

AuditTrail never overwrites state. Instead:

1. Every change is captured as an **immutable, append-only event** (`CONTAINER_CREATED`, `TEMPERATURE_SPIKE`, `ARRIVED_AT_PORT`, ...).
2. The **Event Store** (a MongoDB collection) is the single source of truth.
3. **Current state is never stored directly** — it is always *derived* by replaying events through a pure reducer function.
4. A separate, disposable **read model** (`ContainerReadModel`) is maintained by a **projection worker** purely to make list/search queries fast. It can be deleted and rebuilt at any time from the event store.
5. **CQRS** cleanly separates the write path (Commands → validation → Event Store) from the read path (Queries → Read Model / replay).

```
Initial State + Ordered Events = Current State
```

## Architecture

```
                         React Frontend
                                │
                                ▼
                        Express REST API
                    ┌───────────┴───────────┐
                    ▼                       ▼
              Command API               Query API
                    │                       │
                    ▼                       ▼
           Command Handlers            Read Model
        (validation + business             │
              rules)                       │
                    │                       │
                    ▼                       │
          Event Sourcing Engine             │
        (aggregate reducer/replay) ◄────────┘ (fallback: replay
                    │                          straight from events)
                    ▼
          Immutable Event Store
                    │
                    ▼
                MongoDB
                    │
                    ▼
          Projection Worker  ──────► Read Model (ContainerReadModel)
                    │
                    ▼
            Socket.IO broadcast ──► connected dashboards update live
```

Commands and queries are implemented in fully separate modules (`src/commands/*`, `src/queries/*`, `src/controllers/commandController.js`, `src/controllers/queryController.js`, `src/routes/commandRoutes.js`, `src/routes/queryRoutes.js`) — there is no shared read/write path.

## Features

- Full event-sourced Container aggregate with 8 event types
- Append-only Event Store with **enforced immutability** (no update/delete route or method exists; attempts return HTTP 405)
- **Optimistic Concurrency Control** (expectedVersion / HTTP 409 on conflict)
- **SHA-256 hash chain** across every aggregate's event history, with a tamper-detection endpoint
- Historical state reconstruction by **timestamp** or **version**
- CQRS-separated REST API (Commands vs Queries)
- Disposable, rebuildable read-model projection (`npm run rebuild-projections`)
- Real-time dashboard updates via Socket.IO
- Enterprise-styled React dashboard: search, event timeline, time-travel slider, Recharts temperature chart with threshold line, location flow, and an integrity/audit panel
- Seed data for 3 containers, including a temperature-spike scenario and an unresolved cold-chain excursion
- Jest/Supertest test suite covering immutability, OCC, replay, historical reconstruction, business rules, tamper detection, and projection rebuilds

## Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.IO, Node `crypto` (SHA-256), Jest, Supertest, mongodb-memory-server
**Frontend:** React 18, Vite, React Router, Axios, Recharts, Socket.IO client, Lucide React icons
**Shared:** dotenv, cors

## Event Lifecycle

```
Command (HTTP POST)
   → Command Handler loads current state (replay of existing events)
   → Business rule validation (e.g. can't unload before arrival)
   → Payload validation
   → Event Store: append (OCC check + SHA-256 hash chain)
   → Projection Worker: updates ContainerReadModel + emits Socket.IO event
   → Query (HTTP GET) reads either the read model (list) or replays events (detail)
```

## Event Schema

Every document in the `events` collection:

| Field | Description |
|---|---|
| `eventId` | Unique event identifier (`evt_<uuid>`) |
| `aggregateId` | The container ID this event belongs to (e.g. `CNT-1001`) |
| `aggregateType` | Always `Container` in this domain |
| `eventType` | One of the 8 registered event types |
| `payload` | Event-specific data (location, temperature, etc.) |
| `timestamp` | When the event was recorded |
| `version` | This aggregate's sequence number (1, 2, 3, ...) — unique per `aggregateId` |
| `previousHash` | The `eventHash` of the prior event for this aggregate (`null` for the first event) |
| `eventHash` | `SHA256(eventId + aggregateId + eventType + payload + timestamp + version + previousHash)` |

## CQRS

- **Commands** (`POST /api/commands/...`) mutate state by appending events. They never read from or write to the read model directly.
- **Queries** (`GET /api/queries/...`) never mutate anything. They either replay events (authoritative, used for single-container detail/history/integrity) or read the projection (fast, used for the container list).

## Event Sourcing

The `Container` aggregate (`src/aggregates/containerAggregate.js`) exposes a pure `applyEvent(state, event)` reducer and a `replay(aggregateId, events)` function. Current state is *always* computed by fetching all events for an aggregate, sorting by version, and folding them over the initial state — there is no shortcut that reads a stored "current state" field from the event store.

## Optimistic Concurrency Control

Every command may include `expectedVersion`. The Event Store compares it against the aggregate's actual current version before appending:

- Match → event appended as `version = expectedVersion + 1`.
- Mismatch → `409 Conflict` with `{ expectedVersion, currentVersion }`, and no event is written.

A unique MongoDB index on `(aggregateId, version)` provides a database-level backstop against race conditions.

## Cryptographic Integrity

Each event's hash chains to the previous one, so altering any historical event (even a single byte of its payload) invalidates every hash computed after it. `GET /api/queries/containers/:id/integrity` recomputes every hash in the chain and reports whether it is intact, and if not, at which version it breaks.

## Time Travel

`GET /api/queries/containers/:id/state-at?timestamp=...` or `?version=...` filters the full event list down to only events up to that point, then replays them through the same reducer used for current state — guaranteeing historical and current state are always computed the same way.

---

## Setup

### Prerequisites
- Node.js 18+
- A running MongoDB instance (local or Atlas)

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd audittrail

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Backend

```bash
cd backend
npm install
npm run seed      # loads CNT-1001, CNT-1002, CNT-1003 with realistic event histories
npm run dev        # starts the API on http://localhost:5000
```

### 3. Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev        # starts the dashboard on http://localhost:5173
```

Open `http://localhost:5173`, search for `CNT-1001`, and explore.

### Rebuilding the read model

To prove the projection is fully disposable:

```bash
cd backend
npm run rebuild-projections
```

This clears `ContainerReadModel` entirely and rebuilds it by replaying every event in the `events` collection.

---

## API Documentation

### Commands (state-changing, append events)

| Method | Path | Description |
|---|---|---|
| POST | `/api/commands/containers` | Create a container (`containerId`, `origin`, `destination`, `cargoType`) |
| POST | `/api/commands/containers/:id/load` | Load onto a vessel (`vesselName`, `location`) |
| POST | `/api/commands/containers/:id/move` | Update location (`location`) |
| POST | `/api/commands/containers/:id/temperature` | Record a sensor reading (`temperature`, `location`) — auto-emits `TEMPERATURE_SPIKE` if over threshold |
| POST | `/api/commands/containers/:id/arrive` | Mark arrived at port (`portName`) |
| POST | `/api/commands/containers/:id/unload` | Unload (`location`) |
| POST | `/api/commands/containers/:id/complete` | Complete delivery (`receivedBy`) |
| PUT/PATCH/DELETE | `/api/commands/containers/:id` | **Always rejected** with `405` — events are immutable |

All command bodies may include `expectedVersion` for optimistic concurrency control.

### Queries (read-only)

| Method | Path | Description |
|---|---|---|
| GET | `/api/queries/containers` | List all containers (from the read model) |
| GET | `/api/queries/containers/:id` | Current reconstructed state (full replay) |
| GET | `/api/queries/containers/:id/events` | Full raw event history |
| GET | `/api/queries/containers/:id/timeline` | Timeline-friendly event data |
| GET | `/api/queries/containers/:id/state-at?timestamp=...` or `?version=...` | Historical state reconstruction |
| GET | `/api/queries/containers/:id/metrics` | Temperature + location series for charts |
| GET | `/api/queries/containers/:id/integrity` | Verifies the SHA-256 hash chain |

### Real-time

Socket.IO events broadcast from the server: `event:appended` (the raw new event) and `container:updated` (`{ containerId }`), used by the frontend to refresh without a manual reload.

---

## Testing

```bash
cd backend
npm test
```

Uses `mongodb-memory-server` so tests run against a real (in-memory) MongoDB with no external dependency. Coverage includes:

- **Event Store:** append, immutability (update/delete rejected), version ordering, duplicate-version prevention, OCC conflicts
- **Aggregate:** full replay, historical reconstruction by version and by timestamp
- **Commands:** valid/invalid commands, business rule enforcement, OCC conflicts
- **Integrity:** valid hash chains, tampered-event detection
- **Projection:** read-model updates on event append, full rebuild from the event store
- **API:** end-to-end command → query flow, 405 on mutation attempts, 404 on unknown containers, 409-class failures on conflicts

## Project Structure

```
audittrail/
├── backend/
│   └── src/
│       ├── config/        MongoDB connection
│       ├── controllers/   HTTP <-> command/query handler wiring
│       ├── routes/        Express routers (commands vs queries, kept separate)
│       ├── commands/      One handler per command; validation + business rules
│       ├── queries/       Read-side handlers (replay-based + read-model-based)
│       ├── events/        Event types, hash chain, event store, validator, integrity verifier
│       ├── aggregates/    Container reducer + business rule guards
│       ├── projections/   Read-model projection + worker
│       ├── models/        Mongoose schemas (Event, ContainerReadModel)
│       ├── seed/          Seed script
│       └── scripts/       Projection rebuild script
├── frontend/
│   └── src/
│       ├── components/    SearchBar, EventTimeline, EventCard, HistoricalSlider,
│       │                  TemperatureChart, LocationHistory, IntegrityBadge/Panel
│       ├── pages/         Dashboard, ContainerDetails
│       ├── services/      Axios API client
│       └── hooks/         Socket.IO hook
└── package.json           Root convenience scripts
```

## Future Enhancements

- Authentication & role-based access control
- Kafka-based event streaming (replace the in-process projection worker)
- Distributed / independently-scalable projections
- Cloud deployment (containerized, managed MongoDB)
- Blockchain anchoring of periodic hash-chain checkpoints for external notarization
- Advanced analytics (predictive ETA, cold-chain risk scoring)
