const db = require('../src/config/database');

async function up() {
  try {
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255),
        firstName VARCHAR(50),
        lastName VARCHAR(50),
        phone VARCHAR(20),
        countryCode VARCHAR(5),
        userType ENUM('Guest', 'Host', 'Admin') DEFAULT 'Guest',
        documentType VARCHAR(50),
        documentNumber VARCHAR(100),
        alternativeEmail VARCHAR(100),
        alternativePhone VARCHAR(20),
        emergencyContactName VARCHAR(100),
        emergencyContactPhone VARCHAR(20),
        emergencyContactRelationship VARCHAR(50),
        profileImage VARCHAR(255),
        isHost BOOLEAN NOT NULL DEFAULT false,
        isVerified BOOLEAN NOT NULL DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Users table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating users table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS users');
    console.log('Users table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping users table:', error);
    return false;
  }
}

module.exports = { up, down };