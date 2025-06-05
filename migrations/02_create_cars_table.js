const db = require('../src/config/database');

async function up() {
  try {
    // Create cars table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        make VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        year INT NOT NULL,
        mileage INT,
        carCondition VARCHAR(50) NOT NULL DEFAULT 'Good',
        transmission VARCHAR(20) NOT NULL DEFAULT 'Automatic',
        fuelType VARCHAR(20) NOT NULL DEFAULT 'Gasoline',
        seats INT NOT NULL DEFAULT 5,
        description TEXT NOT NULL,
        instantBooking BOOLEAN NOT NULL DEFAULT false,
        pets BOOLEAN NOT NULL DEFAULT false,
        smoking BOOLEAN NOT NULL DEFAULT false,
        additionalRules TEXT,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        price FLOAT NOT NULL,
        cleaningFees FLOAT DEFAULT 0,
        securityDeposit FLOAT DEFAULT 0,
        hostId INT NOT NULL,
        isAvailable BOOLEAN NOT NULL DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP NULL,
        FOREIGN KEY (hostId) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Cars table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating cars table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS cars');
    console.log('Cars table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping cars table:', error);
    return false;
  }
}

module.exports = { up, down };
