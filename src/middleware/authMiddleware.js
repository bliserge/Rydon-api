const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate and protect routes
 * Verifies the JWT token from the request header
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'Access denied. No token provided.',
      clearAuth: true // Signal to client to clear auth data
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token',
      clearAuth: true // Signal to client to clear auth data
    });
  }
};

module.exports = {
  verifyToken
};