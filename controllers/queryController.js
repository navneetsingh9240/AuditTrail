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
    const shipmentId = req.params.id;

    if (!shipmentId || !shipmentId.trim()) {
        return res.status(400).json({
            error: "Shipment ID is required"
        });
    }

    const shipment = await ReadModel
        .findOne({ shipmentId: shipmentId.trim() })
        .lean();

    if (!shipment) {
        return res.status(404).json({
            error: "Shipment not found"
        });
    }

    return res.json(shipment);
}

// GET /shipment/:id/history -> raw event stream, for the Timeline UI
async function getStateAsOf(req, res) {
    const shipmentId = req.params.id;
    const { asOf } = req.query;

    if (!shipmentId || !shipmentId.trim()) {
        return res.status(400).json({
            error: "Shipment ID is required"
        });
    }

    if (!asOf) {
        return res.status(400).json({
            error: "asOf timestamp is required"
        });
    }

    const asOfDate = new Date(asOf);

    if (Number.isNaN(asOfDate.getTime())) {
        return res.status(400).json({
            error: "Invalid asOf timestamp"
        });
    }

    

// GET /shipment/:id/as-of?timestamp=... -> "rewind time" reconstruction

module.exports = { getCurrentState, getHistory, getStateAsOf };
