/**
 * WEEK 1 — CQRS: Query side controller.
 * Fast path reads from the Read Model (Week 3).
 * Historical/"rewind time" reads replay the Event Store directly
 * (Mid-Project Review reconstruction check / Week 3 state scrubbing).
 */

const ReadModel = require("../models/ReadModel");
const { replay } = require("../services/eventStore");
const { applyEventToReadModel } = require("../workers/projectionWorker");

// GET /shipment/:id  -> current state, fast path via Read Model
async function getCurrentState(req, res) {
  const shipment = await ReadModel.findOne({ shipmentId: req.params.id }).lean();
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });
  return res.json(shipment);
}

// GET /shipment/:id/history -> raw event stream, for the Timeline UI
async function getHistory(req, res) {
  const { getEventStream } = require("../services/eventStore");
  const events = await getEventStream(req.params.id);
  return res.json({ aggregateId: req.params.id, events });
}

// GET /shipment/:id/as-of?timestamp=... -> "rewind time" reconstruction
async function getStateAsOf(req, res) {
  const { timestamp } = req.query;
  if (!timestamp) return res.status(400).json({ error: "timestamp query param required" });

  const state = await replay(
    req.params.id,
    (acc, event) => applyEventToReadModel(acc, event),
    { asOf: new Date(timestamp) }
  );

  return res.json(state);
}

module.exports = { getCurrentState, getHistory, getStateAsOf };
