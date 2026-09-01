/**
 * Event Sourcing Engine — Folding Helper
 * ------------------------------------------------------------
 * Reconstructs current aggregate state by mathematically folding
 * (replaying) an append-only event stream in version order.
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
    eventsSequence: sortedEvents.map(e => e.eventType)
  };

  for (const evt of sortedEvents) {
    state.version = evt.version;
    state.lastUpdated = evt.timestamp || evt.createdAt;

    const payload = evt.payload || {};

    switch (evt.eventType) {
      case 'SHIPMENT_CREATED':
        state.origin = payload.origin || state.origin;
        state.destination = payload.destination || state.destination;
        state.carrier = payload.carrier || state.carrier || 'Standard Logistics';
        state.currentLocation = payload.origin || state.currentLocation;
        state.status = payload.status || 'CREATED';
        break;

      case 'SHIPMENT_MOVED':
        if (payload.location) state.currentLocation = payload.location;
        if (payload.status) state.status = payload.status;
        break;

      case 'STATUS_UPDATED':
        if (payload.status) state.status = payload.status;
        break;

      case 'TEMPERATURE_SPIKE':
        if (payload.status) state.status = payload.status;
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
