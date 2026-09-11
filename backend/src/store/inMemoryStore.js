/**
 * Day 3 CQRS In-Memory Event & Read Store
 * Bridges backend command execution and state queries prior to MongoDB integration (Day 5).
 * Enforces event immutability and basic read-model state projections.
 */
import { foldEventsUpToPointInTime } from './eventSourcingEngine.js';


// Append-only Event Stream
const eventLog = [
  {
    eventId: "evt_seed_001",
    aggregateId: "SHP-1001",
    eventType: "SHIPMENT_CREATED",
    payload: {
      origin: "Port of Shanghai",
      destination: "Port of Los Angeles",
      carrier: "Oceanic Cargo Ltd",
      status: "CREATED"
    },
    version: 1,
    timestamp: "2026-08-19T08:00:00.000Z"
  },
  {
    eventId: "evt_seed_002",
    aggregateId: "SHP-1001",
    eventType: "SHIPMENT_MOVED",
    payload: {
      location: "Pacific Transit Zone A",
      status: "IN_TRANSIT",
      temperatureC: 4.2
    },
    version: 2,
    timestamp: "2026-08-19T12:30:00.000Z"
  },
  {
    eventId: "evt_seed_003",
    aggregateId: "SHP-1001",
    eventType: "TEMPERATURE_SPIKE",
    payload: {
      location: "Pacific Transit Zone B",
      status: "ALERT_TEMPERATURE_SPIKE",
      temperatureC: 12.8,
      notes: "Reefer cooling compressor power interruption detected"
    },
    version: 3,
    timestamp: "2026-08-20T04:15:00.000Z"
  },
  {
    eventId: "evt_seed_004",
    aggregateId: "SHP-1002",
    eventType: "SHIPMENT_CREATED",
    payload: {
      origin: "Rotterdam Terminal",
      destination: "Hamburg Hub",
      carrier: "EuroFreight Logistics",
      status: "CREATED"
    },
    version: 1,
    timestamp: "2026-08-19T10:15:00.000Z"
  },
  {
    eventId: "evt_seed_005",
    aggregateId: "CONT-9082",
    eventType: "CONTAINER_CREATED",
    payload: {
      origin: "Shenzhen Port",
      destination: "Port of Long Beach",
      carrier: "Global Shipping Co",
      status: "CREATED"
    },
    version: 1,
    timestamp: "2026-08-18T06:00:00.000Z"
  },
  {
    eventId: "evt_seed_006",
    aggregateId: "CONT-9082",
    eventType: "LOADED_ON_SHIP",
    payload: {
      location: "Vessel Pacific Empress",
      carrier: "Global Shipping Co",
      status: "LOADED_ON_SHIP"
    },
    version: 2,
    timestamp: "2026-08-18T14:20:00.000Z"
  },
  {
    eventId: "evt_seed_007",
    aggregateId: "CONT-9082",
    eventType: "TEMPERATURE_SPIKE",
    payload: {
      location: "Mid-Pacific Co-ordinates 32N 165W",
      status: "ALERT_TEMPERATURE_SPIKE",
      temperatureC: 14.5,
      humidity: 88,
      notes: "Critical cold-chain threshold breached"
    },
    version: 3,
    timestamp: "2026-08-21T02:10:00.000Z"
  },
  {
    eventId: "evt_seed_008",
    aggregateId: "CONT-9082",
    eventType: "ARRIVED_AT_PORT",
    payload: {
      location: "Port of Long Beach Terminal 4",
      status: "ARRIVED_AT_PORT"
    },
    version: 4,
    timestamp: "2026-08-24T18:45:00.000Z"
  }
];

// Projected Read Models Map
const shipmentReadModel = new Map();

// Helper to refresh read model projection from event log
const refreshReadModelForAggregate = (aggregateId) => {
  const aggregateEvents = eventLog.filter(e => e.aggregateId === aggregateId);
  if (aggregateEvents.length > 0) {
    const foldedState = foldEventsToShipmentState(aggregateEvents, aggregateId);
    if (foldedState) {
      shipmentReadModel.set(aggregateId, {
        shipmentId: aggregateId,
        origin: foldedState.origin,
        destination: foldedState.destination,
        carrier: foldedState.carrier,
        currentLocation: foldedState.currentLocation,
        status: foldedState.status,
        version: foldedState.version,
        eventsCount: foldedState.eventsCount,
        latestTemperature: foldedState.latestTemperature,
        maxTemperature: foldedState.maxTemperature,
        hasSensorAlert: foldedState.hasTemperatureAlert,
        sensorReadingsCount: foldedState.temperatureReadings ? foldedState.temperatureReadings.length : 0,
        lastUpdated: foldedState.lastUpdated || new Date().toISOString()
      });
    }
  }
};

// Initialize in-memory projections for seed data
['SHP-1001', 'SHP-1002', 'CONT-9082'].forEach(id => refreshReadModelForAggregate(id));

/**
 * Append an event to the append-only log and update the read projection model.
 * Week 4 update: supports OCC expectedVersion checking.
 */
export const appendEvent = (aggregateId, eventType, payload, expectedVersion = undefined) => {
  const aggregateEvents = eventLog.filter(e => e.aggregateId === aggregateId);
  const existingShipment = shipmentReadModel.get(aggregateId);
  const currentVersion = aggregateEvents.length > 0 
    ? Math.max(...aggregateEvents.map(e => e.version)) 
    : (existingShipment ? existingShipment.version : 0);

  if (expectedVersion !== undefined && expectedVersion !== null && expectedVersion !== '') {
    const parsedExpected = Number(expectedVersion);
    if (!isNaN(parsedExpected) && parsedExpected !== currentVersion) {
      const occErr = new Error(
        `Optimistic Concurrency Control (OCC) Conflict: Command rejected for aggregate '${aggregateId}'. Expected version ${parsedExpected}, but current version is ${currentVersion}.`
      );
      occErr.isOccConflict = true;
      occErr.expectedVersion = parsedExpected;
      occErr.currentVersion = currentVersion;
      occErr.aggregateId = aggregateId;
      throw occErr;
    }
  }

  const nextVersion = currentVersion + 1;

  const event = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    aggregateId,
    eventType: String(eventType).trim().toUpperCase(),
    payload,
    version: nextVersion,
    timestamp: new Date().toISOString()
  };

  eventLog.push(event);

  // Update Read Model Projection via state folding helper
  refreshReadModelForAggregate(aggregateId);

  return event;
};

/**
 * Get full list of projected read models.
 */
export const getAllShipmentsFromStore = () => {
  return Array.from(shipmentReadModel.values());
};

/**
 * Get projected state for a specific aggregate ID.
 */
export const getShipmentByIdFromStore = (shipmentId) => {
  return shipmentReadModel.get(shipmentId) || null;
};

/**
 * Get event stream history for a specific aggregate ID.
 */
export const getEventsByAggregateIdFromStore = (aggregateId) => {
  return eventLog.filter(evt => evt.aggregateId === aggregateId);
};

/**
 * Get overall system statistics for audit analytics.
 */
export const getStoreStats = () => {
  return {
    totalShipments: shipmentReadModel.size,
    totalEvents: eventLog.length,
    inTransitCount: Array.from(shipmentReadModel.values()).filter(s => s.status === 'IN_TRANSIT').length,
    createdCount: Array.from(shipmentReadModel.values()).filter(s => s.status === 'CREATED').length,
    deliveredCount: Array.from(shipmentReadModel.values()).filter(s => s.status === 'DELIVERED').length,
  };
};

/**
 * Day 4: Search shipments by query term and/or status filter.
 */
export const searchShipmentsFromStore = (searchTerm = '', statusFilter = 'ALL') => {
  let shipments = Array.from(shipmentReadModel.values());

  if (statusFilter && statusFilter !== 'ALL') {
    shipments = shipments.filter(s => s.status === statusFilter.toUpperCase());
  }

  if (searchTerm && searchTerm.trim() !== '') {
    const term = searchTerm.toLowerCase().trim();
    shipments = shipments.filter(s => 
      s.shipmentId.toLowerCase().includes(term) ||
      s.origin.toLowerCase().includes(term) ||
      s.destination.toLowerCase().includes(term) ||
      (s.currentLocation && s.currentLocation.toLowerCase().includes(term)) ||
      (s.carrier && s.carrier.toLowerCase().includes(term))
    );
  }

  return shipments;
};

/**
 * Day 4: Get recent events log stream for dashboard.
 */
export const getRecentEventsFromStore = (limit = 10) => {
  return [...eventLog].reverse().slice(0, limit);
};

/**
 * Day 4: Aggregate complete dashboard dataset.
 */
export const getDashboardSummaryFromStore = (searchTerm = '', statusFilter = 'ALL') => {
  const stats = getStoreStats();
  const shipments = searchShipmentsFromStore(searchTerm, statusFilter);
  const recentEvents = getRecentEventsFromStore(10);

  return {
    stats,
    activeFilters: {
      searchTerm: searchTerm || null,
      statusFilter: statusFilter || 'ALL'
    },
    totalMatches: shipments.length,
    shipments,
    recentEvents
  };
};

/**
 * Day 5: Get filtered append-only event stream by eventType, aggregateId, and limit.
 */
export const getFilteredEventsFromStore = ({ eventType, aggregateId, limit = 50 } = {}) => {
  let filtered = [...eventLog];

  if (eventType && eventType.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(evt => evt.eventType === eventType.toUpperCase());
  }

  if (aggregateId && aggregateId.trim() !== '') {
    const term = aggregateId.toLowerCase().trim();
    filtered = filtered.filter(evt => evt.aggregateId.toLowerCase().includes(term));
  }

  const numLimit = parseInt(limit, 10) || 50;
  return filtered.reverse().slice(0, numLimit);
};

/**
 * Week 3 Day 3: Scrub in-memory shipment state up to a specific timestamp or version
 */
export const scrubShipmentStateFromStore = (aggregateId, { targetTimestamp, targetVersion } = {}) => {
  const events = eventLog.filter(evt => evt.aggregateId === aggregateId);
  if (!events || events.length === 0) return null;
  return foldEventsUpToPointInTime(events, aggregateId, { targetTimestamp, targetVersion });
};



