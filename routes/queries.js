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

// GET /shipment
// Returns available shipment query endpoints
router.get("/", (req, res) => {
    res.json({
        message: "AuditTrail Shipment Query API",
        endpoints: {
            currentState: "GET /shipment/:id",
            history: "GET /shipment/:id/history",
            stateAsOf: "GET /shipment/:id/as-of?timestamp=<ISO_TIMESTAMP>"
        }
    });
});

module.exports = router;
