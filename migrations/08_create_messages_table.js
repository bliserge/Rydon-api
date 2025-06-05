const db = require('../src/config/database');

async function up() {
  try {
    // Create messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        senderId INT NOT NULL,
        recipientId INT NOT NULL,
        isRead BOOLEAN NOT NULL DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users (id),
        FOREIGN KEY (recipientId) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Messages table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating messages table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS messages');
    console.log('Messages table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping messages table:', error);
    return false;
  }
}

module.exports = { up, down };
