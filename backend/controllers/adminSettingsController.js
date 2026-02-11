const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get admin profile
exports.getAdminProfile = async (req, res, next) => {
  try {
    let query = 'SELECT id, username, email, full_name, profile_image, auth_provider, created_at';

    // Check if phone and bio columns exist in PostgreSQL
    const columnCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('phone', 'bio')
    `);

    const existingColumns = columnCheck.rows.map(c => c.column_name);
    if (existingColumns.includes('phone')) query += ', phone';
    if (existingColumns.includes('bio')) query += ', bio';

    query += ' FROM users WHERE id = $1';

    const result = await db.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (!user.hasOwnProperty('phone')) user.phone = null;
    if (!user.hasOwnProperty('bio')) user.bio = null;

    const path = require('path');
    if (user.profile_image && !user.profile_image.startsWith('http')) {
      user.profile_image = `/uploads/profile-images/${path.basename(user.profile_image)}`;
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    next(error);
  }
};

// Update admin profile
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const { full_name, email, phone, bio } = req.body;
    const updates = {};
    const values = [];

    // Check existing columns
    const columnCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('phone', 'bio')
    `);
    const existingColumns = columnCheck.rows.map(c => c.column_name);
    const hasPhone = existingColumns.includes('phone');
    const hasBio = existingColumns.includes('bio');

    if (full_name !== undefined) {
      updates.full_name = full_name.trim();
      values.push(updates.full_name);
    }

    if (email !== undefined && req.user.auth_provider === 'local') {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      updates.email = email.trim();
      values.push(updates.email);
    }

    if (phone !== undefined && hasPhone) {
      updates.phone = phone.trim();
      values.push(updates.phone);
    } else if (phone !== undefined && !hasPhone) {
      try {
        await db.query('ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL');
        updates.phone = phone.trim();
        values.push(updates.phone);
      } catch (alterError) {
        console.warn('Could not add phone column:', alterError.message);
      }
    }

    if (bio !== undefined && hasBio) {
      updates.bio = bio.trim();
      values.push(updates.bio);
    } else if (bio !== undefined && !hasBio) {
      try {
        await db.query('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL');
        updates.bio = bio.trim();
        values.push(updates.bio);
      } catch (alterError) {
        console.warn('Could not add bio column:', alterError.message);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
    values.push(req.user.id);
    const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`;

    await db.query(query, values);

    // Get updated user
    let selectQuery = 'SELECT id, username, email, full_name, profile_image, auth_provider, created_at';
    if (hasPhone || updates.phone) selectQuery += ', phone';
    if (hasBio || updates.bio) selectQuery += ', bio';
    selectQuery += ' FROM users WHERE id = $1';

    const result = await db.query(selectQuery, [req.user.id]);
    const user = result.rows[0];
    if (!user.hasOwnProperty('phone')) user.phone = null;
    if (!user.hasOwnProperty('bio')) user.bio = null;

    const path = require('path');
    if (user.profile_image && !user.profile_image.startsWith('http')) {
      user.profile_image = `/uploads/profile-images/${path.basename(user.profile_image)}`;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const result = await db.query(
      'SELECT id, password, auth_provider FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.auth_provider !== 'local' || !user.password) {
      return res.status(400).json({ error: 'Password change not available for OAuth users' });
    }

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get admin settings
exports.getAdminSettings = async (req, res, next) => {
  try {
    const defaultSettings = {
      platform_name: 'CourseCity',
      platform_email: 'coursecity0@gmail.com',
      platform_phone: '',
      platform_address: '',
      currency: 'GHS',
      timezone: 'Africa/Accra',
      theme: 'auto',
      sidebar_collapse: 'remember',
      language: 'en',
      email_notifications: true,
      order_notifications: true,
      user_notifications: true,
      system_alerts: true,
      marketing_emails: false,
      two_factor_auth: false,
      login_notifications: true,
      session_timeout: true,
      maintenance_mode: false,
      maintenance_message: ''
    };

    try {
      const result = await db.query('SELECT * FROM admin_settings WHERE id = 1');
      if (result.rows.length > 0) {
        return res.json({
          success: true,
          settings: { ...defaultSettings, ...result.rows[0] }
        });
      }
    } catch (e) {
      // Table might not exist
    }

    res.json({
      success: true,
      settings: defaultSettings
    });
  } catch (error) {
    next(error);
  }
};

// Update admin settings
exports.updateAdminSettings = async (req, res, next) => {
  try {
    const settings = req.body;
    const allowedSettings = [
      'platform_name', 'platform_email', 'platform_phone', 'platform_address',
      'currency', 'timezone', 'theme', 'sidebar_collapse', 'language',
      'email_notifications', 'order_notifications', 'user_notifications',
      'system_alerts', 'marketing_emails', 'two_factor_auth',
      'login_notifications', 'session_timeout', 'maintenance_mode', 'maintenance_message'
    ];

    const updates = {};
    for (const key of allowedSettings) {
      if (settings[key] !== undefined) {
        updates[key] = settings[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid settings to update' });
    }

    // PostgreSQL ON CONFLICT syntax
    const columns = ['id', ...Object.keys(updates)];
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const updateClauses = Object.keys(updates).map(key => `${key} = EXCLUDED.${key}`).join(', ');

    const query = `
      INSERT INTO admin_settings (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET
      ${updateClauses}, updated_at = CURRENT_TIMESTAMP
    `;

    await db.query(query, [1, ...Object.values(updates)]);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updates
    });
  } catch (error) {
    next(error);
  }
};

// System actions (Stubs)
exports.clearCache = async (req, res, next) => {
  res.json({ success: true, message: 'Cache cleared successfully' });
};

exports.backupDatabase = async (req, res, next) => {
  res.json({ success: true, message: 'Database backup initiated.' });
};
