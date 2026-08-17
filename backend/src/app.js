import express from 'express';
import cors from 'cors';
import commandRoutes from './routes/commandRoutes.js';
import queryRoutes from './routes/queryRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Audit Trail CQRS API' });
});

// CQRS Segregated Routes
app.use('/api/commands', commandRoutes);
app.use('/api/queries', queryRoutes);

export default app;
