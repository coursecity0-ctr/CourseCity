// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized. Please log in.' });
};

// Optional authentication - continues even if not authenticated
const optionalAuth = (req, res, next) => {
  // Just continue, user will be in req.user if authenticated
  next();
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  
  if (!req.user) {
    return res.status(401).json({ error: 'User not found in session.' });
  }
  
  // Check if user is active
  if (req.user.is_active === false || req.user.is_active === 0) {
    return res.status(403).json({ error: 'Your account has been deactivated.' });
  }
  
  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  
  next();
};

// Middleware to check if user is admin or moderator
const isAdminOrModerator = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  
  if (!req.user) {
    return res.status(401).json({ error: 'User not found in session.' });
  }
  
  // Check if user is active
  if (req.user.is_active === false || req.user.is_active === 0) {
    return res.status(403).json({ error: 'Your account has been deactivated.' });
  }
  
  // Check if user has admin or moderator role
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ error: 'Access denied. Admin or moderator privileges required.' });
  }
  
  next();
};

module.exports = {
  isAuthenticated,
  optionalAuth,
  isAdmin,
  isAdminOrModerator
};


