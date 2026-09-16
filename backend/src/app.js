import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/corsOptions.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import commandRoutes from './routes/commandRoutes.js';
import queryRoutes from './routes/queryRoutes.js';

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

// Health Check Endpoint (Week 1 CQRS Architecture & Telemetry)
app.get('/health', (req, res) => {
  const memory = process.memoryUsage();
  res.status(200).json({
    status: 'UP',
    service: 'Audit Trail Event-Sourced Logistics Ledger API',
    architecture: 'CQRS + Event Sourcing Engine + Optimistic Concurrency Control (OCC)',
    week: 'Week 4: Concurrency Control (Optimistic Concurrency Control - OCC) Complete',
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    memoryUsage: {
      rssMB: (memory.rss / (1024 * 1024)).toFixed(2),
      heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2),
      heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2)
    },
    timestamp: new Date().toISOString()
  });
});

// Segregated CQRS Routers
// Write Side (Commands)
app.use('/api/commands', commandRoutes);
app.use('/commands', commandRoutes);

// Read Side (Queries)
app.use('/api/queries', queryRoutes);
app.use('/queries', queryRoutes);

// Root & API fallback mounts for direct endpoints
app.use('/api', commandRoutes);
app.use('/api', queryRoutes);
app.use('/', commandRoutes);
app.use('/', queryRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
