# Audit Trail: Event-Sourced Inventory & Logistics Ledger (Backend API)

> **Enterprise-Grade Software Architecture using CQRS, Event Sourcing, Projections, State Scrubbing & Optimistic Concurrency Control (OCC)**

---

## 📋 Project Overview & Submission Matrix

In traditional CRUD designs, updating a product's inventory overwrites the previous state, causing data loss. In highly regulated industries (Logistics, FinTech), overwriting data is unacceptable; you must maintain an immutable, chronological log of **every** event that led to the current state.

The **Audit Trail Ledger** solves this problem by implementing a complete **Event-Sourced Architecture** with **CQRS (Command Query Responsibility Segregation)** in Express & Node.js with MongoDB.

### 🏛️ Deliverables Verification Matrix

| Milestone | Backend Architecture (CQRS & Event Store) | Status |
|---|---|---|
| **Week 1** | **CQRS Router Setup**: Express routers separating Commands (`/api/commands/*`) from Queries (`/api/queries/*`). | ✅ Complete |
| **Week 2** | **Append-Only Event Store**: Schema storing immutable domain events (`aggregateId`, `eventType`, `payload`, `timestamp`, `version`). | ✅ Complete |
| **Mid-Project Review** | **Immutability Audit**: Mongoose schema pre-hooks blocking all `UPDATE` & `DELETE` operations. State calculation by replaying historical events. | ✅ Complete |
| **Week 3** | **Projections (Read Models) & State Scrubbing**: Background worker (`projectionWorker.js`) and Point-in-time state scrubbing (`/api/queries/shipment/:id/scrub`). | ✅ Complete |
| **Week 4** | **Concurrency Control (OCC)**: Validates `expectedVersion` on command append. Rejects stale writes with `HTTP 409 Conflict`. | ✅ Complete |

---

## 📁 Repository Directory Structure

```text
backend/
├── package.json                      # Express, Mongoose, Dotenv, CORS
├── src/
│   ├── app.js                        # Express Application & Router Mounting
│   ├── server.js                     # HTTP Server Entry Point (Port 5000)
│   ├── seed.js                       # Database Seeder Script
│   ├── models/                       # Event.js (Immutable) & ShipmentReadModel.js
│   ├── store/                        # eventSourcingEngine.js & inMemoryStore.js
│   ├── services/                     # projectionWorker.js (Read Model Synchronizer)
│   ├── middleware/                   # commandValidator.js, errorHandler.js, requestLogger.js
│   ├── controllers/                  # commandController.js (OCC) & queryController.js
│   └── routes/                       # commandRoutes.js & queryRoutes.js
└── test/                             # testSuite.js & occTest.js
```

---

## 🛠️ Complete API Endpoint Specification

### Write Side — CQRS Command Router (`/api/commands` or `/commands`)

| Method | Endpoint | Description | OCC Support |
|---|---|---|---|
| `POST` | `/api/commands/shipment/create` or `/container/create` | Appends `SHIPMENT_CREATED` / `CONTAINER_CREATED` initial event | `expectedVersion: 0` |
| `POST` | `/api/commands/shipment/move` or `/container/move` | Appends `SHIPMENT_MOVED` event with new location | `expectedVersion: N` |
| `POST` | `/api/commands/shipment/status` or `/container/status` | Appends `STATUS_UPDATED` event | `expectedVersion: N` |
| `POST` | `/api/commands/shipment/sensor` or `/container/sensor` | Records `TEMPERATURE_SPIKE` or `SENSOR_READING` telemetry | `expectedVersion: N` |
| `POST` | `/api/commands/shipment/custom` or `/container/custom` | Appends arbitrary domain event with custom payload | `expectedVersion: N` |

---

### Read Side — CQRS Query Router (`/api/queries` or `/queries`)

| Method | Endpoint | Description | Read Path |
|---|---|---|---|
| `GET` | `/api/queries/shipments` or `/containers` | Fetches all projected shipment aggregates | Read Model Projection / Event Replay |
| `GET` | `/api/queries/shipment/:id` or `/container/:id` | Fetches current aggregate state snapshot | Read Model Projection / Event Replay |
| `GET` | `/api/queries/shipment/:id/events` | Retrieves complete append-only event stream history | Event Store Log |
| `GET` | `/api/queries/shipment/:id/scrub` | Point-in-Time State Scrubbing (`?version=N` or `?timestamp=...`) | Historical Event Replay Engine |
| `GET` | `/api/queries/shipment/:id/reconstruct` | Proves state calculation by replaying events step-by-step | Replay Step-by-Step |
| `GET` | `/api/queries/search` | Search shipments by ID, origin, destination, location, or status | Read Model / Replay |
| `GET` | `/api/queries/dashboard` | Aggregated dashboard dataset (stats, matched shipments, recent events) | Projection / Replay |
| `GET` | `/api/queries/audit/immutability` | Audit proof that `UPDATE` and `DELETE` operations are blocked | Immutability Protection Layer |
| `GET` | `/api/queries/audit/occ` | Audit proof that Optimistic Concurrency Control is active | OCC Verification Layer |

---

## ⚡ Quick Start

```bash
# Navigate to backend directory
cd AuditTrail/backend

# Install dependencies
npm install

# Start backend server (runs on http://localhost:5000)
npm start
```

## 🧪 Automated Testing

```bash
# Master Test Suite
npm test

# Concurrency Control (OCC) Test Suite
npm run test:occ
```
