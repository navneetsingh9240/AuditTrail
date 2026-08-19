/**
 * CQRS Request Logger Middleware (Day 3 Update)
 * Logs incoming commands (POST) and queries (GET) with high clarity for auditability.
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const isCommand = url.includes('/api/commands');
    const isQuery = url.includes('/api/queries');
    const tag = isCommand ? '[CQRS-COMMAND]' : isQuery ? '[CQRS-QUERY]' : '[HTTP]';

    console.log(`${tag} ${timestamp} | ${method} ${url} -> ${statusCode} (${duration}ms)`);
  });

  next();
};
