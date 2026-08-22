import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Audit Trail Backend (Day 5 - CQRS Event Filtering)`);
  console.log(`====================================================`);
  console.log(`[Server] Listening on http://localhost:${PORT}`);
  console.log(`[Health] Check status at http://localhost:${PORT}/health`);
  console.log(`----------------------------------------------------`);
  console.log(`[CQRS Write Side - Commands (POST)]`);
  console.log(` - POST /api/commands/shipment/create`);
  console.log(` - POST /api/commands/shipment/move`);
  console.log(` - POST /api/commands/shipment/status`);
  console.log(`----------------------------------------------------`);
  console.log(`[CQRS Read Side - Queries (GET)]`);
  console.log(` - GET  /api/queries/shipments`);
  console.log(` - GET  /api/queries/shipment/:id`);
  console.log(` - GET  /api/queries/shipment/:id/events`);
  console.log(` - GET  /api/queries/events (Filtered Event Stream)`);
  console.log(` - GET  /api/queries/search`);
  console.log(` - GET  /api/queries/dashboard`);
  console.log(` - GET  /api/queries/stats`);
  console.log(`====================================================`);
});


