const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { isAuthenticated } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(isAuthenticated);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.delete('/:courseId', wishlistController.removeFromWishlist);

module.exports = router;


