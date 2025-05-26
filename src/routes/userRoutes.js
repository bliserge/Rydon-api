const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get current user profile
router.get('/me', verifyToken, userController.getCurrentUser);

// Update current user profile
router.put('/me', verifyToken, userController.updateCurrentUser);

module.exports = router;
