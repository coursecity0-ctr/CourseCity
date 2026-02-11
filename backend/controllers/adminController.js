const db = require('../config/database');

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get total users count
    const userCount = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(userCount.rows[0].total);

    // Get active users count
    const activeUserCount = await db.query('SELECT COUNT(*) as total FROM users WHERE is_active = true');
    const activeUsers = parseInt(activeUserCount.rows[0].total);

    // Get total courses count
    const courseCount = await db.query('SELECT COUNT(*) as total FROM courses');
    const totalCourses = parseInt(courseCount.rows[0].total);

    // Get active courses count
    const activeCourseCount = await db.query('SELECT COUNT(*) as total FROM courses WHERE is_active = true');
    const activeCourses = parseInt(activeCourseCount.rows[0].total);

    // Get total orders count
    const orderCount = await db.query('SELECT COUNT(*) as total FROM orders');
    const totalOrders = parseInt(orderCount.rows[0].total);

    // Get completed orders count
    const completedOrderCount = await db.query("SELECT COUNT(*) as total FROM orders WHERE status = 'completed'");
    const completedOrders = parseInt(completedOrderCount.rows[0].total);

    // Get total revenue (sum of completed orders)
    const revenueResult = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'"
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total) || 0;

    // Get revenue this month
    const monthlyRevenueResult = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM orders 
       WHERE status = 'completed' 
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`
    );
    const monthlyRevenue = parseFloat(monthlyRevenueResult.rows[0].total) || 0;

    // Get recent orders (last 10)
    const recentOrdersResult = await db.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, u.email, u.full_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    // Get recent users (last 10)
    const recentUsersResult = await db.query(
      `SELECT id, username, email, full_name, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`
    );

    // Get orders by status
    const ordersByStatusResult = await db.query(
      `SELECT status, COUNT(*) as count
       FROM orders
       GROUP BY status`
    );

    // Get revenue by month (last 6 months)
    const revenueByMonthResult = await db.query(
      `SELECT 
        to_char(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(total_amount), 0) as revenue
       FROM orders
       WHERE status = 'completed'
       AND created_at >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY to_char(created_at, 'YYYY-MM')
       ORDER BY month DESC`
    );

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        courses: {
          total: totalCourses,
          active: activeCourses,
          inactive: totalCourses - activeCourses
        },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          pending: totalOrders - completedOrders
        },
        revenue: {
          total: totalRevenue.toFixed(2),
          monthly: monthlyRevenue.toFixed(2),
          byMonth: revenueByMonthResult.rows
        },
        ordersByStatus: ordersByStatusResult.rows,
        recentOrders: recentOrdersResult.rows,
        recentUsers: recentUsersResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get system health check
exports.getSystemHealth = async (req, res, next) => {
  try {
    // Test database connection
    const dbTest = await db.query('SELECT 1 as test');
    const dbStatus = dbTest.rows.length > 0 ? 'healthy' : 'unhealthy';

    // Get database size info (PostgreSQL info_schema)
    const dbSize = await db.query(
      `SELECT 
        current_database() AS "Database",
        pg_size_pretty(pg_database_size(current_database())) AS "Size"`
    );

    res.json({
      success: true,
      health: {
        database: dbStatus,
        databaseInfo: dbSize.rows[0] || { Size: '0' },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};
