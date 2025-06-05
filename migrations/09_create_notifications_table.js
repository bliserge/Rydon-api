const db = require('../src/config/database');

async function up() {
  try {
    // Create notifications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        userId INT NOT NULL,
        isRead BOOLEAN NOT NULL DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Notifications table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating notifications table:', error);
    return false;
  }
}

async function down() {
  try {
    await db.execute('DROP TABLE IF EXISTS notifications');
    console.log('Notifications table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping notifications table:', error);
    return false;
  }
}

module.exports = { up, down };
