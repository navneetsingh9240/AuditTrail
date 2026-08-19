/**
 * CQRS Command Validation Middleware (Day 2 & Day 3 Updates)
 * Ensures incoming write requests adhere to command schema requirements before reaching controllers.
 */

export const validateCreateShipmentCommand = (req, res, next) => {
  const { shipmentId, origin, destination } = req.body;
  const errors = [];

  if (!shipmentId || typeof shipmentId !== 'string' || shipmentId.trim() === '') {
    errors.push('shipmentId is required and must be a non-empty string');
  }

  if (!origin || typeof origin !== 'string' || origin.trim() === '') {
    errors.push('origin is required and must be a non-empty string');
  }

  if (!destination || typeof destination !== 'string' || destination.trim() === '') {
    errors.push('destination is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid CQRS Command Payload',
      commandType: 'CREATE_SHIPMENT',
      validationErrors: errors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

export const validateMoveShipmentCommand = (req, res, next) => {
  const { shipmentId, location } = req.body;
  const errors = [];

  if (!shipmentId || typeof shipmentId !== 'string' || shipmentId.trim() === '') {
    errors.push('shipmentId is required and must be a non-empty string');
  }

  if (!location || typeof location !== 'string' || location.trim() === '') {
    errors.push('location is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid CQRS Command Payload',
      commandType: 'MOVE_SHIPMENT',
      validationErrors: errors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

export const validateUpdateStatusCommand = (req, res, next) => {
  const { shipmentId, status } = req.body;
  const errors = [];

  const validStatuses = ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'ALERT', 'CUSTOMS_HOLD'];

  if (!shipmentId || typeof shipmentId !== 'string' || shipmentId.trim() === '') {
    errors.push('shipmentId is required and must be a non-empty string');
  }

  if (!status || typeof status !== 'string' || !validStatuses.includes(status.toUpperCase())) {
    errors.push(`status is required and must be one of: ${validStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid CQRS Command Payload',
      commandType: 'UPDATE_STATUS',
      validationErrors: errors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};
