/**
 * Centralized Error Handling Middleware (Day 2)
 * Handles CORS rejection errors, validation failures, and internal server errors gracefully.
 */

export const errorHandler = (err, req, res, next) => {
  // CORS Error handling
  if (err.message && err.message.includes('CORS Policy')) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied by CORS Policy',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // General Error Fallback
  console.error('[Error Handler]', err);
  return res.status(err.status || 500).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
};
