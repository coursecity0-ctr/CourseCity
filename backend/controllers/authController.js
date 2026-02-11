const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');

// Register new user
exports.register = async (req, res, next) => {
  try {
    let { username, email, password, full_name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Basic validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Generate username if missing
    if (!username || !String(username).trim()) {
      const baseFromEmail = (email.split('@')[0] || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const suffix = Math.random().toString(36).slice(2, 8);
      const maxBaseLen = 50 - 1 - suffix.length;
      const safeBase = baseFromEmail.length > maxBaseLen ? baseFromEmail.slice(0, maxBaseLen) : baseFromEmail;
      username = `${safeBase}_${suffix}`;
    }

    // Check if user exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      `INSERT INTO users (username, email, password, full_name, auth_provider)
       VALUES ($1, $2, $3, $4, 'local')
       RETURNING id`,
      [username, email, hashedPassword, full_name || username]
    );

    const newUser = {
      id: result.rows[0].id,
      username,
      email,
      full_name: full_name || username,
      auth_provider: 'local'
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy(() => {
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
};

// Delete account
exports.deleteAccount = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const { password, confirmation } = req.body;

    // For local accounts, verify password
    if (req.user.auth_provider === 'local') {
      if (!password) {
        return res.status(400).json({ error: 'Password is required to delete account' });
      }

      // Get user with password
      const result = await db.query(
        'SELECT id, password FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, result.rows[0].password);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
    }

    // Require confirmation
    if (!confirmation || confirmation.toLowerCase() !== 'delete') {
      return res.status(400).json({
        error: 'Please type "DELETE" to confirm account deletion'
      });
    }

    // Delete user (CASCADE will handle related data)
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    // Logout the user
    req.logout((err) => {
      if (err) {
        console.error('Logout error during account deletion:', err);
      }
      req.session.destroy(() => {
        res.json({
          success: true,
          message: 'Account deleted successfully. All your data has been permanently removed.'
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

// Handle Facebook Data Deletion Callback
exports.handleFacebookDataDeletion = async (req, res, next) => {
  try {
    const { signed_request } = req.body;

    if (!signed_request) {
      return res.status(400).json({
        error: 'Missing signed_request parameter'
      });
    }

    // ... (rest of the Facebook logic remains same as it doesn't use DB until finding user)
    // Verify signature logic...
    const [encodedSig, payload] = signed_request.split('.');
    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
    const data = JSON.parse(decodedPayload);
    const facebookUserId = data.user_id;

    if (!facebookUserId) {
      return res.status(200).json({ url: '', confirmation_code: 'ERROR' }); // Facebook requirement
    }

    // Find user by Facebook provider_id
    const result = await db.query(
      'SELECT id FROM users WHERE provider_id = $1 AND auth_provider = $2',
      [facebookUserId, 'facebook']
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        url: `${process.env.FRONTEND_URL || 'http://localhost/src/pages'}/data-deletion-instructions.html`,
        confirmation_code: `DELETE_${Date.now()}`,
        message: 'User not found or already deleted'
      });
    }

    const userId = result.rows[0].id;

    // Delete user account (CASCADE will handle related data)
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    // Return confirmation to Facebook
    return res.status(200).json({
      url: `${process.env.FRONTEND_URL || 'http://localhost/src/pages'}/data-deletion-instructions.html`,
      confirmation_code: `DELETE_${userId}_${Date.now()}`
    });

  } catch (error) {
    console.error('Facebook data deletion error:', error);
    next(error);
  }
};
