const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  // Create payload with all user information (excluding sensitive data)
  const payload = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    countryCode: user.countryCode,
    userType: user.userType,
    documentType: user.documentType,
    documentNumber: user.documentNumber,
    alternativeContact: {
      email: user.alternativeContact?.email || '',
      phone: user.alternativeContact?.phone || ''
    },
    emergencyContact: {
      name: user.emergencyContact?.name || '',
      phone: user.emergencyContact?.phone || '',
      relationship: user.emergencyContact?.relationship || ''
    }
    // Note: We're excluding payment info from the JWT for security reasons
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

module.exports = {
  generateToken
};