/**
 * Query Controller (Read Side Operations)
 * Handles state lookups and event log retrieval without mutating state.
 */

// GET /api/queries/shipment/:id
export const getShipmentById = (req, res) => {
  const { id } = req.params;

  // Day 1 CQRS Query Stub
  return res.status(200).json({
    success: true,
    message: "Query executed: Get current shipment state",
    data: {
      shipmentId: id,
      status: "INITIALIZED",
      currentLocation: "Origin Warehouse",
      version: 1,
      lastUpdated: new Date().toISOString()
    }
  });
};

// GET /api/queries/shipment/:id/events
export const getShipmentEvents = (req, res) => {
  const { id } = req.params;

  // Day 1 CQRS Query Stub for raw event log
  return res.status(200).json({
    success: true,
    message: "Query executed: Fetch event stream",
    aggregateId: id,
    events: [
      {
        eventId: "evt_001",
        aggregateId: id,
        eventType: "CONTAINER_CREATED",
        payload: { status: "INITIALIZED", origin: "Port Alpha" },
        timestamp: new Date().toISOString(),
        version: 1
      }
    ]
  });
};
