const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const { 
        email, password, firstName, lastName, phone, countryCode, userType, 
        documentType, documentNumber, alternativeContact, emergencyContact 
      } = userData;
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Extract nested objects
      const alternativeEmail = alternativeContact?.email || null;
      const alternativePhone = alternativeContact?.phone || null;
      const emergencyContactName = emergencyContact?.name || null;
      const emergencyContactPhone = emergencyContact?.phone || null;
      const emergencyContactRelationship = emergencyContact?.relationship || null;
      
      // Set isHost based on userType
      const isHost = userType === 'Host';
      
      const [result] = await db.execute(
        `INSERT INTO users (
          email, password, firstName, lastName, phone, countryCode, userType, 
          documentType, documentNumber, alternativeEmail, alternativePhone, 
          emergencyContactName, emergencyContactPhone, emergencyContactRelationship, 
          isHost, isVerified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email, hashedPassword, firstName, lastName, phone, countryCode, userType,
          documentType, documentNumber, alternativeEmail, alternativePhone,
          emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
          isHost, false
        ]
      );
      
      // Return the created user
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async update(id, userData) {
    try {
      const { firstName, lastName, phone } = userData;
      
      // Build the update query dynamically based on provided fields
      let updateFields = [];
      let queryParams = [];
      
      if (firstName) {
        updateFields.push('firstName = ?');
        queryParams.push(firstName);
      }
      
      if (lastName) {
        updateFields.push('lastName = ?');
        queryParams.push(lastName);
      }
      
      if (phone) {
        updateFields.push('phone = ?');
        queryParams.push(phone);
      }
      
      // If no fields to update, return the current user
      if (updateFields.length === 0) {
        return this.findById(id);
      }
      
      // Add ID as the last parameter
      queryParams.push(id);
      
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      
      await db.execute(query, queryParams);
      
      // Return the updated user
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
