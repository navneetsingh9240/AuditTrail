/**
 * Event Sourcing Engine — Mathematical State Folding Helper
 * ------------------------------------------------------------
 * Reconstructs current aggregate state by mathematically folding
 * (replaying) an append-only event stream in strict version order.
 */

export function foldEventsToShipmentState(events, aggregateId) {
  if (!events || events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => a.version - b.version);

  const state = {
    shipmentId: aggregateId,
    origin: '',
    destination: '',
    carrier: '',
    currentLocation: '',
    status: 'UNKNOWN',
    version: 0,
    lastUpdated: null,
    eventsCount: sortedEvents.length,
    eventsSequence: sortedEvents.map(e => e.eventType),
    // Sensor Telemetry & Forensic Metrics
    temperatureReadings: [],
    humidityReadings: [],
    latestTemperature: null,
    maxTemperature: null,
    minTemperature: null,
    hasTemperatureAlert: false,
    alertCount: 0,
    locationHistory: []
  };

  for (const evt of sortedEvents) {
    state.version = evt.version;
    const evtTime = evt.timestamp || evt.createdAt || new Date().toISOString();
    state.lastUpdated = evtTime;

    const payload = evt.payload || {};

    // Track location history if provided
    if (payload.location && (state.locationHistory.length === 0 || state.locationHistory[state.locationHistory.length - 1].location !== payload.location)) {
      state.locationHistory.push({
        location: payload.location,
        timestamp: evtTime,
        status: payload.status || state.status,
        version: evt.version
      });
    }

    // Track temperature telemetry if present in payload
    const tempVal = payload.temperatureC ?? payload.temperature ?? payload.temp;
    if (tempVal !== undefined && tempVal !== null && !isNaN(Number(tempVal))) {
      const numTemp = Number(tempVal);
      state.latestTemperature = numTemp;
      state.temperatureReadings.push({
        version: evt.version,
        timestamp: evtTime,
        temperatureC: numTemp,
        location: payload.location || state.currentLocation,
        eventType: evt.eventType
      });

      if (state.maxTemperature === null || numTemp > state.maxTemperature) {
        state.maxTemperature = numTemp;
      }
      if (state.minTemperature === null || numTemp < state.minTemperature) {
        state.minTemperature = numTemp;
      }

      if (numTemp > 8.0 || evt.eventType === 'TEMPERATURE_SPIKE') {
        state.hasTemperatureAlert = true;
        state.alertCount++;
      }
    }

    // Track humidity telemetry if present
    const humidityVal = payload.humidity ?? payload.humidityPct;
    if (humidityVal !== undefined && humidityVal !== null && !isNaN(Number(humidityVal))) {
      state.humidityReadings.push({
        version: evt.version,
        timestamp: evtTime,
        humidity: Number(humidityVal),
        location: payload.location || state.currentLocation
      });
    }

    // Apply domain event transitions
    switch (evt.eventType) {
      case 'SHIPMENT_CREATED':
      case 'CONTAINER_CREATED':
        state.origin = payload.origin || state.origin;
        state.destination = payload.destination || state.destination;
        state.carrier = payload.carrier || state.carrier || 'Standard Logistics';
        state.currentLocation = payload.origin || payload.location || state.currentLocation;
        state.status = payload.status || 'CREATED';
        break;

      case 'LOADED_ON_SHIP':
        if (payload.location) state.currentLocation = payload.location;
        if (payload.carrier) state.carrier = payload.carrier;
        state.status = payload.status || 'LOADED_ON_SHIP';
        break;

      case 'SHIPMENT_MOVED':
        if (payload.location) state.currentLocation = payload.location;
        state.status = payload.status || 'IN_TRANSIT';
        break;

      case 'TEMPERATURE_SPIKE':
        if (payload.location) state.currentLocation = payload.location;
        state.status = payload.status || 'ALERT_TEMPERATURE_SPIKE';
        state.hasTemperatureAlert = true;
        break;

      case 'SENSOR_READING':
        if (payload.location) state.currentLocation = payload.location;
        if (payload.status) state.status = payload.status;
        break;

      case 'ARRIVED_AT_PORT':
        if (payload.location) state.currentLocation = payload.location;
        state.status = payload.status || 'ARRIVED_AT_PORT';
        break;

      case 'CUSTOMS_HOLD':
        if (payload.location) state.currentLocation = payload.location;
        state.status = payload.status || 'CUSTOMS_HOLD';
        break;

      case 'STATUS_UPDATED':
        if (payload.status) state.status = payload.status;
        if (payload.location) state.currentLocation = payload.location;
        break;

      case 'DELIVERED':
        if (payload.location) state.currentLocation = payload.location;
        state.status = 'DELIVERED';
        break;

      default:
        if (payload.status) state.status = payload.status;
        if (payload.location) state.currentLocation = payload.location;
        break;
    }
  }

  return state;
}

/**
 * Given a list of all events in the Event Store, group them by aggregateId
 * and fold each group to project all current shipment read states.
 */
export function foldAllEventsToShipments(events) {
  const eventsByAggregate = new Map();

  for (const evt of events) {
    const aggId = evt.aggregateId;
    if (!eventsByAggregate.has(aggId)) {
      eventsByAggregate.set(aggId, []);
    }
    eventsByAggregate.get(aggId).push(evt);
  }

  const result = [];
  for (const [aggId, aggEvents] of eventsByAggregate.entries()) {
    const folded = foldEventsToShipmentState(aggEvents, aggId);
    if (folded) {
      result.push(folded);
    }
  }

  return result;
}

/**
 * State Scrubbing / Time Travel Engine:
 * Reconstructs historical aggregate state at a specific point in time or target version
 * by filtering the append-only event stream up to targetTimestamp or targetVersion.
 */
export function foldEventsUpToPointInTime(events, aggregateId, { targetTimestamp, targetVersion } = {}) {
  if (!events || events.length === 0) return null;

  let sortedEvents = [...events].sort((a, b) => a.version - b.version);

  // Filter events up to targetVersion if provided
  if (targetVersion !== undefined && targetVersion !== null && !isNaN(Number(targetVersion))) {
    const maxVer = Number(targetVersion);
    sortedEvents = sortedEvents.filter(e => e.version <= maxVer);
  }

  // Filter events up to targetTimestamp if provided
  if (targetTimestamp) {
    const maxTime = new Date(targetTimestamp).getTime();
    if (!isNaN(maxTime)) {
      sortedEvents = sortedEvents.filter(e => {
        const evtTime = new Date(e.timestamp || e.createdAt).getTime();
        return evtTime <= maxTime;
      });
    }
  }

  if (sortedEvents.length === 0) return null;

  const historicalState = foldEventsToShipmentState(sortedEvents, aggregateId);

  return {
    ...historicalState,
    isHistoricalSnapshot: true,
    replayedEventsCount: sortedEvents.length,
    totalEventsCount: events.length,
    scrubCriteria: {
      targetTimestamp: targetTimestamp || null,
      targetVersion: targetVersion !== undefined && targetVersion !== null ? Number(targetVersion) : null
    },
    replayedEvents: sortedEvents
  };
}


