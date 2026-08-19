/**
 * Command Controller (Write Side Operations) - Day 3 Implementation
 * Receives mutation requests, validates inputs via middleware, and triggers event store append logic.
 */
import { appendEvent, getShipmentByIdFromStore } from '../store/inMemoryStore.js';

// POST /api/commands/shipment/create
export const createShipment = (req, res) => {
  const { shipmentId, origin, destination, carrier } = req.body;

  const existing = getShipmentByIdFromStore(shipmentId);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `Aggregate conflict: Shipment '${shipmentId}' already exists. Use MOVE or UPDATE commands.`
    });
  }

  const generatedEvent = appendEvent(shipmentId, 'SHIPMENT_CREATED', {
    origin,
    destination,
    carrier: carrier || 'Standard Logistics',
    status: 'CREATED'
  });

  res.setHeader('x-command-id', `cmd_${Date.now()}`);
  res.setHeader('x-event-version', generatedEvent.version);

  return res.status(201).json({
    success: true,
    message: "Command Accepted & Event Persisted: SHIPMENT_CREATED",
    command: {
      type: "CREATE_SHIPMENT",
      aggregateId: shipmentId,
      version: generatedEvent.version,
      payload: { origin, destination, carrier },
      timestamp: generatedEvent.timestamp
    },
    event: generatedEvent
  });
};

// POST /api/commands/shipment/move
export const moveShipment = (req, res) => {
  const { shipmentId, location, status } = req.body;

  const existing = getShipmentByIdFromStore(shipmentId);
  if (!existing) {
    return res.status(444 || 404).json({
      success: false,
      error: `Aggregate not found: Cannot move shipment '${shipmentId}' before creation.`
    });
  }

  const generatedEvent = appendEvent(shipmentId, 'SHIPMENT_MOVED', {
    location,
    status: status || 'IN_TRANSIT'
  });

  res.setHeader('x-command-id', `cmd_${Date.now()}`);
  res.setHeader('x-event-version', generatedEvent.version);

  return res.status(202).json({
    success: true,
    message: "Command Accepted & Event Persisted: SHIPMENT_MOVED",
    command: {
      type: "MOVE_SHIPMENT",
      aggregateId: shipmentId,
      version: generatedEvent.version,
      payload: { location, status: status || 'IN_TRANSIT' },
      timestamp: generatedEvent.timestamp
    },
    event: generatedEvent
  });
};

// POST /api/commands/shipment/status
export const updateShipmentStatus = (req, res) => {
  const { shipmentId, status, notes } = req.body;

  const existing = getShipmentByIdFromStore(shipmentId);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: `Aggregate not found: Cannot update status for '${shipmentId}'.`
    });
  }

  const generatedEvent = appendEvent(shipmentId, 'STATUS_UPDATED', {
    status: status.toUpperCase(),
    notes: notes || 'Status updated via audit command portal'
  });

  res.setHeader('x-command-id', `cmd_${Date.now()}`);
  res.setHeader('x-event-version', generatedEvent.version);

  return res.status(202).json({
    success: true,
    message: `Command Accepted & Event Persisted: STATUS_UPDATED -> ${status.toUpperCase()}`,
    command: {
      type: "UPDATE_STATUS",
      aggregateId: shipmentId,
      version: generatedEvent.version,
      payload: { status: status.toUpperCase(), notes },
      timestamp: generatedEvent.timestamp
    },
    event: generatedEvent
  });
};
