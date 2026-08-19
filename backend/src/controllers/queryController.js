/**
 * Query Controller (Read Side Operations) - Day 3 Implementation
 * Handles state lookups, aggregate lists, system statistics, and event log stream retrieval without mutating state.
 */
import {
  getAllShipmentsFromStore,
  getShipmentByIdFromStore,
  getEventsByAggregateIdFromStore,
  getStoreStats
} from '../store/inMemoryStore.js';

// GET /api/queries/shipments
export const getAllShipments = (req, res) => {
  const shipments = getAllShipmentsFromStore();

  return res.status(200).json({
    success: true,
    message: "Query executed: Fetch all tracked shipments",
    count: shipments.length,
    data: shipments
  });
};

// GET /api/queries/shipment/:id
export const getShipmentById = (req, res) => {
  const { id } = req.params;
  const shipment = getShipmentByIdFromStore(id);

  if (!shipment) {
    return res.status(404).json({
      success: false,
      error: `Shipment aggregate with ID '${id}' not found in query read model.`
    });
  }

  return res.status(200).json({
    success: true,
    message: "Query executed: Fetch current shipment state",
    data: shipment
  });
};

// GET /api/queries/shipment/:id/events
export const getShipmentEvents = (req, res) => {
  const { id } = req.params;
  const events = getEventsByAggregateIdFromStore(id);

  if (events.length === 0) {
    return res.status(404).json({
      success: false,
      error: `No event stream found for aggregate ID '${id}'.`
    });
  }

  return res.status(200).json({
    success: true,
    message: "Query executed: Fetch event stream history",
    aggregateId: id,
    eventCount: events.length,
    events
  });
};

// GET /api/queries/stats
export const getSystemStats = (req, res) => {
  const stats = getStoreStats();

  return res.status(200).json({
    success: true,
    message: "Query executed: Fetch Audit Trail system telemetry",
    timestamp: new Date().toISOString(),
    stats
  });
};
