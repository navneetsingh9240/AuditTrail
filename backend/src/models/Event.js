/**
 * WEEK 2 — Event Store Schema
 * ------------------------------------------------------------
 * Append-only collection. Every document is a single immutable
 * fact: "this happened, to this aggregate, at this version."
 *
 * Fields (per the project plan):
 *   aggregateId  -> which shipment/container this event belongs to
 *   eventType    -> e.g. CONTAINER_CREATED, LOADED_ON_SHIP, TEMPERATURE_SPIKE
 *   payload      -> arbitrary event data
 *   timestamp    -> when it happened
 *   version      -> monotonically increasing per aggregateId (used for OCC)
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const EventSchema = new Schema(
  {
    aggregateId: { type: String, required: true, trim: true, index: true },
    eventType: { type: String, required: true, trim: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    version: { type: Number, required: true, min: 1 },
  },
  {
    // No updatedAt — events are immutable and never updated.
    timestamps: { createdAt: true, updatedAt: false },
    collection: "events",
  }
);

// One event per (aggregateId, version) — unique constraint for Optimistic Concurrency Control (OCC)
// and ordered historical replay queries.
EventSchema.index({ aggregateId: 1, version: 1 }, { unique: true });

// Compound index for event stream filtering by aggregateId and eventType
EventSchema.index({ aggregateId: 1, eventType: 1, timestamp: -1 });

// ---- Immutability enforcement (Mid-Project Review deliverable) ----
// Block every mutating query-level operation at the schema level.
const BLOCKED_OPS = [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "replaceOne",
  "findOneAndReplace",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
  "findOneAndRemove",
  "remove",
];

BLOCKED_OPS.forEach((op) => {
  EventSchema.pre(op, function blockMutation() {
    throw new Error(
      `[EventStore] Illegal operation "${op}" — the Event Store is append-only. ` +
      `Events cannot be updated or deleted, only appended.`
    );
  });
});

const Event = model("Event", EventSchema);

export default Event;