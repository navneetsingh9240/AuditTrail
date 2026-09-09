/**
 * CQRS Command Validation Middleware (Day 2 & Day 3 Updates)
 * Ensures incoming write requests adhere to command schema requirements before reaching controllers.
 */

/**
 * Helper to check optional expectedVersion field for OCC validation
 */
const validateExpectedVersionIfPresent = (req, errors) => {
  const rawVersion = req.body?.expectedVersion ?? req.body?.version ?? req.body?.expectedEventVersion ?? req.headers['x-expected-version'];
  if (rawVersion !== undefined && rawVersion !== null && rawVersion !== '') {
    const num = Number(rawVersion);
    if (!Number.isInteger(num) || num < 0) {
      errors.push('expectedVersion must be a non-negative integer (e.g. 0, 1, 2...)');
    }
  }
};

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

  validateExpectedVersionIfPresent(req, errors);

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

  validateExpectedVersionIfPresent(req, errors);

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

  const validStatuses = ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'ALERT', 'ALERT_TEMPERATURE_SPIKE', 'CUSTOMS_HOLD', 'LOADED_ON_SHIP', 'ARRIVED_AT_PORT'];

  if (!shipmentId || typeof shipmentId !== 'string' || shipmentId.trim() === '') {
    errors.push('shipmentId is required and must be a non-empty string');
  }

  if (!status || typeof status !== 'string' || !validStatuses.includes(status.toUpperCase())) {
    errors.push(`status is required and must be one of: ${validStatuses.join(', ')}`);
  }

  validateExpectedVersionIfPresent(req, errors);

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

export const validateSensorCommand = (req, res, next) => {
  const { shipmentId, temperatureC, location, eventType } = req.body;
  const errors = [];

  if (!shipmentId || typeof shipmentId !== 'string' || shipmentId.trim() === '') {
    errors.push('shipmentId is required and must be a non-empty string');
  }

  if (temperatureC !== undefined && temperatureC !== null && (typeof temperatureC !== 'number' || isNaN(temperatureC))) {
    errors.push('temperatureC must be a valid number if provided');
  }

  validateExpectedVersionIfPresent(req, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid CQRS Command Payload',
      commandType: 'RECORD_SENSOR_READING',
      validationErrors: errors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

export const validateCustomCommand = (req, res, next) => {
  const { aggregateId, shipmentId, eventType, payload } = req.body;
  const targetId = aggregateId || shipmentId;
  const errors = [];

  if (!targetId || typeof targetId !== 'string' || targetId.trim() === '') {
    errors.push('aggregateId or shipmentId is required and must be a non-empty string');
  }

  if (!eventType || typeof eventType !== 'string' || eventType.trim() === '') {
    errors.push('eventType is required and must be a non-empty uppercase string');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    errors.push('payload is required and must be an object');
  }

  validateExpectedVersionIfPresent(req, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid CQRS Command Payload',
      commandType: 'APPEND_CUSTOM_EVENT',
      validationErrors: errors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

