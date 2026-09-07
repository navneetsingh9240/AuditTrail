import express from 'express';
import { 
  getAllShipments, 
  getShipmentById, 
  getShipmentEvents, 
  getSystemStats,
  searchShipments,
  getDashboardSummary,
  getFilteredEvents,
  getProjections,
  getProjectionStatus,
  rebuildProjections,
  scrubShipmentState,
  auditImmutability,
  reconstructShipmentState
} from '../controllers/queryController.js';

const router = express.Router();

// CQRS Query Routes (Read Side Operations)
router.get('/shipments', getAllShipments);
router.get('/shipment/:id', getShipmentById);
router.get('/shipment/:id/events', getShipmentEvents);
router.get('/stats', getSystemStats);

// Day 4 & 5 Dashboard & Event Stream Query Routes
router.get('/search', searchShipments);
router.get('/dashboard', getDashboardSummary);
router.get('/events', getFilteredEvents);

// Mid-Project Review Audit & Reconstruction Check Routes
router.get('/audit/immutability', auditImmutability);
router.get('/shipment/:id/reconstruct', reconstructShipmentState);
router.get('/reconstruct/:id', reconstructShipmentState);

// Week 3 Projections (Read Model) Routes
router.get('/projections', getProjections);
router.get('/projections/status', getProjectionStatus);
router.post('/projections/rebuild', rebuildProjections);

// Week 3 State Scrubbing (Point-in-Time State Query) Routes
router.get('/shipment/:id/scrub', scrubShipmentState);
router.get('/scrub/:id', scrubShipmentState);
router.post('/scrub', scrubShipmentState);

export default router;



