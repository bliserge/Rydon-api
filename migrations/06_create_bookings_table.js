const db = require('../src/config/database');

async function up() {
  try {
    // Create bookings table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        startDate DATETIME NOT NULL,
        endDate DATETIME NOT NULL,
        totalPrice FLOAT NOT NULL,
        status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
        carId INT NOT NULL,
        tenantId INT NOT NULL,
        hostId INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (carId) REFERENCES cars (id),
        FOREIGN KEY (tenantId) REFERENCES users (id),
        FOREIGN KEY (hostId) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Bookings table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating bookings table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS bookings');
    console.log('Bookings table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping bookings table:', error);
    return false;
  }
}

module.exports = { up, down };
