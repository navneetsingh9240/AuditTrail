/**
 * Query Controller (Read Side Operations) - CQRS & Event Sourcing Engine
 * Handles state lookups by replaying event streams, aggregate lists, system statistics, and event log stream retrieval.
 */
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import ShipmentReadModel from '../models/ShipmentReadModel.js';
import projectionWorker from '../services/projectionWorker.js';
import { foldEventsToShipmentState, foldAllEventsToShipments } from '../store/eventSourcingEngine.js';
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
export const getAllShipments = async (req, res, next) => {
  try {
    let shipments = [];
    if (mongoose.connection.readyState === 1) {
      const allEvents = await Event.find({}).sort({ version: 1 }).lean();
      shipments = foldAllEventsToShipments(allEvents);
    } else {
      shipments = getAllShipmentsFromStore();
    }

    return res.status(200).json({
      success: true,
      message: "Query executed: Fetch all tracked shipments",
      count: shipments.length,
      data: shipments
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/queries/shipment/:id
export const getShipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let shipment = null;

    if (mongoose.connection.readyState === 1) {
      const events = await Event.find({ aggregateId: id }).sort({ version: 1 }).lean();
      if (events && events.length > 0) {
        shipment = foldEventsToShipmentState(events, id);
      }
    } else {
      shipment = getShipmentByIdFromStore(id);
    }

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: `Shipment aggregate with ID '${id}' not found in query read model.`
      });
    }

    return res.status(200).json({
      success: true,
      message: "Query executed: Reconstructed current shipment state via Event Sourcing Engine",
      data: shipment
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/queries/shipment/:id/events
export const getShipmentEvents = async (req, res, next) => {
  try {
    const { id } = req.params;
    let events = [];

    if (mongoose.connection.readyState === 1) {
      events = await Event.find({ aggregateId: id }).sort({ version: 1 }).lean();
    } else {
      events = getEventsByAggregateIdFromStore(id);
    }

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
  } catch (error) {
    next(error);
  }
};

// GET /api/queries/stats
export const getSystemStats = async (req, res, next) => {
  try {
    let stats;
    if (mongoose.connection.readyState === 1) {
      const totalEvents = await Event.countDocuments();
      const allEvents = await Event.find({}).sort({ version: 1 }).lean();
      const shipments = foldAllEventsToShipments(allEvents);
      stats = {
        totalShipments: shipments.length,
        totalEvents,
        inTransitCount: shipments.filter(s => s.status === 'IN_TRANSIT').length,
        createdCount: shipments.filter(s => s.status === 'CREATED').length,
        deliveredCount: shipments.filter(s => s.status === 'DELIVERED').length
      };
    } else {
      stats = getStoreStats();
    }

    return res.status(200).json({
      success: true,
      message: "Query executed: Fetch Audit Trail system telemetry",
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/queries/search?q=term&status=FILTER
export const searchShipments = async (req, res, next) => {
  try {
    const { q = '', status = 'ALL' } = req.query;
    let shipments = [];

    if (mongoose.connection.readyState === 1) {
      const allEvents = await Event.find({}).sort({ version: 1 }).lean();
      shipments = foldAllEventsToShipments(allEvents);
      if (status && status !== 'ALL') {
        shipments = shipments.filter(s => s.status === status.toUpperCase());
      }
      if (q && q.trim() !== '') {
        const term = q.toLowerCase().trim();
        shipments = shipments.filter(s =>
          s.shipmentId.toLowerCase().includes(term) ||
          (s.origin && s.origin.toLowerCase().includes(term)) ||
          (s.destination && s.destination.toLowerCase().includes(term)) ||
          (s.currentLocation && s.currentLocation.toLowerCase().includes(term)) ||
          (s.carrier && s.carrier.toLowerCase().includes(term))
        );
      }
    } else {
      shipments = searchShipmentsFromStore(q, status);
    }

    return res.status(200).json({
      success: true,
      message: `Query executed: Search shipments matching term '${q}' with status '${status}'`,
      query: q,
      statusFilter: status,
      matchCount: shipments.length,
      data: shipments
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/queries/dashboard?q=term&status=FILTER
export const getDashboardSummary = async (req, res, next) => {
  try {
    const { q = '', status = 'ALL' } = req.query;
    let dashboardData;

    if (mongoose.connection.readyState === 1) {
      const allEvents = await Event.find({}).sort({ timestamp: -1 }).lean();
      const shipments = foldAllEventsToShipments([...allEvents].reverse());
      let filteredShipments = shipments;
      if (status && status !== 'ALL') {
        filteredShipments = filteredShipments.filter(s => s.status === status.toUpperCase());
      }
      if (q && q.trim() !== '') {
        const term = q.toLowerCase().trim();
        filteredShipments = filteredShipments.filter(s =>
          s.shipmentId.toLowerCase().includes(term) ||
          (s.origin && s.origin.toLowerCase().includes(term)) ||
          (s.destination && s.destination.toLowerCase().includes(term)) ||
          (s.currentLocation && s.currentLocation.toLowerCase().includes(term)) ||
          (s.carrier && s.carrier.toLowerCase().includes(term))
        );
      }

      dashboardData = {
        stats: {
          totalShipments: shipments.length,
          totalEvents: allEvents.length,
          inTransitCount: shipments.filter(s => s.status === 'IN_TRANSIT').length,
          createdCount: shipments.filter(s => s.status === 'CREATED').length,
          deliveredCount: shipments.filter(s => s.status === 'DELIVERED').length
        },
        activeFilters: {
          searchTerm: q || null,
          statusFilter: status || 'ALL'
        },
        totalMatches: filteredShipments.length,
        shipments: filteredShipments,
        recentEvents: allEvents.slice(0, 10)
      };
    } else {
      dashboardData = getDashboardSummaryFromStore(q, status);
    }

    return res.status(200).json({
      success: true,
      message: "Query executed: Fetch Dashboard scaffolding summary and telemetry",
      timestamp: new Date().toISOString(),
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/queries/events?eventType=...&aggregateId=...&limit=...
export const getFilteredEvents = async (req, res, next) => {
  try {
    const { eventType, aggregateId, limit } = req.query;
    let events = [];

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (eventType && eventType.toUpperCase() !== 'ALL') {
        filter.eventType = eventType.toUpperCase();
      }
      if (aggregateId && aggregateId.trim() !== '') {
        filter.aggregateId = new RegExp(aggregateId.trim(), 'i');
      }
      const numLimit = parseInt(limit, 10) || 50;
      events = await Event.find(filter).sort({ timestamp: -1 }).limit(numLimit).lean();
    } else {
      events = getFilteredEventsFromStore({ eventType, aggregateId, limit });
    }

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
  } catch (error) {
    next(error);
  }
};

// GET /api/queries/projections
export const getProjections = async (req, res, next) => {
  try {
    let projections = [];
    if (mongoose.connection.readyState === 1) {
      projections = await ShipmentReadModel.find({}).sort({ lastUpdated: -1 }).lean();
    } else {
      projections = getAllShipmentsFromStore();
    }

    return res.status(200).json({
      success: true,
      message: "Query executed: Fetch denormalized read models (Projections)",
      count: projections.length,
      data: projections
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/queries/projections/rebuild
export const rebuildProjections = async (req, res, next) => {
  try {
    const result = await projectionWorker.rebuildAllProjections();
    return res.status(200).json({
      success: true,
      message: "Command executed: Rebuilt all Read Model projections from raw Event Store",
      result
    });
  } catch (error) {
    next(error);
  }
};



