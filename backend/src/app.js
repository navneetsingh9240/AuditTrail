import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/corsOptions.js';
import { errorHandler } from './middleware/errorHandler.js';
import commandRoutes from './routes/commandRoutes.js';
import queryRoutes from './routes/queryRoutes.js';

const app = express();

// Strict CORS Middleware (Day 2 Security & CQRS Headers)
app.use(cors(corsOptions));
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Audit Trail CQRS API' });
});

// CQRS Segregated Routes
app.use('/api/commands', commandRoutes);
app.use('/api/queries', queryRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
