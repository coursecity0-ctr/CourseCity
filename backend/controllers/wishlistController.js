const db = require('../config/database');

// Get user's wishlist
exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT w.id, w.course_id, w.added_at,
              co.title, co.description, co.image_url, co.price, co.original_price,
              co.instructor, co.rating, co.reviews_count, co.category, co.difficulty
       FROM wishlist w
       JOIN courses co ON w.course_id = co.id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      items: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// Add course to wishlist
exports.addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if course exists
    const courseCheck = await db.query('SELECT id FROM courses WHERE id = $1 AND is_active = true', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already in wishlist
    const existing = await db.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Course already in wishlist' });
    }

    // Add to wishlist
    await db.query(
      'INSERT INTO wishlist (user_id, course_id) VALUES ($1, $2)',
      [userId, courseId]
    );

    res.status(201).json({
      success: true,
      message: 'Course added to wishlist successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Remove course from wishlist
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    const result = await db.query(
      'DELETE FROM wishlist WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not in wishlist' });
    }

    res.json({
      success: true,
      message: 'Course removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
};
