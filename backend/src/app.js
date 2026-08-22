import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/corsOptions.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import commandRoutes from './routes/commandRoutes.js';
import queryRoutes from './routes/queryRoutes.js';

const app = express();

// Strict CORS & Body Parsing Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request Audit Logging Middleware
app.use(requestLogger);

// Health Check Endpoint (Day 5 Update - CQRS Event Query & Filtering Engine)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Audit Trail CQRS API',
    day: 5,
    commit: 'CQRS Event Query & Audit Filtering Engine',
    timestamp: new Date().toISOString()
  });
});

// CQRS Segregated Routes
app.use('/api/commands', commandRoutes);
app.use('/api/queries', queryRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;


