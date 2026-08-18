/**
 * CORS Configuration Principles for CQRS Architecture
 * Restricts Cross-Origin requests to trusted client origins and allowed CQRS HTTP methods.
 */

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173', // Vite React dev server
  'http://localhost:3000',                          # Alternative dev port
];

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman in dev)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin '${origin}' is not allowed by CORS policy`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'], // Strictly CQRS GET (Queries) & POST (Commands)
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-command-type', // Custom header for CQRS tracking
    'x-client-version'
  ],
  exposedHeaders: ['x-command-id', 'x-event-version'],
  credentials: true,
  optionsSuccessStatus: 200 // Legacy browser support for 204 preflight
};
