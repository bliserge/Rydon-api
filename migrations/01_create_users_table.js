const db = require('../src/config/database');

async function up() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        countryCode VARCHAR(5),
        userType ENUM('Guest', 'Host', 'Admin') DEFAULT 'Guest',
        documentType VARCHAR(50),
        documentNumber VARCHAR(100),
        alt_email VARCHAR(100),
        alt_phone VARCHAR(20),
        emergency_name VARCHAR(100),
        emergency_phone VARCHAR(20),
        emergency_relationship VARCHAR(50),
        payment_card_number VARCHAR(255),
        payment_expiry_date VARCHAR(10),
        payment_cvv VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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