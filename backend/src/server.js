import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

// Connect to MongoDB Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`🚀 Audit Trail Backend: Week 1 to Week 4 Architecture Complete`);
  console.log(`===========================================================`);
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Health] Check status at http://localhost:${PORT}/health`);
  console.log(`-----------------------------------------------------------`);
  console.log(`[Write Side - Command Router (/api/commands)]`);
  console.log(` - POST /api/commands/shipment/create  -> Append SHIPMENT_CREATED event (OCC check)`);
  console.log(` - POST /api/commands/shipment/move    -> Append SHIPMENT_MOVED event (OCC expectedVersion)`);
  console.log(` - POST /api/commands/shipment/status  -> Append STATUS_UPDATED event (OCC expectedVersion)`);
  console.log(` - POST /api/commands/shipment/sensor  -> Record TEMPERATURE_SPIKE / SENSOR_READING`);
  console.log(` - POST /api/commands/shipment/custom  -> Append arbitrary domain event with OCC check`);
  console.log(`-----------------------------------------------------------`);
  console.log(`[Read Side - Query Router (/api/queries)]`);
  console.log(` - GET  /api/queries/shipments          -> List all projected shipments`);
  console.log(` - GET  /api/queries/shipment/:id       -> Get current state snapshot`);
  console.log(` - GET  /api/queries/shipment/:id/events -> Get aggregate event stream`);
  console.log(` - GET  /api/queries/events             -> Filtered audit event log stream`);
  console.log(` - GET  /api/queries/search             -> Search shipments by term/status`);
  console.log(` - GET  /api/queries/dashboard          -> Aggregated dashboard telemetry`);
  console.log(` - GET  /api/queries/audit/immutability -> Prove Event Store append-only protection`);
  console.log(` - GET  /api/queries/audit/occ          -> Prove Optimistic Concurrency Control (OCC)`);
  console.log(` - GET  /api/queries/shipment/:id/reconstruct -> Prove state folding from events`);
  console.log(` - GET  /api/queries/projections        -> Fetch denormalized read models`);
  console.log(` - GET  /api/queries/projections/status -> Check read model sync status`);
  console.log(` - POST /api/queries/projections/rebuild-> Rebuild read models from event stream`);
  console.log(` - GET  /api/queries/shipment/:id/scrub -> Point-in-time state scrubbing`);
  console.log(`===========================================================`);
});
