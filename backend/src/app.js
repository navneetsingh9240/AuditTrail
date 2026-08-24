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

// Health Check Endpoint (Week 1 CQRS Architecture)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Audit Trail Event-Sourced Logistics Ledger API',
    week: 'Week 1: CQRS Setup & Segregated Routers',
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

// Root fallback mounts for direct endpoints
app.use('/api', commandRoutes);
app.use('/api', queryRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
