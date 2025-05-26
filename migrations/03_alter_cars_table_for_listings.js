const db = require('../src/config/database');

async function up() {
  try {
    // Alter cars table to add new fields for car listings
    await db.execute(`
      ALTER TABLE cars
      ADD COLUMN color VARCHAR(50) DEFAULT NULL,
      ADD COLUMN licensePlate VARCHAR(20) DEFAULT NULL,
      ADD COLUMN vin VARCHAR(50) DEFAULT NULL,
      ADD COLUMN mileage INT DEFAULT NULL,
      ADD COLUMN condition VARCHAR(50) DEFAULT NULL,
      ADD COLUMN features JSON DEFAULT NULL,
      ADD COLUMN address VARCHAR(255) DEFAULT NULL,
      ADD COLUMN city VARCHAR(100) DEFAULT NULL,
      ADD COLUMN country VARCHAR(100) DEFAULT NULL,
      ADD COLUMN exteriorPhotos JSON DEFAULT NULL,
      ADD COLUMN interiorPhotos JSON DEFAULT NULL,
      ADD COLUMN discountWeekly FLOAT DEFAULT 0,
      ADD COLUMN discountMonthly FLOAT DEFAULT 0,
      ADD COLUMN cleaningFee FLOAT DEFAULT 0,
      ADD COLUMN securityDeposit FLOAT DEFAULT 0,
      ADD COLUMN availableAllYear BOOLEAN DEFAULT TRUE,
      ADD COLUMN availableDates JSON DEFAULT NULL,
      ADD COLUMN advanceNotice INT DEFAULT 1,
      ADD COLUMN minRentalDuration INT DEFAULT 1,
      ADD COLUMN maxRentalDuration INT DEFAULT 30,
      ADD COLUMN instantBooking BOOLEAN DEFAULT TRUE,
      ADD COLUMN allowPets BOOLEAN DEFAULT FALSE,
      ADD COLUMN allowSmoking BOOLEAN DEFAULT FALSE,
      ADD COLUMN additionalRules TEXT DEFAULT NULL;
    `);
    console.log('Cars table altered successfully for listings');
    return true;
  } catch (error) {
    console.error('Error altering cars table for listings:', error);
    return false;
  }
}

async function down() {
  try {
    // Remove the added columns
    await db.execute(`
      ALTER TABLE cars
      DROP COLUMN color,
      DROP COLUMN licensePlate,
      DROP COLUMN vin,
      DROP COLUMN mileage,
      DROP COLUMN condition,
      DROP COLUMN features,
      DROP COLUMN address,
      DROP COLUMN city,
      DROP COLUMN country,
      DROP COLUMN exteriorPhotos,
      DROP COLUMN interiorPhotos,
      DROP COLUMN discountWeekly,
      DROP COLUMN discountMonthly,
      DROP COLUMN cleaningFee,
      DROP COLUMN securityDeposit,
      DROP COLUMN availableAllYear,
      DROP COLUMN availableDates,
      DROP COLUMN advanceNotice,
      DROP COLUMN minRentalDuration,
      DROP COLUMN maxRentalDuration,
      DROP COLUMN instantBooking,
      DROP COLUMN allowPets,
      DROP COLUMN allowSmoking,
      DROP COLUMN additionalRules;
    `);
    console.log('Added columns removed from cars table');
    return true;
  } catch (error) {
    console.error('Error removing added columns from cars table:', error);
    return false;
  }
}

module.exports = { up, down };
