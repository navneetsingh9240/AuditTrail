/**
 * CQRS Command Validation Middleware (Day 2)
 * Ensures incoming write requests adhere to command schema requirements before reaching controllers.
 */

export const validateCreateShipmentCommand = (req, res, next) => {
  const { shipmentId, origin, destination } = req.body;
  const errors = [];

  if (!shipmentId || typeof shipmentId !== 'string' || shipmentId.trim() === '') {
    errors.push('shipmentId is required and must be a non-empty string');
  }

  if (!origin || typeof origin !== 'string') {
    errors.push('origin is required and must be a string');
  }

  if (!destination || typeof destination !== 'string') {
    errors.push('destination is required and must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid CQRS Command Payload',
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

  if (!location || typeof location !== 'string') {
    errors.push('location is required and must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid CQRS Command Payload',
      validationErrors: errors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};
