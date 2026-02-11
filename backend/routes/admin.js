const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const adminUserController = require('../controllers/adminUserController');
const adminCourseController = require('../controllers/adminCourseController');
const adminOrderController = require('../controllers/adminOrderController');
const adminSettingsController = require('../controllers/adminSettingsController');

// Verify admin access endpoint (checks if user is admin)
// This route uses isAdmin middleware directly, not router.use
router.get('/verify', isAdmin, (req, res) => {
  res.json({
    success: true,
    authorized: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// All other admin routes require admin authentication
router.use(isAdmin);

// Dashboard routes
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/health', adminController.getSystemHealth);

// User management routes
router.get('/users', adminUserController.getAllUsers);
router.get('/users/:id', adminUserController.getUser);
router.put('/users/:id', adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);
router.patch('/users/:id/status', adminUserController.toggleUserStatus);

// Course management routes
router.get('/courses', adminCourseController.getAllCourses);
router.post('/courses', adminCourseController.createCourse);
router.put('/courses/:id', adminCourseController.updateCourse);
router.delete('/courses/:id', adminCourseController.deleteCourse);
router.get('/courses/:id/analytics', adminCourseController.getCourseAnalytics);
router.patch('/courses/bulk', adminCourseController.bulkUpdateCourses);

// Order management routes
router.get('/orders', adminOrderController.getAllOrders);
router.get('/orders/analytics', adminOrderController.getOrderAnalytics); // Must be before /orders/:id
router.get('/orders/:id', adminOrderController.getOrder);
router.patch('/orders/:id/status', adminOrderController.updateOrderStatus);

// Admin Settings Routes
router.get('/settings/profile', adminSettingsController.getAdminProfile);
router.put('/settings/profile', adminSettingsController.updateAdminProfile);
router.post('/settings/password', adminSettingsController.changePassword);
router.get('/settings', adminSettingsController.getAdminSettings);
router.put('/settings', adminSettingsController.updateAdminSettings);
router.post('/settings/clear-cache', adminSettingsController.clearCache);
router.post('/settings/backup-database', adminSettingsController.backupDatabase);

module.exports = router;

