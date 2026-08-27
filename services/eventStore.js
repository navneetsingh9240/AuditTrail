/**
 * WEEK 4 — Concurrency Control (Optimistic Concurrency Control)
 * MID-PROJECT REVIEW — Reconstruction Check (replay events -> current state)
 * ------------------------------------------------------------
 * appendEvent() is the ONLY way events enter the store. It relies on the
 * unique compound index { aggregateId: 1, version: 1 } defined in
 * models/Event.js to make the "reject if version has changed" check
 * atomic at the database level — no separate read-then-write race window.
 */

const Event = require("../models/Event");

class ConcurrencyError extends Error {
  constructor(aggregateId, attemptedVersion) {
    super(
      `[OCC] Version conflict on aggregate "${aggregateId}": ` +
        `attempted to write version ${attemptedVersion}, but it already exists. ` +
        `Reload the shipment and retry the command.`
    );
    this.name = "ConcurrencyError";
    this.aggregateId = aggregateId;
    this.attemptedVersion = attemptedVersion;
  }
}

/**
 * Append a new event, guarded by optimistic concurrency control.
 *
 * @param {string} aggregateId  e.g. shipment/container id
 * @param {string} eventType    e.g. "TEMPERATURE_SPIKE"
 * @param {object} payload      event-specific data
 * @param {number} expectedVersion  the version the client last saw (0 if new aggregate)
 * @returns {Promise<object>} the newly stored event
 * @throws {ConcurrencyError} if expectedVersion is stale
 */
async function appendEvent(aggregateId, eventType, payload, expectedVersion) {
  const nextVersion = expectedVersion + 1;

  try {
    const event = await Event.create({
      aggregateId,
      eventType,
      payload,
      version: nextVersion,
      timestamp: new Date(),
    });
    return event;
  } catch (err) {
    // Duplicate key on { aggregateId, version } == someone else already
    // wrote this version first. That's exactly what OCC should reject.
    if (err.code === 11000) {
      throw new ConcurrencyError(aggregateId, nextVersion);
    }
    throw err;
  }
}

/** Fetch the raw, ordered event stream for one aggregate. */
async function getEventStream(aggregateId) {
  return Event.find({ aggregateId }).sort({ version: 1 }).lean();
}

/**
 * Reconstruct current (or historical) state by folding events.
 *
 * @param {string} aggregateId
 * @param {(state:object, event:object) => object} reducer  how one event mutates state
 * @param {object} [options]
 * @param {Date}   [options.asOf]      only fold events up to this timestamp ("rewind time")
 * @param {number} [options.asOfVersion] only fold events up to this version
 */
async function replay(aggregateId, reducer, options = {}) {
  const query = { aggregateId };
  if (options.asOf) query.timestamp = { $lte: options.asOf };
  if (options.asOfVersion) query.version = { $lte: options.asOfVersion };

  const events = await Event.find(query).sort({ version: 1 }).lean();

  return events.reduce(reducer, { aggregateId, version: 0 });
}

module.exports = { appendEvent, getEventStream, replay, ConcurrencyError };
