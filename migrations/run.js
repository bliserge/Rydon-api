require('dotenv').config();
const path = require('path');
const fs = require('fs');

async function runMigrations() {
  try {
    // Get all migration files
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file !== 'run.js' && file.endsWith('.js'))
      .sort(); // Sort to run in order

    console.log('Running migrations...');

    for (const file of migrationFiles) {
      const migration = require(path.join(__dirname, file));
      const migrationName = file.split('.')[0];
      
      console.log(`Running migration: ${migrationName}`);
      
      const result = await migration.up();
      
      if (result) {
        console.log(`Migration ${migrationName} completed successfully`);
      } else {
        console.error(`Migration ${migrationName} failed`);
        process.exit(1);
      }
    }

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();