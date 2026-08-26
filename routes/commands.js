const express = require("express");
const { handleCommand } = require("../controllers/commandController");

const router = express.Router();

// POST /shipment/move
router.post("/move", handleCommand);

module.exports = router;
