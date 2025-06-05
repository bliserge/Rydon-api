const db = require('../src/config/database');

async function up() {
  try {
    // Create reviews table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rating INT NOT NULL,
        comment TEXT,
        reviewerId INT NOT NULL,
        revieweeId INT,
        carId INT,
        bookingId INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reviewerId) REFERENCES users (id),
        FOREIGN KEY (revieweeId) REFERENCES users (id),
        FOREIGN KEY (carId) REFERENCES cars (id),
        FOREIGN KEY (bookingId) REFERENCES bookings (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Reviews table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating reviews table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS reviews');
    console.log('Reviews table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping reviews table:', error);
    return false;
  }
}

module.exports = { up, down };
