const User = require('../models/userModel');

/**
 * Get current user profile
 * @route GET /api/users/me
 * @access Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImage: user.profileImage,
        isHost: user.isHost,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * @route PUT /api/users/me
 * @access Private
 */
exports.updateCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;
    
    // Validate input
    if (!firstName && !lastName && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update'
      });
    }
    
    // Update user
    const updatedUser = await User.update(userId, { firstName, lastName, phone });
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        isHost: updatedUser.isHost,
        isVerified: updatedUser.isVerified,
        updatedAt: updatedUser.updatedAt
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
