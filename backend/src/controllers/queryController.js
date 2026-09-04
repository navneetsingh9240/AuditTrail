/**
 * Query Controller (Read Side Operations) - CQRS & Event Sourcing Engine
 * Handles state lookups by replaying event streams, aggregate lists, system statistics, and event log stream retrieval.
 */
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import ShipmentReadModel from '../models/ShipmentReadModel.js';
import projectionWorker from '../services/projectionWorker.js';
import { foldEventsToShipmentState, foldAllEventsToShipments, foldEventsUpToPointInTime } from '../store/eventSourcingEngine.js';
import {
  getAllShipmentsFromStore,
  getShipmentByIdFromStore,
  getEventsByAggregateIdFromStore,
  getStoreStats,
  searchShipmentsFromStore,
  getDashboardSummaryFromStore,
  getFilteredEventsFromStore,
  scrubShipmentStateFromStore
} from '../store/inMemoryStore.js';


// GET /api/queries/shipments
export const getAllShipments = async (req, res, next) => {
  try {
    let shipments = [];
    let readPath = 'IN_MEMORY';

    if (mongoose.connection.readyState === 1) {
      const projections = await ShipmentReadModel.find({}).sort({ lastUpdated: -1 }).lean();
      if (projections && projections.length > 0) {
        shipments = projections;
        readPath = 'PROJECTION_READ_MODEL';
      } else {
        const allEvents = await Event.find({}).sort({ version: 1 }).lean();
        shipments = foldAllEventsToShipments(allEvents);
        readPath = 'EVENT_STORE_REPLAY';
        if (allEvents.length > 0) {
          projectionWorker.rebuildAllProjections().catch(err =>
            console.error('[AutoHeal Error] Background projection rebuild failed:', err.message)
          );
        }
      }
    } else {
      shipments = getAllShipmentsFromStore();
    }

    res.setHeader('x-read-path', readPath);

    return res.status(200).json({
      success: true,
      message: `Query executed: Fetch all tracked shipments (${readPath})`,
      readPath,
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
    const { timestamp, version, at } = req.query;

    if (timestamp || version || at) {
      const targetTime = timestamp || at;
      return await performStateScrubbing(req, res, next, id, targetTime, version);
    }

    let shipment = null;
    let readPath = 'IN_MEMORY';


    if (mongoose.connection.readyState === 1) {
      const projection = await ShipmentReadModel.findOne({ shipmentId: id }).lean();
      if (projection) {
        shipment = projection;
        readPath = 'PROJECTION_READ_MODEL';
      } else {
        const events = await Event.find({ aggregateId: id }).sort({ version: 1 }).lean();
        if (events && events.length > 0) {
          shipment = foldEventsToShipmentState(events, id);
          readPath = 'EVENT_STORE_REPLAY';
          projectionWorker.projectSingleEvent(events[events.length - 1]).catch(err =>
            console.error(`[AutoHeal Error] Single event projection failed for ${id}:`, err.message)
          );
        }
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

    res.setHeader('x-read-path', readPath);

    return res.status(200).json({
      success: true,
      message: `Query executed: Retrieved shipment aggregate state (${readPath})`,
      readPath,
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
    let readPath = 'IN_MEMORY';

    if (mongoose.connection.readyState === 1) {
      const readModelCount = await ShipmentReadModel.countDocuments();
      const totalEvents = await Event.countDocuments();

      if (readModelCount > 0) {
        readPath = 'PROJECTION_READ_MODEL';
        const inTransitCount = await ShipmentReadModel.countDocuments({ status: 'IN_TRANSIT' });
        const createdCount = await ShipmentReadModel.countDocuments({ status: 'CREATED' });
        const deliveredCount = await ShipmentReadModel.countDocuments({ status: 'DELIVERED' });

        stats = {
          totalShipments: readModelCount,
          totalEvents,
          inTransitCount,
          createdCount,
          deliveredCount
        };
      } else {
        readPath = 'EVENT_STORE_REPLAY';
        const allEvents = await Event.find({}).sort({ version: 1 }).lean();
        const shipments = foldAllEventsToShipments(allEvents);
        stats = {
          totalShipments: shipments.length,
          totalEvents,
          inTransitCount: shipments.filter(s => s.status === 'IN_TRANSIT').length,
          createdCount: shipments.filter(s => s.status === 'CREATED').length,
          deliveredCount: shipments.filter(s => s.status === 'DELIVERED').length
        };
      }
    } else {
      stats = getStoreStats();
    }

    res.setHeader('x-read-path', readPath);

    return res.status(200).json({
      success: true,
      message: `Query executed: Fetch Audit Trail system telemetry (${readPath})`,
      readPath,
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
    let readPath = 'IN_MEMORY';

    if (mongoose.connection.readyState === 1) {
      const readModelCount = await ShipmentReadModel.countDocuments();

      if (readModelCount > 0) {
        readPath = 'PROJECTION_READ_MODEL';
        const queryObj = {};
        if (status && status !== 'ALL') {
          queryObj.status = status.toUpperCase();
        }
        if (q && q.trim() !== '') {
          const regex = new RegExp(q.trim(), 'i');
          queryObj.$or = [
            { shipmentId: regex },
            { origin: regex },
            { destination: regex },
            { currentLocation: regex },
            { carrier: regex }
          ];
        }
        shipments = await ShipmentReadModel.find(queryObj).sort({ lastUpdated: -1 }).lean();
      } else {
        readPath = 'EVENT_STORE_REPLAY';
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
      }
    } else {
      shipments = searchShipmentsFromStore(q, status);
    }

    res.setHeader('x-read-path', readPath);

    return res.status(200).json({
      success: true,
      message: `Query executed: Search shipments matching term '${q}' with status '${status}' (${readPath})`,
      readPath,
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
    let readPath = 'IN_MEMORY';

    if (mongoose.connection.readyState === 1) {
      const readModelCount = await ShipmentReadModel.countDocuments();

      if (readModelCount > 0) {
        readPath = 'PROJECTION_READ_MODEL';
        const totalShipments = readModelCount;
        const totalEvents = await Event.countDocuments();
        const inTransitCount = await ShipmentReadModel.countDocuments({ status: 'IN_TRANSIT' });
        const createdCount = await ShipmentReadModel.countDocuments({ status: 'CREATED' });
        const deliveredCount = await ShipmentReadModel.countDocuments({ status: 'DELIVERED' });

        const queryObj = {};
        if (status && status !== 'ALL') {
          queryObj.status = status.toUpperCase();
        }
        if (q && q.trim() !== '') {
          const regex = new RegExp(q.trim(), 'i');
          queryObj.$or = [
            { shipmentId: regex },
            { origin: regex },
            { destination: regex },
            { currentLocation: regex },
            { carrier: regex }
          ];
        }

        const filteredShipments = await ShipmentReadModel.find(queryObj).sort({ lastUpdated: -1 }).lean();
        const recentEvents = await Event.find({}).sort({ timestamp: -1 }).limit(10).lean();

        dashboardData = {
          readPath,
          stats: {
            totalShipments,
            totalEvents,
            inTransitCount,
            createdCount,
            deliveredCount
          },
          activeFilters: {
            searchTerm: q || null,
            statusFilter: status || 'ALL'
          },
          totalMatches: filteredShipments.length,
          shipments: filteredShipments,
          recentEvents
        };
      } else {
        readPath = 'EVENT_STORE_REPLAY';
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
          readPath,
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

        if (allEvents.length > 0) {
          projectionWorker.rebuildAllProjections().catch(err =>
            console.error('[AutoHeal Error] Dashboard rebuild projections failed:', err.message)
          );
        }
      }
    } else {
      dashboardData = getDashboardSummaryFromStore(q, status);
      dashboardData.readPath = readPath;
    }

    res.setHeader('x-read-path', readPath);

    return res.status(200).json({
      success: true,
      message: `Query executed: Fetch Dashboard summary and telemetry (${readPath})`,
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

// GET /api/queries/projections/status
export const getProjectionStatus = async (req, res, next) => {
  try {
    const statusInfo = await projectionWorker.getProjectionStatus();
    return res.status(200).json({
      success: true,
      message: "Query executed: Fetch Read Model projection sync status",
      status: statusInfo
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

/**
 * Week 3 Day 3: State Scrubbing Engine (Point-in-Time Historical State Replay)
 * Reconstructs aggregate state up to a target timestamp or version sequence.
 */
const performStateScrubbing = async (req, res, next, aggregateId, targetTimestamp, targetVersion) => {
  let historicalSnapshot = null;
  let readPath = 'IN_MEMORY_SCRUB';

  if (mongoose.connection.readyState === 1) {
    const events = await Event.find({ aggregateId }).sort({ version: 1 }).lean();
    if (events && events.length > 0) {
      historicalSnapshot = foldEventsUpToPointInTime(events, aggregateId, {
        targetTimestamp,
        targetVersion
      });
      readPath = 'EVENT_STORE_POINT_IN_TIME_REPLAY';
    }
  } else {
    historicalSnapshot = scrubShipmentStateFromStore(aggregateId, {
      targetTimestamp,
      targetVersion
    });
  }

  if (!historicalSnapshot) {
    return res.status(404).json({
      success: false,
      error: `No event history found for aggregate ID '${aggregateId}' matching scrub criteria (timestamp: '${targetTimestamp || 'ANY'}', version: '${targetVersion || 'ANY'}').`
    });
  }

  res.setHeader('x-read-path', readPath);

  return res.status(200).json({
    success: true,
    message: `Query executed: State scrubbing historical snapshot for '${aggregateId}' (${readPath})`,
    readPath,
    aggregateId,
    scrubCriteria: historicalSnapshot.scrubCriteria,
    replayedEventsCount: historicalSnapshot.replayedEventsCount,
    totalEventsCount: historicalSnapshot.totalEventsCount,
    data: historicalSnapshot
  });
};

// GET /api/queries/shipment/:id/scrub
// GET /api/queries/scrub/:id
// POST /api/queries/scrub
export const scrubShipmentState = async (req, res, next) => {
  try {
    const aggregateId = req.params.id || (req.body && req.body.aggregateId) || req.query.aggregateId;
    const timestamp = req.query.timestamp || req.query.at || (req.body && (req.body.timestamp || req.body.at));
    const version = req.query.version || (req.body && req.body.version);

    if (!aggregateId) {
      return res.status(400).json({
        success: false,
        error: 'State scrubbing request requires a valid aggregateId (via path param, query param, or body).'
      });
    }

    return await performStateScrubbing(req, res, next, aggregateId, timestamp, version);
  } catch (error) {
    next(error);
  }
};




