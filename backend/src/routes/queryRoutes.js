import express from 'express';
import { getShipmentById, getShipmentEvents } from '../controllers/queryController.js';

const router = express.Router();

// CQRS Query Routes (Read Side)
router.get('/shipment/:id', getShipmentById);
router.get('/shipment/:id/events', getShipmentEvents);

export default router;
