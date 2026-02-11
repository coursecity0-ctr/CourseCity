const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Rate limiting for authentication endpoints
 * Prevents brute force attacks
 * More lenient limits for development
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // 5 in production, 20 in development
  message: {
    error: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
  // Note: Using default in-memory store (can be cleared by restarting server)
});

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive operations
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    error: 'Too many attempts, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Configure Helmet for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://kit.fontawesome.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://kit.fontawesome.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://www.facebook.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://www.facebook.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for OAuth redirects
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs in body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, ''); // Remove event handlers
      }
    });
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    });
  }

  next();
};

/**
 * Authorization check - ensure user can only access their own data
 */
const ensureOwnership = (userIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if the requested resource belongs to the user
    const resourceUserId = req.params.userId || req.body[userIdField] || req.query[userIdField];
    
    if (resourceUserId && parseInt(resourceUserId) !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Access denied. You can only access your own resources.' });
    }

    next();
  };
};

module.exports = {
  authLimiter,
  apiLimiter,
  strictLimiter,
  helmetConfig,
  sanitizeInput,
  ensureOwnership
};

