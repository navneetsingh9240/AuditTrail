/**
 * Query Controller (Read Side Operations) - Day 3 Implementation
 * Handles state lookups, aggregate lists, system statistics, and event log stream retrieval without mutating state.
 */
import {
  getAllShipmentsFromStore,
  getShipmentByIdFromStore,
  getEventsByAggregateIdFromStore,
  getStoreStats,
  searchShipmentsFromStore,
  getDashboardSummaryFromStore,
  getFilteredEventsFromStore
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

// GET /api/queries/search?q=term&status=FILTER (Day 4 Search Bar Query)
export const searchShipments = (req, res) => {
  const { q = '', status = 'ALL' } = req.query;
  const results = searchShipmentsFromStore(q, status);

  return res.status(200).json({
    success: true,
    message: `Query executed: Search shipments matching term '${q}' with status '${status}'`,
    query: q,
    statusFilter: status,
    matchCount: results.length,
    data: results
  });
};

// GET /api/queries/dashboard?q=term&status=FILTER (Day 4 Dashboard Aggregate Query)
export const getDashboardSummary = (req, res) => {
  const { q = '', status = 'ALL' } = req.query;
  const dashboardData = getDashboardSummaryFromStore(q, status);

  return res.status(200).json({
    success: true,
    message: "Query executed: Fetch Dashboard scaffolding summary and telemetry",
    timestamp: new Date().toISOString(),
    data: dashboardData
  });
};

// GET /api/queries/events?eventType=...&aggregateId=...&limit=... (Day 5 Event Stream Query API)
export const getFilteredEvents = (req, res) => {
  const { eventType, aggregateId, limit } = req.query;
  const events = getFilteredEventsFromStore({ eventType, aggregateId, limit });

  return res.status(200).json({
    success: true,
    message: "Query executed: Fetch filtered event stream history",
    filters: {
      eventType: eventType || 'ALL',
      aggregateId: aggregateId || null,
      limit: parseInt(limit, 10) || 50
    },
    count: events.length,
    events
  });
};


