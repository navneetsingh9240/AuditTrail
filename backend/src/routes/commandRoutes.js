import express from 'express';
import { 
  createShipment, 
  moveShipment, 
  updateShipmentStatus, 
  recordSensorReading, 
  appendCustomEvent 
} from '../controllers/commandController.js';
import { 
  validateCreateShipmentCommand, 
  validateMoveShipmentCommand, 
  validateUpdateStatusCommand, 
  validateSensorCommand, 
  validateCustomCommand 
} from '../middleware/commandValidator.js';

const router = express.Router();

// CQRS Command Routes (Write Side Operations)
router.post('/shipment/create', validateCreateShipmentCommand, createShipment);
router.post('/container/create', validateCreateShipmentCommand, createShipment);

router.post('/shipment/move', validateMoveShipmentCommand, moveShipment);
router.post('/container/move', validateMoveShipmentCommand, moveShipment);

router.post('/shipment/status', validateUpdateStatusCommand, updateShipmentStatus);
router.post('/container/status', validateUpdateStatusCommand, updateShipmentStatus);

// Forensic Sensor Telemetry & Custom Domain Event Commands
router.post('/shipment/sensor', validateSensorCommand, recordSensorReading);
router.post('/container/sensor', validateSensorCommand, recordSensorReading);

router.post('/shipment/custom', validateCustomCommand, appendCustomEvent);
router.post('/container/custom', validateCustomCommand, appendCustomEvent);

export default router;
