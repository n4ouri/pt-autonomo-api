export function notFoundHandler(req, res) {
  res.status(404).json({ status: 'error', message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 400;
  res.status(status).json({ status: 'error', message: err.message || 'Internal server error' });
}
