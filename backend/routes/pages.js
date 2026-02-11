const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const path = require('path');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';

/**
 * Middleware to protect frontend pages
 * Redirects to login if not authenticated
 */
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  
  // Store the intended destination for redirect after login
  const intendedUrl = req.originalUrl;
  const loginUrl = `${FRONTEND_URL}/src/auth/login.html?redirect=${encodeURIComponent(intendedUrl)}`;
  
  return res.redirect(loginUrl);
};

/**
 * Protected page routes
 * These routes require authentication
 */

// Cart page - requires authentication
router.get('/cart', requireAuth, (req, res) => {
  res.redirect(`${FRONTEND_URL}/src/pages/cart.html`);
});

// Checkout page - requires authentication  
router.get('/checkout', requireAuth, (req, res) => {
  res.redirect(`${FRONTEND_URL}/src/pages/checkout.html`);
});

// Profile page - requires authentication
router.get('/profile', requireAuth, (req, res) => {
  res.redirect(`${FRONTEND_URL}/src/pages/profile.html`);
});

// My Courses page - requires authentication
router.get('/my-courses', requireAuth, (req, res) => {
  res.redirect(`${FRONTEND_URL}/src/pages/my-courses.html`);
});

// Wishlist page - requires authentication
router.get('/wishlist', requireAuth, (req, res) => {
  res.redirect(`${FRONTEND_URL}/src/pages/wishlist.html`);
});

// Notifications page - requires authentication
router.get('/notifications', requireAuth, (req, res) => {
  res.redirect(`${FRONTEND_URL}/src/pages/notifications.html`);
});

module.exports = router;
