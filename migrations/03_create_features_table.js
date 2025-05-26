const db = require('../src/config/database');

async function up() {
  try {
    // Create features table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS features (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        carId INT NOT NULL,
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
    await db.execute('DROP TABLE IF EXISTS features');
    console.log('Features table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping features table:', error);
    return false;
  }
}

module.exports = { up, down };
