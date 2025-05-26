require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Function to run migrations
async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort(); // Sort to ensure migrations run in order

    console.log('Starting migrations...');

    for (const file of migrationFiles) {
      const migration = require(path.join(migrationsDir, file));
      const migrationName = file.replace('.js', '');
      
      console.log(`Running migration: ${migrationName}`);
      
      const result = await migration.up();
      
      if (result) {
        console.log(`Migration ${migrationName} completed successfully.`);
      } else {
        console.error(`Migration ${migrationName} failed.`);
        process.exit(1);
      }
    }

    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
