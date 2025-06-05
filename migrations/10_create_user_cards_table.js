const db = require('../src/config/database');

async function up() {
  try {
    // Create user_cards table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        cardNumber VARCHAR(255) NOT NULL,
        cardName VARCHAR(255) NOT NULL,
        expiryDate VARCHAR(10) NOT NULL,
        lastFourDigits VARCHAR(4) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        UNIQUE KEY (userId, cardNumber)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('User cards table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating user cards table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS user_cards');
    console.log('User cards table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping user cards table:', error);
    return false;
  }
}

module.exports = { up, down };
