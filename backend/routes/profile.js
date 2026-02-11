const express = require('express');
const router = express.Router();
const multer = require('multer');
const profileController = require('../controllers/profileController');
const upload = require('../config/multer');
const { isAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// Get current user's profile
router.get('/', profileController.getProfile);

// Update profile attributes
router.put('/', profileController.updateProfile);

// Upload profile picture
router.post('/avatar', (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
        }
        return res.status(400).json({ error: err.message });
      }
      // Handle other errors (fileFilter, etc.)
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = require('../config/database');
    const path = require('path');

    // Get current profile image to delete old one
    const result = await db.query(
      'SELECT profile_image FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldImage = result.rows[0].profile_image;

    // Delete old image if it exists and is local file
    if (oldImage && !oldImage.startsWith('http')) {
      const fs = require('fs');
      const oldImagePath = path.join(__dirname, '../uploads/profile-images', path.basename(oldImage));
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (e) {
        console.warn('Could not delete old image file:', e.message);
      }
    }

    // Save new image path in database (relative path)
    const imagePath = req.file.filename;

    await db.query(
      'UPDATE users SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [imagePath, req.user.id]
    );

    // Get updated user
    const updatedResult = await db.query(
      'SELECT id, username, email, full_name, profile_image, auth_provider, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const updatedUser = updatedResult.rows[0];

    // Convert to URL path
    if (updatedUser.profile_image) {
      updatedUser.profile_image = `/uploads/profile-images/${updatedUser.profile_image}`;
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Delete profile picture
router.delete('/avatar', profileController.deleteProfileImage);

module.exports = router;
