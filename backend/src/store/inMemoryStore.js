/**
 * Day 3 CQRS In-Memory Event & Read Store
 * Bridges backend command execution and state queries prior to MongoDB integration (Day 5).
 * Enforces event immutability and basic read-model state projections.
 */

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
  }
];

// Projected Read Models Map
const shipmentReadModel = new Map([
  [
    "SHP-1001",
    {
      shipmentId: "SHP-1001",
      origin: "Port of Shanghai",
      destination: "Port of Los Angeles",
      carrier: "Oceanic Cargo Ltd",
      currentLocation: "Pacific Transit Zone A",
      status: "IN_TRANSIT",
      version: 2,
      lastUpdated: "2026-08-19T12:30:00.000Z"
    }
  ],
  [
    "SHP-1002",
    {
      shipmentId: "SHP-1002",
      origin: "Rotterdam Terminal",
      destination: "Hamburg Hub",
      carrier: "EuroFreight Logistics",
      currentLocation: "Rotterdam Terminal",
      status: "CREATED",
      version: 1,
      lastUpdated: "2026-08-19T10:15:00.000Z"
    }
  ]
]);

/**
 * Append an event to the append-only log and update the read projection model.
 */
export const appendEvent = (aggregateId, eventType, payload) => {
  const existingShipment = shipmentReadModel.get(aggregateId);
  const nextVersion = existingShipment ? existingShipment.version + 1 : 1;

  const event = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    aggregateId,
    eventType,
    payload,
    version: nextVersion,
    timestamp: new Date().toISOString()
  };

  eventLog.push(event);

  // Update Read Model Projection
  if (eventType === "SHIPMENT_CREATED") {
    shipmentReadModel.set(aggregateId, {
      shipmentId: aggregateId,
      origin: payload.origin,
      destination: payload.destination,
      carrier: payload.carrier || "Standard Carrier",
      currentLocation: payload.origin,
      status: "CREATED",
      version: 1,
      lastUpdated: event.timestamp
    });
  } else if (existingShipment) {
    const updatedModel = {
      ...existingShipment,
      version: nextVersion,
      lastUpdated: event.timestamp
    };

    if (payload.location) updatedModel.currentLocation = payload.location;
    if (payload.status) updatedModel.status = payload.status;

    shipmentReadModel.set(aggregateId, updatedModel);
  }

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

