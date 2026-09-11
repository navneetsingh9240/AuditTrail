# Audit Trail: Event-Sourced Inventory & Logistics Ledger

> **Enterprise-Grade Software Architecture using CQRS, Event Sourcing, Projections & Optimistic Concurrency Control**

---

## 📋 Project Overview & Final Submission Deliverables

In traditional MongoDB designs (CRUD), updating a product's inventory from 10 to 5 overwrites the previous state, causing irreversible data loss. In highly regulated industries like Supply Chain Logistics and FinTech, overwriting historical state is unacceptable. 

The **Audit Trail Ledger Backend** solves this problem by implementing a complete **Event-Sourced Architecture** with **CQRS (Command Query Responsibility Segregation)**:

1. **Append-Only Event Store (Week 2 & Final Review)**: Stores raw, immutable domain events (`CONTAINER_CREATED` $\rightarrow$ `LOADED_ON_SHIP` $\rightarrow$ `TEMPERATURE_SPIKE` $\rightarrow$ `ARRIVED_AT_PORT`). Schema includes `aggregateId`, `eventType`, `payload`, `timestamp`, and `version`.
2. **Mathematical State Folding Engine (Week 1 & 2)**: Replays event streams in strict version order to mathematically fold events into the aggregate's current state at runtime.
3. **CQRS Command & Query Segregation (Week 1)**: Express routers split write operations (`POST /api/commands/*`) from read operations (`GET /api/queries/*`).
4. **Immutability Protection Audit (Mid-Project Review)**: Mongoose schema pre-hooks explicitly block all `UPDATE` and `DELETE` operations on the Event Store collection (`updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany`, `.save()` on existing instances).
5. **Fast Read Model Projections (Week 3)**: A background worker (`projectionWorker.js`) listens to event appends and updates a denormalized `ShipmentReadModel` collection for $O(1)$ read performance.
6. **State Scrubbing / Time Travel Engine (Week 3)**: Reconstructs exact historical container states as they existed at any past timestamp or version sequence (`GET /api/queries/shipment/:id/scrub?version=N`).
7. **Optimistic Concurrency Control (OCC) (Week 4)**: Prevents race conditions and dirty writes by checking aggregate version numbers. Rejects stale writes with `HTTP 409 Conflict`.
8. **Forensic Telemetry & Sensor Alerting**: Tracks temperature spikes, humidity readings, and alerts when cold-chain thresholds are breached.

---

## 📁 Backend Architecture & Directory Structure

```text
AuditTrail/
└── backend/                              # CQRS & Event-Sourced Backend Module
    ├── package.json                      # Express, Mongoose, Dotenv, CORS
    ├── .env.example                      # Server & DB Port Configuration
    ├── README.md                         # Backend Module Quick Reference
    ├── test/
    │   ├── testSuite.js                  # Final Submission Automated Master Test Suite
    │   └── occTest.js                    # Week 4 Concurrency Control Test Suite
    └── src/
        ├── app.js                        # Express Application Entry & CQRS Router Mounting
        ├── server.js                     # HTTP Server Bootstrapper & Endpoint Directory
        ├── seed.js                       # Standalone Database Seeder Script
        ├── config/
        │   ├── corsOptions.js            # Security & Cross-Origin Resource Policy
        │   └── db.js                     # Hybrid MongoDB / In-Memory Connection Manager
        ├── store/
        │   ├── eventSourcingEngine.js    # Mathematical State Folding & Point-in-Time Scrubbing
        │   └── inMemoryStore.js          # Standalone In-Memory Event Store & Fallback Cache
        ├── models/
        │   ├── Event.js                  # Immutable Mongoose Event Store Schema
        │   └── ShipmentReadModel.js      # Denormalized Read Model Snapshot Schema
        ├── services/
        │   └── projectionWorker.js       # Asynchronous Read Model Projection Synchronizer
        ├── controllers/
        │   ├── commandController.js      # Write Side Handlers (Create, Move, Status, Sensor, Custom)
        │   └── queryController.js        # Read Side Handlers (Get, Search, Scrub, Audit, OCC)
        ├── middleware/
        │   ├── commandValidator.js      # CQRS Command Payload & OCC Parameter Validator
        │   ├── errorHandler.js          # Centralized Exception Formatter
        │   └── requestLogger.js         # Structured CQRS Request Logger
        └── routes/
            ├── commandRoutes.js         # Write Router (/api/commands/*)
            └── queryRoutes.js           # Read Router (/api/queries/*)
```

---

## 🛠️ Complete API Endpoint Specification

### Write Side — CQRS Command Router (`/api/commands` or `/commands`)

| Method | Endpoint | Description | OCC Support |
|---|---|---|---|
| `POST` | `/api/commands/shipment/create` | Appends `SHIPMENT_CREATED` / `CONTAINER_CREATED` initial event | `expectedVersion: 0` |
| `POST` | `/api/commands/shipment/move` | Appends `SHIPMENT_MOVED` event with new location | `expectedVersion: N` |
| `POST` | `/api/commands/shipment/status` | Appends `STATUS_UPDATED` event | `expectedVersion: N` |
| `POST` | `/api/commands/shipment/sensor` | Records `TEMPERATURE_SPIKE` or `SENSOR_READING` telemetry | `expectedVersion: N` |
| `POST` | `/api/commands/shipment/custom` | Appends arbitrary domain event with custom payload | `expectedVersion: N` |

---

### Read Side — CQRS Query Router (`/api/queries` or `/queries`)

| Method | Endpoint | Description | Read Path |
|---|---|---|---|
| `GET` | `/api/queries/shipments` | Fetches all projected shipment aggregates | Read Model Projection / Event Replay |
| `GET` | `/api/queries/shipment/:id` | Fetches current aggregate state snapshot | Read Model Projection / Event Replay |
| `GET` | `/api/queries/shipment/:id/events` | Retrieves complete append-only event stream history | Event Store Log |
| `GET` | `/api/queries/shipment/:id/scrub` | Point-in-Time State Scrubbing (`?version=N` or `?timestamp=...`) | Historical Event Replay Engine |
| `GET` | `/api/queries/shipment/:id/reconstruct` | Proves state calculation by replaying events step-by-step | Replay Step-by-Step |
| `GET` | `/api/queries/search` | Search shipments by ID, origin, destination, location, or status | Read Model / Replay |
| `GET` | `/api/queries/dashboard` | Aggregated dashboard dataset (stats, matched shipments, recent events) | Projection / Replay |
| `GET` | `/api/queries/events` | Filtered event stream (`?eventType=...`, `?aggregateId=...`, `?limit=...`) | Event Store Log |
| `GET` | `/api/queries/stats` | System telemetry metrics and status counts | Projection / Store Stats |
| `GET` | `/api/queries/projections` | Denormalized read model snapshots | Read Model Collection |
| `GET` | `/api/queries/projections/status` | Sync status between Event Store and Read Models | Projection Worker Metrics |
| `POST` | `/api/queries/projections/rebuild` | Triggers background rebuild of all read models | Projection Worker |
| `GET` | `/api/queries/audit/immutability` | Audit proof that `UPDATE` and `DELETE` operations are blocked | Immutability Protection Layer |
| `GET` | `/api/queries/audit/occ` | Audit proof that Optimistic Concurrency Control is active | OCC Verification Layer |

---

## ⚡ Execution & Automated Verification

### 1. Requirements & Dependencies
Ensure Node.js (v18+) is installed.

```bash
# Navigate to backend module
cd AuditTrail/backend

# Install dependencies
npm install
```

### 2. Database Seeding
```bash
npm run seed
```

### 3. Start Development Server
```bash
npm run dev
# Server will start on http://localhost:5000
```

### 4. Run Automated Test Suites
```bash
# Master Test Suite (Tests end-to-end CQRS, Immutability, OCC, Scrubbing, Reconstruction)
npm test

# Dedicated Concurrency Control (OCC) Test Suite
npm run test:occ
```

---

## 🏛️ Enterprise Architectural Verification Matrix

| Week | Feature Area | Backend Component | Implementation Status |
|---|---|---|---|
| **Week 1** | CQRS Setup | Express Routers (`commandRoutes.js`, `queryRoutes.js`) | ✅ Complete & Verified |
| **Week 2** | Event Store Schema | Mongoose `Event` Schema (`aggregateId`, `eventType`, `payload`, `timestamp`, `version`) | ✅ Complete & Verified |
| **Mid-Project** | Immutability Audit | Schema pre-hooks blocking `UPDATE` & `DELETE` operations | ✅ Complete & Verified |
| **Mid-Project** | Reconstruction Check | Mathematical event state folding engine (`eventSourcingEngine.js`) | ✅ Complete & Verified |
| **Week 3** | Read Model Projections | Asynchronous background listener (`projectionWorker.js`) & `ShipmentReadModel` | ✅ Complete & Verified |
| **Week 3** | State Scrubbing | Point-in-time state scrubbing by timestamp/version (`foldEventsUpToPointInTime`) | ✅ Complete & Verified |
| **Week 4** | Concurrency Control | Optimistic Concurrency Control checking `expectedVersion` & returning HTTP 409 | ✅ Complete & Verified |
| **Final Review**| Enterprise Architecture | Full event sourcing, hybrid database/in-memory auto-healing, master test suite | ✅ Complete & Verified |