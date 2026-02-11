const db = require('../config/database');

// Get user's cart
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT c.id, c.course_id, c.quantity, c.added_at,
              co.title, co.image_url, co.price, co.original_price, co.instructor, co.rating
       FROM cart c
       JOIN courses co ON c.course_id = co.id
       WHERE c.user_id = $1
       ORDER BY c.added_at DESC`,
      [userId]
    );

    const cartItems = result.rows;
    const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    res.json({
      success: true,
      count: cartItems.length,
      total: total.toFixed(2),
      items: cartItems
    });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId, quantity = 1 } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if course exists
    const courseCheck = await db.query('SELECT id FROM courses WHERE id = $1 AND is_active = true', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already in cart
    const existing = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existing.rows.length > 0) {
      // Update quantity
      await db.query(
        'UPDATE cart SET quantity = quantity + $1 WHERE id = $2',
        [quantity, existing.rows[0].id]
      );
    } else {
      // Add new item
      await db.query(
        'INSERT INTO cart (user_id, course_id, quantity) VALUES ($1, $2, $3)',
        [userId, courseId, quantity]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Course added to cart successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const result = await db.query(
      'UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3',
      [quantity, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({
      success: true,
      message: 'Cart updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    next(error);
  }
};

// Clear entire cart
exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await db.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};
