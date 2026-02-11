// Global error handling middleware
// Prevents information leakage and provides secure error responses
const errorHandler = (err, req, res, next) => {
  // Log error details (server-side only)
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak sensitive information to clients
  const isDevelopment = process.env.NODE_ENV === 'development';

  // MySQL errors - sanitize for client
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      error: 'Duplicate entry',
      message: 'This record already exists'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced record does not exist'
    });
  }

  if (err.code && err.code.startsWith('ER_')) {
    return res.status(400).json({
      error: 'Database error',
      message: isDevelopment ? err.message : 'An error occurred processing your request'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message
    });
  }

  // Authentication errors
  if (err.name === 'AuthenticationError' || err.status === 401) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid credentials or session expired'
    });
  }

  // Authorization errors
  if (err.status === 403) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You do not have permission to perform this action'
    });
  }

  // Default error - never leak stack traces or internal details in production
  const statusCode = err.status || err.statusCode || 500;
  const errorMessage = isDevelopment 
    ? err.message || 'Internal server error'
    : 'An internal error occurred. Please try again later.';

  res.status(statusCode).json({
    error: errorMessage,
    ...(isDevelopment && { 
      stack: err.stack,
      details: err.message 
    })
  });
};

module.exports = errorHandler;


