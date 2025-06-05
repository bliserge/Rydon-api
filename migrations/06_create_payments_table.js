const db = require('../src/config/database');

async function up() {
  try {
    // Create payments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        amount FLOAT NOT NULL,
        status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
        bookingId INT NOT NULL,
        paymentMethod VARCHAR(50) NOT NULL,
        transactionId VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bookingId) REFERENCES bookings (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Payments table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating payments table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS payments');
    console.log('Payments table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping payments table:', error);
    return false;
  }
}

module.exports = { up, down };
