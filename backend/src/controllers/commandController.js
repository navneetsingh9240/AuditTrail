/**
 * Command Controller (Write Side Operations) - CQRS & Event Store
 * Receives mutation requests, validates inputs via middleware, and appends events to the MongoDB Event Store / in-memory store.
 */
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import projectionWorker from '../services/projectionWorker.js';
import { appendEvent, getShipmentByIdFromStore } from '../store/inMemoryStore.js';

// POST /api/commands/shipment/create
export const createShipment = async (req, res, next) => {
  try {
    const { shipmentId, origin, destination, carrier } = req.body;

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
      appendEvent(shipmentId, 'SHIPMENT_CREATED', payload);
      projectionWorker.emit('event:appended', generatedEvent);
    } else {
      generatedEvent = appendEvent(shipmentId, 'SHIPMENT_CREATED', payload);
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
    next(error);
  }
};

// POST /api/commands/shipment/move
export const moveShipment = async (req, res, next) => {
  try {
    const { shipmentId, location, status } = req.body;

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
      appendEvent(shipmentId, 'SHIPMENT_MOVED', payload);
      projectionWorker.emit('event:appended', generatedEvent);
    } else {
      generatedEvent = appendEvent(shipmentId, 'SHIPMENT_MOVED', payload);
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
    next(error);
  }
};

// POST /api/commands/shipment/status
export const updateShipmentStatus = async (req, res, next) => {
  try {
    const { shipmentId, status, notes } = req.body;

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
      appendEvent(shipmentId, 'STATUS_UPDATED', payload);
      projectionWorker.emit('event:appended', generatedEvent);
    } else {
      generatedEvent = appendEvent(shipmentId, 'STATUS_UPDATED', payload);
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
    next(error);
  }
};
