const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await db.query(
      'SELECT id, username, email, full_name, profile_image, auth_provider, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Convert profile_image path to URL if stored locally
    if (user.profile_image && !user.profile_image.startsWith('http')) {
      user.profile_image = `/uploads/profile-images/${path.basename(user.profile_image)}`;
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Update profile attributes
exports.updateProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { full_name, email } = req.body;
    const updates = {};
    const values = [];

    // Build dynamic update query
    if (full_name !== undefined) {
      updates.full_name = full_name.trim();
      values.push(updates.full_name);
    }

    // Email can only be updated for local auth users
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

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Build SQL query dynamically with $1, $2 placeholders
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
    values.push(req.user.id);
    const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`;

    await db.query(query, values);

    // Get updated user
    const result = await db.query(
      'SELECT id, username, email, full_name, profile_image, auth_provider, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const updatedUser = result.rows[0];

    if (updatedUser.profile_image && !updatedUser.profile_image.startsWith('http')) {
      updatedUser.profile_image = `/uploads/profile-images/${path.basename(updatedUser.profile_image)}`;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Delete profile image
exports.deleteProfileImage = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await db.query(
      'SELECT profile_image FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentImage = result.rows[0].profile_image;

    if (currentImage && !currentImage.startsWith('http')) {
      const imagePath = path.join(__dirname, '../uploads/profile-images', path.basename(currentImage));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.query(
      'UPDATE users SET profile_image = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );

    const updatedResult = await db.query(
      'SELECT id, username, email, full_name, profile_image, auth_provider, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile image deleted successfully',
      user: updatedResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
