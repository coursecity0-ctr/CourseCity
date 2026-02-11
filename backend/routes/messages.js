const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { isAdmin } = require('../middleware/auth');

// Public route for submitting messages
router.post('/contact', messageController.submitMessage);

// Admin only routes
router.get('/admin/messages', isAdmin, messageController.getAllMessages);
router.get('/admin/messages/:id', isAdmin, messageController.getMessage);
router.patch('/admin/messages/:id/status', isAdmin, messageController.updateMessageStatus);
router.delete('/admin/messages/:id', isAdmin, messageController.deleteMessage);

module.exports = router;
