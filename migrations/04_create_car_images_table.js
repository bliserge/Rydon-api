const db = require('../src/config/database');

async function up() {
  try {
    // Create car images table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS car_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url VARCHAR(255) NOT NULL,
        carId INT,
        isPrimary BOOLEAN NOT NULL DEFAULT false,
        type VARCHAR(50) NOT NULL DEFAULT 'exterior' CHECK (type IN ('exterior', 'interior')),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (carId) REFERENCES cars (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Car images table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating car images table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS car_images');
    console.log('Car images table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping car images table:', error);
    return false;
  }
}

module.exports = { up, down };
