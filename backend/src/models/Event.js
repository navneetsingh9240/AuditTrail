/**
 * WEEK 2 — Event Store Schema
 * ------------------------------------------------------------
 * Append-only collection. Every document is a single immutable
 * fact: "this happened, to this aggregate, at this version."
 *
 * Fields (per the project plan):
 *   aggregateId  -> which shipment/container this event belongs to
 *   eventType    -> e.g. SHIPMENT_CREATED, SHIPMENT_MOVED, STATUS_UPDATED, TEMPERATURE_SPIKE
 *   payload      -> arbitrary event data
 *   timestamp    -> when it happened
 *   version      -> monotonically increasing per aggregateId (used for OCC)
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const EventSchema = new Schema(
  {
    aggregateId: { type: String, required: [true, 'aggregateId is required'], trim: true, index: true },
    eventType: {
      type: String,
      required: [true, 'eventType is required'],
      trim: true,
      uppercase: true,
      immutable: true,
      index: true,
      validate: {
        validator: function (v) {
          return typeof v === 'string' && v.trim().length > 0 && /^[A-Z0-9_]+$/.test(v.trim());
        },
        message: (props) =>
          `[EventStore Error] '${props.value}' is not a valid eventType. Event types must be non-empty uppercase strings with letters, numbers, or underscores (e.g. SHIPMENT_CREATED, STATUS_UPDATED).`
      }
    },
    payload: {
      type: Schema.Types.Mixed,
      required: [true, 'payload is required'],
      immutable: true,
      validate: {
        validator: function (v) {
          return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0;
        },
        message: (props) =>
          `[EventStore Error] Event payload must be a non-empty object containing event data.`
      }
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is required'],
      default: Date.now,
      immutable: true,
      index: true,
      validate: {
        validator: function (v) {
          if (!v) return false;
          const d = new Date(v);
          if (!(d instanceof Date) || isNaN(d.getTime())) return false;
          // Prevent far-future timestamps (allow 5-minute clock skew tolerance)
          const MAX_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
          return d.getTime() <= Date.now() + MAX_FUTURE_TOLERANCE_MS;
        },
        message: (props) =>
          `[EventStore Error] '${props.value}' is not a valid timestamp. Timestamp must be a valid past or present Date object or ISO date string.`
      }
    },
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

// Standalone index for event log filtering by eventType ordered by timestamp
EventSchema.index({ eventType: 1, timestamp: -1 });

// Compound index for event stream filtering by aggregateId and eventType
EventSchema.index({ aggregateId: 1, eventType: 1, timestamp: -1 });

// Index for timestamp range queries
EventSchema.index({ timestamp: -1 });

// Static helper method to search event stream by eventType
EventSchema.statics.findByEventType = function(eventType, limit = 50) {
  if (!eventType || eventType.toUpperCase() === 'ALL') {
    return this.find({}).sort({ timestamp: -1 }).limit(limit);
  }
  const normalizedType = String(eventType).trim().toUpperCase();
  return this.find({ eventType: normalizedType })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static helper method to query events within a timestamp range
EventSchema.statics.findByTimeRange = function(startDate, endDate, limit = 50) {
  const query = {};
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new Error(`[EventStore Error] Invalid startDate '${startDate}' provided for time range query.`);
    }
    query.timestamp = { $gte: start };
  }
  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new Error(`[EventStore Error] Invalid endDate '${endDate}' provided for time range query.`);
    }
    query.timestamp = query.timestamp || {};
    query.timestamp.$lte = end;
  }
  const parsedLimit = parseInt(limit, 10) || 50;
  return this.find(query).sort({ timestamp: -1 }).limit(parsedLimit);
};

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