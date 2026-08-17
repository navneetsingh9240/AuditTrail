/**
 * Command Controller (Write Side Operations)
 * Receives mutation requests, validates inputs, and triggers event append logic.
 */

// POST /api/commands/shipment/create
export const createShipment = (req, res) => {
  const { shipmentId, origin, destination } = req.body;
  
  if (!shipmentId) {
    return res.status(400).json({ 
      success: false, 
      error: "shipmentId is required" 
    });
  }

  // Day 1 CQRS Command Stub
  return res.status(202).json({
    success: true,
    message: "Command accepted: CONTAINER_CREATED",
    command: {
      type: "CREATE_SHIPMENT",
      aggregateId: shipmentId,
      payload: { origin, destination },
      timestamp: new Date().toISOString()
    }
  });
};

// POST /api/commands/shipment/move
export const moveShipment = (req, res) => {
  const { shipmentId, location, status } = req.body;

  if (!shipmentId || !location) {
    return res.status(400).json({ 
      success: false, 
      error: "shipmentId and location are required" 
    });
  }

  // Day 1 CQRS Command Stub
  return res.status(202).json({
    success: true,
    message: "Command accepted: LOCATION_UPDATED",
    command: {
      type: "MOVE_SHIPMENT",
      aggregateId: shipmentId,
      payload: { location, status },
      timestamp: new Date().toISOString()
    }
  });
};
