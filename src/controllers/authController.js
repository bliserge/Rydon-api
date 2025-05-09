const User = require('../models/userModel');
const { generateToken } = require('../config/jwt');
const { registerValidation, loginValidation } = require('../utils/validation');

exports.register = async (req, res, next) => {
  try {
    // Validate the request data
    const { error } = registerValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const userData = req.body;

    // Check if the user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Create a new user
    const userId = await User.create(userData);
    
    // Get the complete user data for the token
    const newUser = await User.findByEmail(userData.email);

    // Generate JWT token
    const token = generateToken(newUser);

    // Create a response object with user data (excluding sensitive information)
    const userResponse = {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      countryCode: newUser.countryCode,
      userType: newUser.userType,
      documentType: newUser.documentType,
      documentNumber: newUser.documentNumber,
      alternativeContact: newUser.alternativeContact,
      emergencyContact: newUser.emergencyContact
      // Payment info excluded for security
    };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Validate the request data
    const { error } = loginValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Validate password
    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

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

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};