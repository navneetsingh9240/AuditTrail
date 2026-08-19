import express from 'express';
import { getAllShipments, getShipmentById, getShipmentEvents, getSystemStats } from '../controllers/queryController.js';

const router = express.Router();

// CQRS Query Routes (Read Side Operations)
router.get('/shipments', getAllShipments);
router.get('/shipment/:id', getShipmentById);
router.get('/shipment/:id/events', getShipmentEvents);
router.get('/stats', getSystemStats);

export default router;
