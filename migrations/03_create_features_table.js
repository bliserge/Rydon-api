const db = require('../src/config/database');

async function up() {
  try {
    // Create features table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cars_features (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        carId INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (carId) REFERENCES cars (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Features table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating features table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS cars_features');
    console.log('Features table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping features table:', error);
    return false;
  }
}

module.exports = { up, down };
