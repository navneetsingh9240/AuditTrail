import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`🚀 Audit Trail Backend: Week 1 - CQRS Architecture Setup`);
  console.log(`===========================================================`);
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Health] Check status at http://localhost:${PORT}/health`);
  console.log(`-----------------------------------------------------------`);
  console.log(`[Write Side - Command Router (/api/commands)]`);
  console.log(` - POST /api/commands/shipment/create  -> Create new shipment`);
  console.log(` - POST /api/commands/shipment/move    -> Move shipment location`);
  console.log(` - POST /api/commands/shipment/status  -> Update shipment status`);
  console.log(`-----------------------------------------------------------`);
  console.log(`[Read Side - Query Router (/api/queries)]`);
  console.log(` - GET  /api/queries/shipments         -> List all shipments`);
  console.log(` - GET  /api/queries/shipment/:id      -> Get current state`);
  console.log(` - GET  /api/queries/shipment/:id/events-> Get aggregate event stream`);
  console.log(` - GET  /api/queries/events            -> Filtered event stream log`);
  console.log(` - GET  /api/queries/search            -> Search shipments by term/status`);
  console.log(` - GET  /api/queries/dashboard         -> Aggregated dashboard data`);
  console.log(`===========================================================`);
});
