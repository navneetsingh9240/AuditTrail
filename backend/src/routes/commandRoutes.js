import express from 'express';
import { createShipment, moveShipment, updateShipmentStatus } from '../controllers/commandController.js';
import { validateCreateShipmentCommand, validateMoveShipmentCommand, validateUpdateStatusCommand } from '../middleware/commandValidator.js';

const router = express.Router();

// CQRS Command Routes (Write Side Operations)
router.post('/shipment/create', validateCreateShipmentCommand, createShipment);
router.post('/shipment/move', validateMoveShipmentCommand, moveShipment);
router.post('/shipment/status', validateUpdateStatusCommand, updateShipmentStatus);

export default router;
