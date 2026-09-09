# Audit Trail Backend — Event-Sourced Logistics Ledger

> **CQRS & Event Sourcing API Module**

## Features Summary
- **CQRS Command Router (`/api/commands/*`)**: `shipment/create`, `shipment/move`, `shipment/status`, `shipment/sensor`, `shipment/custom`.
- **CQRS Query Router (`/api/queries/*`)**: `shipments`, `shipment/:id`, `shipment/:id/events`, `shipment/:id/scrub`, `shipment/:id/reconstruct`, `search`, `dashboard`, `events`, `stats`, `projections`, `projections/status`, `projections/rebuild`, `audit/immutability`, `audit/occ`.
- **Optimistic Concurrency Control (OCC)**: Validates `expectedVersion` headers/body fields and returns HTTP 409 on version mismatch.
- **Event Store Immutability**: MongoDB schema pre-hooks block `updateOne`, `deleteOne`, `save()` on existing event documents.
- **State Scrubbing**: Rewinds aggregate state up to target timestamp or version sequence number.
- **Sensor Telemetry**: Captures temperature spikes, humidity, location traces, and calculates peak temperatures.

## Scripts
- `npm run dev`: Start backend server with `--watch`
- `npm start`: Start backend server
- `npm test`: Run master automated test suite
- `npm run test:occ`: Run OCC test suite
- `npm run seed`: Populate MongoDB Event Store with seed data
