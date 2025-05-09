const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!rows[0]) return null;
      
      const user = rows[0];
      
      // Format the user data to match the expected structure
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
        phone: user.phone,
        countryCode: user.countryCode,
        userType: user.userType,
        documentType: user.documentType,
        documentNumber: user.documentNumber,
        alternativeContact: {
          email: user.alt_email,
          phone: user.alt_phone
        },
        emergencyContact: {
          name: user.emergency_name,
          phone: user.emergency_phone,
          relationship: user.emergency_relationship
        },
        paymentInfo: {
          cardNumber: user.payment_card_number,
          expiryDate: user.payment_expiry_date,
          cvv: user.payment_cvv
        },
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Extract nested objects
      const alternativeContact = userData.alternativeContact || {};
      const emergencyContact = userData.emergencyContact || {};
      const paymentInfo = userData.paymentInfo || {};
      
      const [result] = await db.execute(
        `INSERT INTO users (
          firstName, lastName, email, password, phone, countryCode, userType, 
          documentType, documentNumber, alt_email, alt_phone, 
          emergency_name, emergency_phone, emergency_relationship, 
          payment_card_number, payment_expiry_date, payment_cvv
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.firstName,
          userData.lastName,
          userData.email,
          hashedPassword,
          userData.phone || '',
          userData.countryCode || '',
          userData.userType || 'Guest',
          userData.documentType || '',
          userData.documentNumber || '',
          alternativeContact.email || '',
          alternativeContact.phone || '',
          emergencyContact.name || '',
          emergencyContact.phone || '',
          emergencyContact.relationship || '',
          paymentInfo.cardNumber || '',
          paymentInfo.expiryDate || '',
          paymentInfo.cvv || ''
        ]
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
