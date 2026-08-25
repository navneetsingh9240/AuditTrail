/**
 * WEEK 1 — CQRS: Command side controller.
 * Only ever WRITES, via the Event Store service (Week 2 & 4 logic).
 */

const { appendEvent, ConcurrencyError } = require("../services/eventStore");

// POST /shipment/move  { aggregateId, eventType, payload, expectedVersion }
async function handleCommand(req, res) {
  const { aggregateId, eventType, payload, expectedVersion } = req.body;

  if (!aggregateId || !eventType || expectedVersion === undefined) {
    return res.status(400).json({
      error: "aggregateId, eventType, and expectedVersion are required",
    });
  }

  try {
    const event = await appendEvent(aggregateId, eventType, payload ?? {}, expectedVersion);
    return res.status(201).json({ event });
  } catch (err) {
    if (err instanceof ConcurrencyError) {
      return res.status(409).json({ error: err.message }); // 409 Conflict
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to append event" });
  }
}

module.exports = { handleCommand };
