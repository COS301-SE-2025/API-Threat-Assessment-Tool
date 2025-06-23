// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error('Error:', err.message);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    statusCode: 500
  });
};

module.exports = { errorHandler };