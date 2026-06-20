function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);

  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({ message });
}

// Catch-all for unknown routes
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
