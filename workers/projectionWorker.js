/**
 * WEEK 3 — Projections (Read Models)
 * ------------------------------------------------------------
 * Background worker: listens to the Event Store via a MongoDB
 * Change Stream and upserts the corresponding Read Model document
 * every time a new event is appended. This is what keeps reads fast
 * (Week 3 "State Scrubbing" UI queries this projection, not the events).
 *
 * Run standalone:  npm run worker
 * Requires MongoDB running as a replica set (change streams need it).
 */

const { connectDB } = require("../config/db");
const Event = require("../models/Event");
const ReadModel = require("../models/ReadModel");

// Reduces one event onto the read-model fields it affects.
function applyEventToReadModel(update, event) {
  update.version = event.version;
  update.updatedAt = event.timestamp;

  switch (event.eventType) {
    case "CONTAINER_CREATED":
      update.status = "CREATED";
      break;
    case "LOADED_ON_SHIP":
      update.status = "IN_TRANSIT";
      update.location = event.payload.location ?? update.location;
      break;
    case "TEMPERATURE_SPIKE":
      update.lastTemperature = event.payload.temperature ?? update.lastTemperature;
      break;
    case "ARRIVED_AT_PORT":
      update.status = "ARRIVED";
      update.location = event.payload.location ?? update.location;
      break;
    default:
      // Unknown event types are still recorded via version/updatedAt above.
      break;
  }
  return update;
}

async function projectEvent(event) {
  const update = applyEventToReadModel({}, event);

  // Only apply if this event is newer than what's already projected,
  // so replayed/out-of-order delivery can't move the read model backwards.
  await ReadModel.findOneAndUpdate(
    { shipmentId: event.aggregateId, version: { $lt: event.version } },
    { $set: { shipmentId: event.aggregateId, ...update } },
    { upsert: true }
  );

  console.log(`[projection] ${event.aggregateId} -> v${event.version} (${event.eventType})`);
}

async function catchUp() {
  // On startup, project anything the worker may have missed.
  const events = await Event.find().sort({ version: 1 }).lean();
  for (const event of events) {
    await projectEvent(event);
  }
}

async function start() {
  await connectDB();
  await catchUp();

  const changeStream = Event.watch([{ $match: { operationType: "insert" } }]);

  changeStream.on("change", (change) => {
    projectEvent(change.fullDocument).catch((err) =>
      console.error("[projection] failed:", err)
    );
  });

  console.log("[projection] worker listening for new events...");
}

if (require.main === module) {
  start().catch((err) => {
    console.error("[projection] fatal error:", err);
    process.exit(1);
  });
}

module.exports = { start, projectEvent, applyEventToReadModel };
