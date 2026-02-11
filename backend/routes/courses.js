const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourse);

// Protected routes (admin only)
router.post('/', isAdmin, courseController.createCourse);
router.put('/:id', isAdmin, courseController.updateCourse);
router.delete('/:id', isAdmin, courseController.deleteCourse);

module.exports = router;


