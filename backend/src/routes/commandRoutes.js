import express from 'express';
import { createShipment, moveShipment } from '../controllers/commandController.js';
import { validateCreateShipmentCommand, validateMoveShipmentCommand } from '../middleware/commandValidator.js';

const router = express.Router();

// CQRS Command Routes with Day 2 Validation Middleware
router.post('/shipment/create', validateCreateShipmentCommand, createShipment);
router.post('/shipment/move', validateMoveShipmentCommand, moveShipment);

export default router;
