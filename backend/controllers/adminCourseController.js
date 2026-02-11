const db = require('../config/database');
const courseController = require('./courseController');

// Reuse existing course controller methods
exports.createCourse = courseController.createCourse;
exports.updateCourse = courseController.updateCourse;
exports.deleteCourse = courseController.deleteCourse;

// Get all courses (admin view - includes inactive)
exports.getAllCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      category = '',
      difficulty = '',
      search = '',
      is_active = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    const countParams = [];
    let pIdx = 1;

    if (category && category !== 'all') {
      whereClause += ` AND category = $${pIdx++}`;
      params.push(category);
      countParams.push(category);
    }

    if (difficulty) {
      whereClause += ` AND difficulty = $${pIdx++}`;
      params.push(difficulty);
      countParams.push(difficulty);
    }

    if (search) {
      whereClause += ` AND (title ILIKE $${pIdx} OR description ILIKE $${pIdx})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
      countParams.push(searchTerm);
      pIdx++;
    }

    if (is_active !== '') {
      whereClause += ` AND is_active = $${pIdx++}`;
      const isActiveValue = is_active === 'true';
      params.push(isActiveValue);
      countParams.push(isActiveValue);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM courses ${whereClause}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated courses
    const query = `SELECT * FROM courses ${whereClause} ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
    params.push(parseInt(limit), offset);
    const result = await db.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      courses: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// Get course analytics
exports.getCourseAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const courseResult = await db.query('SELECT id, title FROM courses WHERE id = $1', [id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get total purchases
    const purchaseCount = await db.query(
      `SELECT SUM(quantity) as total FROM order_items WHERE course_id = $1`,
      [id]
    );

    // Get total revenue from this course
    const revenueResult = await db.query(
      `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.course_id = $1 AND o.status = 'completed'`,
      [id]
    );

    // Get purchases by month (last 6 months)
    const purchasesByMonthResult = await db.query(
      `SELECT 
        to_char(o.created_at, 'YYYY-MM') as month,
        SUM(oi.quantity) as purchases
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.course_id = $1 AND o.status = 'completed'
       AND o.created_at >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY to_char(o.created_at, 'YYYY-MM')
       ORDER BY month DESC`,
      [id]
    );

    res.json({
      success: true,
      analytics: {
        courseId: id,
        courseTitle: courseResult.rows[0].title,
        totalPurchases: parseInt(purchaseCount.rows[0].total) || 0,
        totalRevenue: parseFloat(revenueResult.rows[0].total) || 0,
        purchasesByMonth: purchasesByMonthResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Bulk activate/deactivate courses
exports.bulkUpdateCourses = async (req, res, next) => {
  try {
    const { courseIds, is_active } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ error: 'Course IDs array is required' });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    // PostgreSQL any() is often cleaner than placeholders for "IN"
    const result = await db.query(
      `UPDATE courses SET is_active = $1 WHERE id = ANY($2) RETURNING id`,
      [is_active, courseIds]
    );

    res.json({
      success: true,
      message: `${result.rowCount} course(s) ${is_active ? 'activated' : 'deactivated'} successfully`,
      affectedRows: result.rowCount
    });
  } catch (error) {
    next(error);
  }
};
