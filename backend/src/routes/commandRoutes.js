import express from 'express';
import { createShipment, moveShipment } from '../controllers/commandController.js';

const router = express.Router();

// CQRS Command Routes (Write Side)
router.post('/shipment/create', createShipment);
router.post('/shipment/move', moveShipment);

export default router;
