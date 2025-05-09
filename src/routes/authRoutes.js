const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/userModel');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route example
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create a response object with user data (excluding sensitive information)
    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      userType: user.userType,
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      alternativeContact: user.alternativeContact,
      emergencyContact: user.emergencyContact
      // Payment info excluded for security
    };
    
    res.json({ user: userResponse });
  } catch (error) {
    next(error);
  }
});

module.exports = router;