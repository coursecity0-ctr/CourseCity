const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all users with pagination and filters
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      is_active = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    const countParams = [];
    let pIdx = 1;

    if (search) {
      whereClause += ` AND (username ILIKE $${pIdx} OR email ILIKE $${pIdx} OR full_name ILIKE $${pIdx})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
      countParams.push(searchTerm);
      pIdx++;
    }

    if (role) {
      whereClause += ` AND role = $${pIdx++}`;
      params.push(role);
      countParams.push(role);
    }

    if (is_active !== '') {
      whereClause += ` AND is_active = $${pIdx++}`;
      const isActiveValue = is_active === 'true';
      params.push(isActiveValue);
      countParams.push(isActiveValue);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated users
    const query = `SELECT id, username, email, full_name, profile_image, auth_provider, role, is_active, created_at, updated_at 
                  FROM users ${whereClause} 
                  ORDER BY created_at DESC 
                  LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);
    const users = result.rows;

    // Remove sensitive data
    users.forEach(user => {
      delete user.password;
    });

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      users
    });
  } catch (error) {
    next(error);
  }
};

// Get single user by ID
exports.getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, username, email, full_name, profile_image, auth_provider, role, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    delete user.password;

    // Get user stats
    const orderCountResult = await db.query(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = $1',
      [id]
    );

    const courseCountResult = await db.query(
      'SELECT COUNT(*) as total FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = $1',
      [id]
    );

    user.stats = {
      totalOrders: parseInt(orderCountResult.rows[0].total),
      totalCoursesPurchased: parseInt(courseCountResult.rows[0].total)
    };

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user exists
    const checkResult = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = parseInt(id);

    // Prevent admin from removing their own admin role
    if (req.user.id === userId && updates.role && updates.role !== 'admin') {
      return res.status(400).json({ error: 'You cannot remove your own admin role' });
    }

    const allowedFields = ['username', 'email', 'full_name', 'role', 'is_active'];
    const updateFields = [];
    const values = [];
    let pIdx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${pIdx++}`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(userId);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${pIdx}`;

    await db.query(query, values);

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    // Handle duplicate entry (PostgreSQL unique_violation)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1', [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Activate/Deactivate user
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const userId = parseInt(id);

    // Prevent admin from deactivating themselves
    if (req.user.id === userId && is_active === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    const result = await db.query(
      'UPDATE users SET is_active = $1 WHERE id = $2',
      [is_active, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};
