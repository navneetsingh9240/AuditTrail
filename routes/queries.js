const express = require("express");
const {
  getCurrentState,
  getHistory,
  getStateAsOf,
} = require("../controllers/queryController");

const router = express.Router();

// GET /shipment/:id
router.get("/:id", getCurrentState);

// GET /shipment/:id/history
router.get("/:id/history", getHistory);

// GET /shipment/:id/as-of?timestamp=2026-08-14T00:00:00Z
router.get("/:id/as-of", getStateAsOf);

module.exports = router;
