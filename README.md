# AuditTrail — Event-Sourced Inventory & Logistics Ledger

[![Event Sourcing](https://img.shields.io/badge/Architecture-Event%20Sourcing%20%2B%20CQRS-blue.svg)](https://martinfowler.com/eaaDev/EventSourcing.html)
[![SHA-256](https://img.shields.io/badge/Security-SHA--256%20Hash%20Chain-emerald.svg)]()
[![Tests](https://img.shields.io/badge/Tests-10%2F10%20Passing-brightgreen.svg)]()

**AuditTrail** is an enterprise-grade logistics and supply-chain audit platform engineered using **Event Sourcing**, **CQRS (Command Query Responsibility Segregation)**, **MongoDB**, **Node.js/Express**, **React**, and **Recharts**.

Unlike traditional CRUD applications that mutate records in-place and permanently destroy historical context, AuditTrail calculates all business state by replaying an **immutable, append-only event store**.

---

## 🎯 Problem vs Solution

### The Problem with Traditional CRUD
In traditional CRUD (Create, Read, Update, Delete) logistics applications:
- Overwriting database rows (`UPDATE containers SET location = 'Mumbai' WHERE id = 'CNT-1001'`) erases previous locations and temperatures.
- Auditing requires intrusive trigger tables or manual log files that can be altered, lost, or bypassed.
- Historical state at an arbitrary past timestamp (e.g., "Where was container CNT-1001 on August 14th at 02:41 AM?") cannot be reconstructed accurately.

### The AuditTrail Solution
AuditTrail adopts an **Event-Sourced Architecture**:
- **Immutable Ledger**: Business facts are stored as append-only domain events (`CONTAINER_CREATED`, `LOADED_ON_SHIP`, `LOCATION_UPDATED`, `TEMPERATURE_SPIKE`, `ARRIVED_AT_PORT`, `UNLOADED`, `DELIVERY_COMPLETED`).
- **State Derivation**: `Current State = Replay(Initial State + Ordered Events)`.
- **Time Travel**: Reconstructing historical state is a matter of filtering and replaying events up to any given version or timestamp.
- **Cryptographic Hash Chain**: Every event contains an SHA-256 hash incorporating the previous event's hash (`previousHash`), forming an unforgeable tamper-evident chain.
- **CQRS & Projections**: Write operations (Commands) append to the Event Store, while optimized Read Models (`ContainerReadModel`) power high-speed dashboard queries and can be rebuilt at any time from scratch (`npm run rebuild-projections`).

---

## 📐 System Architecture

```
                                  AuditTrail Architecture

   +-----------------------------------------------------------------------------------+
   |                                 React Frontend                                    |
   |   [Dashboard]  [Time Travel Scrubbing Slider]  [Recharts Telemetry]  [SHA-256 Badge]|
   +---------------------------------------+-------------------------------------------+
                                           |
                                  HTTP REST / WebSocket (Socket.IO)
                                           |
   +---------------------------------------v-------------------------------------------+
   |                             Node.js / Express API                                 |
   |                                                                                   |
   |    COMMAND API (Writes)                             QUERY API (Reads)             |
   |  POST /api/commands/...                           GET /api/queries/...            |
   |          |                                                |                       |
   |          v                                                v                       |
   |    Command Handlers                                 Query Handlers                |
   |    (Business Validation & OCC)                      (State Replay & Time Travel)  |
   |          |                                                ^                       |
   |          v                                                |                       |
   |    Event Store Engine                                     |                       |
   |    (Hash Chaining: SHA-256)                               |                       |
   |          |                                                |                       |
   +----------|------------------------------------------------|-----------------------+
              |                                                |
              v                                                |
   +---------------------+   Async Projection Worker   +-------+---------------+
   |   Event Store       |---------------------------->| ContainerReadModel    |
   |  (Immutable Stream) |                             |  (Query Projection)   |
   +---------------------+                             +-----------------------+
              |                                                |
              +-----------------------+------------------------+
                                      |
                                      v
                               [ MongoDB Database ]
```

---

## 🚀 Key Features

1. **Immutable Append-Only Event Store**:
   - Mongoose pre-hooks strictly block `update`, `overwrite`, and `delete` operations at the database level.
   - Enforces sequential aggregate versions (`version: N+1`). Duplicate versions trigger `409 Conflict`.
2. **Time Travel State Scrubbing**:
   - Interactive UI slider allows managers to scrub back to any previous version or timestamp to inspect historical location, temperature, and status.
3. **Cryptographic SHA-256 Event Integrity**:
   - Computes SHA-256 hash chains over immutable fields (`eventId`, `aggregateId`, `eventType`, `payload`, `timestamp`, `version`, `previousHash`).
   - Endpoint `/api/queries/containers/:id/integrity` verifies chain unbroken continuity.
4. **Optimistic Concurrency Control (OCC)**:
   - Client sends `expectedVersion`. If the container was concurrently updated by another process, the server responds with `409 Conflict`.
5. **CQRS Read Model & Projection Rebuilding**:
   - Read models are lightweight query projections updated by the projection worker.
   - Executing `npm run rebuild-projections` wipes read models and rebuilds all projections by replaying the authoritative Event Store from scratch.
6. **Real-Time Telemetry & Telemetry Charting**:
   - Recharts visualizes temperature history and highlights `TEMPERATURE_SPIKE` events whenever temperature exceeds configured thresholds.
7. **Real-Time Socket.IO Updates**:
   - Pushes live event append notifications directly to connected frontends.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MongoDB / Mongoose, Socket.IO, Crypto module, Dotenv, Cors, Jest, Supertest.
- **Frontend**: React.js, Vite, React Router, Axios, Recharts, Lucide React, Tailwind CSS.

---

## 📋 Event Schema

Each document in the MongoDB `events` collection follows this schema:

```json
{
  "eventId": "evt_1787084429482_x8k2l9p",
  "aggregateId": "CNT-1001",
  "aggregateType": "Container",
  "eventType": "TEMPERATURE_SPIKE",
  "payload": {
    "temperature": 12.8,
    "threshold": 8.0,
    "location": "Arabian Sea"
  },
  "timestamp": "2026-08-18T10:30:00.000Z",
  "version": 5,
  "previousHash": "a3b8c2d1e0f9...",
  "eventHash": "f8a7e6d5c4b3..."
}
```

### Supported Event Types
- `CONTAINER_CREATED`
- `LOADED_ON_SHIP`
- `LOCATION_UPDATED`
- `TEMPERATURE_RECORDED`
- `TEMPERATURE_SPIKE`
- `ARRIVED_AT_PORT`
- `UNLOADED`
- `DELIVERY_COMPLETED`

---

## ⚡ API Endpoints

### Command Endpoints (Writes)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/commands/containers` | Create a new container aggregate |
| `POST` | `/api/commands/containers/:id/load` | Load container onto ship |
| `POST` | `/api/commands/containers/:id/move` | Update waypoint location |
| `POST` | `/api/commands/containers/:id/temperature` | Record temperature telemetry |
| `POST` | `/api/commands/containers/:id/arrive` | Mark container arrival at port |
| `POST` | `/api/commands/containers/:id/unload` | Unload container at terminal |
| `POST` | `/api/commands/containers/:id/complete` | Complete container delivery |

### Query Endpoints (Reads)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/queries/containers` | List all container read model projections |
| `GET` | `/api/queries/containers/:id` | Reconstruct current aggregate state |
| `GET` | `/api/queries/containers/:id/events` | Retrieve complete event history |
| `GET` | `/api/queries/containers/:id/timeline` | Get timeline-formatted event stream |
| `GET` | `/api/queries/containers/:id/state-at` | Reconstruct historical state (`?version=X` or `?timestamp=Y`) |
| `GET` | `/api/queries/containers/:id/metrics` | Retrieve temperature telemetry metrics |
| `GET` | `/api/queries/containers/:id/integrity` | Verify SHA-256 cryptographic hash chain |

---

## 📦 Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (or automates seamlessly with embedded MongoDB)

### 1. Installation
```bash
git clone <repository-url>
cd audittrail

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Seed Database
Seed standard sample containers (`CNT-1001` with cold-chain temperature spike, `CNT-1002`, `CNT-1003`):
```bash
cd backend
npm run seed
```

### 3. Start Backend Server
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

### 4. Start Frontend Application
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Testing

Run the automated backend test suite (covering Event Store Immutability, OCC, Replay, Cryptographic Hash Chain, and Projection Rebuilds):

```bash
cd backend
npm test
```

### Rebuilding Projections Demonstration
To demonstrate that `ContainerReadModel` is purely a projection and not the source of truth, run:
```bash
cd backend
npm run rebuild-projections
```
This command clears the read model collection, reads all events from the Event Store, replays them sequentially, and regenerates the read model projections.

---

## 🔮 Future Enhancements
- Role-Based Access Control (RBAC) & OAuth2 JWT authentication.
- Distributed event streaming with Apache Kafka / RabbitMQ.
- External blockchain anchoring (e.g. Ethereum / Hyperledger) for immutable hash proofs.
- Geospatial mapping visualization for interactive ship routing.

---

## 📄 License
MIT License. Built for enterprise supply chain and event-sourced ledger audits.
