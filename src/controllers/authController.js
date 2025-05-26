const User = require('../models/userModel');
const { generateToken } = require('../config/jwt');
const { registerValidation, loginValidation } = require('../utils/validation');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    // Validate the request data
    const { error } = registerValidation(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    // Extract all fields from request body
    const { 
      email, password, firstName, lastName, phone, countryCode, userType,
      documentType, documentNumber, alternativeContact, emergencyContact, paymentInfo 
    } = req.body;

    // Check if the user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Create a new user with all provided fields
    const user = await User.create({ 
      email, password, firstName, lastName, phone, countryCode, userType,
      documentType, documentNumber, alternativeContact, emergencyContact 
      // Note: We don't store payment info in the database for security reasons
    });

    // Generate JWT token for the newly registered user
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isHost: user.isHost,
          isVerified: user.isVerified
        },
        tokens: {
          accessToken: token,
          refreshToken: token, // In a real implementation, this would be a separate token
          expiresIn: parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '3600')
        }
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    // Validate the request data
    const { error } = loginValidation(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message 
      });
    }

    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Validate password
    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isHost: user.isHost,
          isVerified: user.isVerified
        },
        tokens: {
          accessToken: token,
          refreshToken: token, // In a real implementation, this would be a separate token
          expiresIn: parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '3600')
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};