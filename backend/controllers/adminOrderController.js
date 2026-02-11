const db = require('../config/database');

// Get all orders with pagination and filters
exports.getAllOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      search = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    const countParams = [];
    let pIdx = 1;

    if (status) {
      whereClause += ` AND o.status = $${pIdx++}`;
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      whereClause += ` AND (u.email ILIKE $${pIdx} OR u.full_name ILIKE $${pIdx} OR u.username ILIKE $${pIdx})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
      countParams.push(searchTerm);
      pIdx++;
    }

    if (startDate) {
      whereClause += ` AND o.created_at::date >= $${pIdx++}`;
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND o.created_at::date <= $${pIdx++}`;
      params.push(endDate);
      countParams.push(endDate);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ${whereClause}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated orders
    const query = `SELECT 
                      o.id, 
                      o.user_id,
                      o.total_amount, 
                      o.status, 
                      o.payment_method,
                      o.created_at,
                      o.updated_at,
                      u.email,
                      u.username,
                      u.full_name
                   FROM orders o
                   JOIN users u ON o.user_id = u.id
                   ${whereClause}
                   ORDER BY o.created_at DESC
                   LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);
    const orders = result.rows;

    // Get order items for each order
    for (let order of orders) {
      const itemsResult = await db.query(
        `SELECT oi.id, oi.course_id, oi.price, oi.quantity,
                co.title, co.image_url, co.instructor
         FROM order_items oi
         JOIN courses co ON oi.course_id = co.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      orders
    });
  } catch (error) {
    next(error);
  }
};

// Get single order by ID
exports.getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT o.*, u.email, u.username, u.full_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Get order items
    const itemsResult = await db.query(
      `SELECT oi.id, oi.course_id, oi.price, oi.quantity,
              co.title, co.image_url, co.instructor, co.description
       FROM order_items oi
       JOIN courses co ON oi.course_id = co.id
       WHERE oi.order_id = $1`,
      [id]
    );

    order.items = itemsResult.rows;

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get order analytics
exports.getOrderAnalytics = async (req, res, next) => {
  try {
    // Get total revenue
    const totalRevenueResult = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'"
    );

    // Get revenue this month
    const monthlyRevenueResult = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE status = 'completed' 
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`
    );

    // Get revenue this year
    const yearlyRevenueResult = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE status = 'completed' 
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`
    );

    // Get orders by status
    const ordersByStatusResult = await db.query(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
       FROM orders
       GROUP BY status`
    );

    // Get revenue by month (last 12 months)
    const revenueByMonthResult = await db.query(
      `SELECT 
        to_char(created_at, 'YYYY-MM') as month,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as revenue
       FROM orders
       WHERE status = 'completed'
       AND created_at >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY to_char(created_at, 'YYYY-MM')
       ORDER BY month DESC`
    );

    // Get top selling courses
    const topCoursesResult = await db.query(
      `SELECT 
        co.id,
        co.title,
        SUM(oi.quantity) as total_sold,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
       FROM order_items oi
       JOIN courses co ON oi.course_id = co.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed'
       GROUP BY co.id, co.title
       ORDER BY total_sold DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      analytics: {
        revenue: {
          total: parseFloat(totalRevenueResult.rows[0].total) || 0,
          monthly: parseFloat(monthlyRevenueResult.rows[0].total) || 0,
          yearly: parseFloat(yearlyRevenueResult.rows[0].total) || 0
        },
        ordersByStatus: ordersByStatusResult.rows,
        revenueByMonth: revenueByMonthResult.rows,
        topCourses: topCoursesResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};
