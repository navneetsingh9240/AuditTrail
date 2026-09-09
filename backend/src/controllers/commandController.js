/**
 * Command Controller (Write Side Operations) - CQRS & Event Store
 * Receives mutation requests, validates inputs via middleware, and appends events to the MongoDB Event Store / in-memory store.
 * Week 4: Implements Optimistic Concurrency Control (OCC) version checking.
 */
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import projectionWorker from '../services/projectionWorker.js';
import { appendEvent, getShipmentByIdFromStore } from '../store/inMemoryStore.js';

/**
 * Helper to extract optional expectedVersion from request body or header.
 */
const extractExpectedVersion = (req) => {
  const raw = req.body?.expectedVersion ?? req.body?.version ?? req.body?.expectedEventVersion ?? req.headers['x-expected-version'];
  if (raw !== undefined && raw !== null && raw !== '') {
    const parsed = Number(raw);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

/**
 * Handle OCC errors cleanly across all command handlers
 */
const handleCommandError = (error, res, next, shipmentId) => {
  if (error.isOccConflict) {
    return res.status(409).json({
      success: false,
      error: 'Optimistic Concurrency Control (OCC) Conflict',
      message: error.message,
      aggregateId: error.aggregateId || shipmentId,
      expectedVersion: error.expectedVersion,
      currentVersion: error.currentVersion,
      code: 'CONCURRENCY_CONFLICT',
      timestamp: new Date().toISOString()
    });
  }

  if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
    return res.status(409).json({
      success: false,
      error: 'Optimistic Concurrency Control (OCC) Conflict',
      message: `Concurrent write conflict: An event for aggregate '${shipmentId}' at this version has already been appended.`,
      aggregateId: shipmentId,
      code: 'CONCURRENCY_CONFLICT',
      timestamp: new Date().toISOString()
    });
  }

  next(error);
};

// POST /api/commands/shipment/create
export const createShipment = async (req, res, next) => {
  try {
    const { shipmentId, origin, destination, carrier } = req.body;
    const expectedVersion = extractExpectedVersion(req);

    if (expectedVersion !== undefined && expectedVersion > 0) {
      return res.status(409).json({
        success: false,
        error: 'Optimistic Concurrency Control (OCC) Conflict',
        message: `Command rejected: Cannot create new shipment '${shipmentId}' with expectedVersion ${expectedVersion} > 0. Expected version for creation is 0.`,
        aggregateId: shipmentId,
        expectedVersion,
        currentVersion: 0,
        code: 'CONCURRENCY_CONFLICT',
        timestamp: new Date().toISOString()
      });
    }

    let existing = false;
    if (mongoose.connection.readyState === 1) {
      const latestVersion = await Event.getLatestVersion(shipmentId);
      existing = latestVersion > 0;
    } else {
      existing = !!getShipmentByIdFromStore(shipmentId);
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Aggregate conflict: Shipment '${shipmentId}' already exists. Use MOVE or UPDATE commands.`
      });
    }

    const payload = {
      origin,
      destination,
      carrier: carrier || 'Standard Logistics',
      status: 'CREATED'
    };

    let generatedEvent;

    if (mongoose.connection.readyState === 1) {
      const doc = await Event.create({
        aggregateId: shipmentId,
        eventType: 'SHIPMENT_CREATED',
        payload,
        version: 1,
        timestamp: new Date()
      });
      generatedEvent = doc.toObject();
      appendEvent(shipmentId, 'SHIPMENT_CREATED', payload, expectedVersion);
      projectionWorker.emit('event:appended', generatedEvent);
    } else {
      generatedEvent = appendEvent(shipmentId, 'SHIPMENT_CREATED', payload, expectedVersion);
    }

    res.setHeader('x-command-id', `cmd_${Date.now()}`);
    res.setHeader('x-event-version', generatedEvent.version);

    return res.status(201).json({
      success: true,
      message: "Command Accepted & Event Persisted: SHIPMENT_CREATED",
      command: {
        type: "CREATE_SHIPMENT",
        aggregateId: shipmentId,
        version: generatedEvent.version,
        payload: { origin, destination, carrier: payload.carrier },
        timestamp: generatedEvent.timestamp
      },
      event: generatedEvent
    });
  } catch (error) {
    handleCommandError(error, res, next, req.body?.shipmentId);
  }
};

// POST /api/commands/shipment/move
export const moveShipment = async (req, res, next) => {
  try {
    const { shipmentId, location, status } = req.body;
    const expectedVersion = extractExpectedVersion(req);

    let latestVersion = 0;
    if (mongoose.connection.readyState === 1) {
      latestVersion = await Event.getLatestVersion(shipmentId);
    } else {
      const existing = getShipmentByIdFromStore(shipmentId);
      latestVersion = existing ? existing.version : 0;
    }

    if (latestVersion === 0) {
      return res.status(404).json({
        success: false,
        error: `Aggregate not found: Cannot move shipment '${shipmentId}' before creation.`
      });
    }

    // OCC Check: Verify expected version matches database version before append
    if (expectedVersion !== undefined && expectedVersion !== latestVersion) {
      return res.status(409).json({
        success: false,
        error: 'Optimistic Concurrency Control (OCC) Conflict',
        message: `Command rejected for aggregate '${shipmentId}': expected version ${expectedVersion}, but current version in database is ${latestVersion}.`,
        aggregateId: shipmentId,
        expectedVersion,
        currentVersion: latestVersion,
        code: 'CONCURRENCY_CONFLICT',
        timestamp: new Date().toISOString()
      });
    }

    const payload = {
      location,
      status: status || 'IN_TRANSIT'
    };

    let generatedEvent;

    if (mongoose.connection.readyState === 1) {
      const nextVersion = latestVersion + 1;
      const doc = await Event.create({
        aggregateId: shipmentId,
        eventType: 'SHIPMENT_MOVED',
        payload,
        version: nextVersion,
        timestamp: new Date()
      });
      generatedEvent = doc.toObject();
      appendEvent(shipmentId, 'SHIPMENT_MOVED', payload, expectedVersion);
      projectionWorker.emit('event:appended', generatedEvent);
    } else {
      generatedEvent = appendEvent(shipmentId, 'SHIPMENT_MOVED', payload, expectedVersion);
    }

    res.setHeader('x-command-id', `cmd_${Date.now()}`);
    res.setHeader('x-event-version', generatedEvent.version);

    return res.status(202).json({
      success: true,
      message: "Command Accepted & Event Persisted: SHIPMENT_MOVED",
      command: {
        type: "MOVE_SHIPMENT",
        aggregateId: shipmentId,
        version: generatedEvent.version,
        payload,
        timestamp: generatedEvent.timestamp
      },
      event: generatedEvent
    });
  } catch (error) {
    handleCommandError(error, res, next, req.body?.shipmentId);
  }
};

// POST /api/commands/shipment/status
export const updateShipmentStatus = async (req, res, next) => {
  try {
    const { shipmentId, status, notes } = req.body;
    const expectedVersion = extractExpectedVersion(req);

    let latestVersion = 0;
    if (mongoose.connection.readyState === 1) {
      latestVersion = await Event.getLatestVersion(shipmentId);
    } else {
      const existing = getShipmentByIdFromStore(shipmentId);
      latestVersion = existing ? existing.version : 0;
    }

    if (latestVersion === 0) {
      return res.status(404).json({
        success: false,
        error: `Aggregate not found: Cannot update status for '${shipmentId}'.`
      });
    }

    // OCC Check: Verify expected version matches database version before append
    if (expectedVersion !== undefined && expectedVersion !== latestVersion) {
      return res.status(409).json({
        success: false,
        error: 'Optimistic Concurrency Control (OCC) Conflict',
        message: `Command rejected for aggregate '${shipmentId}': expected version ${expectedVersion}, but current version in database is ${latestVersion}.`,
        aggregateId: shipmentId,
        expectedVersion,
        currentVersion: latestVersion,
        code: 'CONCURRENCY_CONFLICT',
        timestamp: new Date().toISOString()
      });
    }

    const payload = {
      status: status.toUpperCase(),
      notes: notes || 'Status updated via audit command portal'
    };

    let generatedEvent;

    if (mongoose.connection.readyState === 1) {
      const nextVersion = latestVersion + 1;
      const doc = await Event.create({
        aggregateId: shipmentId,
        eventType: 'STATUS_UPDATED',
        payload,
        version: nextVersion,
        timestamp: new Date()
      });
      generatedEvent = doc.toObject();
      appendEvent(shipmentId, 'STATUS_UPDATED', payload, expectedVersion);
      projectionWorker.emit('event:appended', generatedEvent);
    } else {
      generatedEvent = appendEvent(shipmentId, 'STATUS_UPDATED', payload, expectedVersion);
    }

    res.setHeader('x-command-id', `cmd_${Date.now()}`);
    res.setHeader('x-event-version', generatedEvent.version);

    return res.status(202).json({
      success: true,
      message: `Command Accepted & Event Persisted: STATUS_UPDATED -> ${status.toUpperCase()}`,
      command: {
        type: "UPDATE_STATUS",
        aggregateId: shipmentId,
        version: generatedEvent.version,
        payload,
        timestamp: generatedEvent.timestamp
      },
      event: generatedEvent
    });
  } catch (error) {
    handleCommandError(error, res, next, req.body?.shipmentId);
  }
};

// POST /api/commands/shipment/sensor
export const recordSensorReading = async (req, res, next) => {
  try {
    const { shipmentId, temperatureC, humidity, location, notes, eventType: customEventType } = req.body;
    const expectedVersion = extractExpectedVersion(req);

    let latestVersion = 0;
    if (mongoose.connection.readyState === 1) {
      latestVersion = await Event.getLatestVersion(shipmentId);
    } else {
      const existing = getShipmentByIdFromStore(shipmentId);
      latestVersion = existing ? existing.version : 0;
    }

    if (latestVersion === 0) {
      return res.status(404).json({
        success: false,
        error: `Aggregate not found: Cannot record sensor telemetry for '${shipmentId}' before creation.`
      });
    }

    // OCC Check
    if (expectedVersion !== undefined && expectedVersion !== latestVersion) {
      return res.status(409).json({
        success: false,
        error: 'Optimistic Concurrency Control (OCC) Conflict',
        message: `Command rejected for aggregate '${shipmentId}': expected version ${expectedVersion}, but current version in database is ${latestVersion}.`,
        aggregateId: shipmentId,
        expectedVersion,
        currentVersion: latestVersion,
        code: 'CONCURRENCY_CONFLICT',
        timestamp: new Date().toISOString()
      });
    }

    const isSpike = (temperatureC !== undefined && temperatureC > 8.0) || customEventType === 'TEMPERATURE_SPIKE';
    const eventType = customEventType || (isSpike ? 'TEMPERATURE_SPIKE' : 'SENSOR_READING');

    const payload = {
      temperatureC: temperatureC !== undefined ? Number(temperatureC) : undefined,
      humidity: humidity !== undefined ? Number(humidity) : undefined,
      location: location || undefined,
      status: isSpike ? 'ALERT_TEMPERATURE_SPIKE' : undefined,
      notes: notes || (isSpike ? 'Temperature threshold alert triggered' : 'Periodic sensor telemetry ping')
    };

    let generatedEvent;

    if (mongoose.connection.readyState === 1) {
      const nextVersion = latestVersion + 1;
      const doc = await Event.create({
        aggregateId: shipmentId,
        eventType,
        payload,
        version: nextVersion,
        timestamp: new Date()
      });
      generatedEvent = doc.toObject();
      appendEvent(shipmentId, eventType, payload, expectedVersion);
      projectionWorker.emit('event:appended', generatedEvent);
    } else {
      generatedEvent = appendEvent(shipmentId, eventType, payload, expectedVersion);
    }

    res.setHeader('x-command-id', `cmd_${Date.now()}`);
    res.setHeader('x-event-version', generatedEvent.version);

    return res.status(202).json({
      success: true,
      message: `Command Accepted & Event Persisted: ${eventType}`,
      command: {
        type: "RECORD_SENSOR_READING",
        aggregateId: shipmentId,
        version: generatedEvent.version,
        payload,
        timestamp: generatedEvent.timestamp
      },
      event: generatedEvent
    });
  } catch (error) {
    handleCommandError(error, res, next, req.body?.shipmentId);
  }
};

// POST /api/commands/shipment/custom
export const appendCustomEvent = async (req, res, next) => {
  try {
    const { aggregateId: reqAggId, shipmentId, eventType, payload } = req.body;
    const aggregateId = reqAggId || shipmentId;
    const expectedVersion = extractExpectedVersion(req);

    const normEventType = String(eventType).trim().toUpperCase();

    let latestVersion = 0;
    if (mongoose.connection.readyState === 1) {
      latestVersion = await Event.getLatestVersion(aggregateId);
    } else {
      const existing = getShipmentByIdFromStore(aggregateId);
      latestVersion = existing ? existing.version : 0;
    }

    // If new shipment creation type
    if (normEventType === 'SHIPMENT_CREATED' || normEventType === 'CONTAINER_CREATED') {
      if (latestVersion > 0) {
        return res.status(409).json({
          success: false,
          error: `Aggregate conflict: Aggregate '${aggregateId}' already exists.`
        });
      }
    } else if (latestVersion === 0) {
      return res.status(404).json({
        success: false,
        error: `Aggregate not found: Cannot append event '${normEventType}' to non-existent aggregate '${aggregateId}'.`
      });
    }

    // OCC Check
    if (expectedVersion !== undefined && expectedVersion !== latestVersion) {
      return res.status(409).json({
        success: false,
        error: 'Optimistic Concurrency Control (OCC) Conflict',
        message: `Command rejected for aggregate '${aggregateId}': expected version ${expectedVersion}, but current version in database is ${latestVersion}.`,
        aggregateId,
        expectedVersion,
        currentVersion: latestVersion,
        code: 'CONCURRENCY_CONFLICT',
        timestamp: new Date().toISOString()
      });
    }

    let generatedEvent;

    if (mongoose.connection.readyState === 1) {
      const nextVersion = latestVersion + 1;
      const doc = await Event.create({
        aggregateId,
        eventType: normEventType,
        payload,
        version: nextVersion,
        timestamp: new Date()
      });
      generatedEvent = doc.toObject();
      appendEvent(aggregateId, normEventType, payload, expectedVersion);
      projectionWorker.emit('event:appended', generatedEvent);
    } else {
      generatedEvent = appendEvent(aggregateId, normEventType, payload, expectedVersion);
    }

    res.setHeader('x-command-id', `cmd_${Date.now()}`);
    res.setHeader('x-event-version', generatedEvent.version);

    return res.status(202).json({
      success: true,
      message: `Command Accepted & Custom Event Persisted: ${normEventType}`,
      command: {
        type: "APPEND_CUSTOM_EVENT",
        aggregateId,
        version: generatedEvent.version,
        payload,
        timestamp: generatedEvent.timestamp
      },
      event: generatedEvent
    });
  } catch (error) {
    handleCommandError(error, res, next, req.body?.aggregateId || req.body?.shipmentId);
  }
};

