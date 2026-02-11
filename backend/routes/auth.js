const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');
const { authLimiter, strictLimiter } = require('../middleware/security');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';

// Register (rate limited)
router.post('/register', authLimiter, authController.register);

// Login with email/password (rate limited)
router.post('/login', authLimiter, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ error: info.message || 'Authentication failed' });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      
      return res.json({
        success: true,
        message: 'Logged in successfully',
        user
      });
    });
  })(req, res, next);
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/src/auth/login.html` }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(FRONTEND_URL);
  }
);

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${FRONTEND_URL}/src/auth/login.html` }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(FRONTEND_URL);
  }
);

// Get current user
router.get('/me', authController.getCurrentUser);

// Check authentication status (for frontend auth checks)
router.get('/status', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        profile_image: req.user.profile_image
      }
    });
  } else {
    return res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }
});

// Logout
router.post('/logout', authController.logout);

// Delete account (requires authentication, strict rate limit)
router.delete('/delete-account', strictLimiter, isAuthenticated, authController.deleteAccount);

// Facebook Data Deletion Callback (for Facebook App Review)
router.post('/facebook/data-deletion', authController.handleFacebookDataDeletion);

module.exports = router;


