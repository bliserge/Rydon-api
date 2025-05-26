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
        pricePerDay FLOAT NOT NULL,
        location VARCHAR(255) NOT NULL,
        latitude FLOAT,
        longitude FLOAT,
        description TEXT NOT NULL,
        seats INT NOT NULL DEFAULT 5,
        doors INT NOT NULL DEFAULT 4,
        transmission VARCHAR(20) NOT NULL DEFAULT 'Automatic',
        fuelType VARCHAR(20) NOT NULL DEFAULT 'Gasoline',
        hostId INT NOT NULL,
        isAvailable BOOLEAN NOT NULL DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
