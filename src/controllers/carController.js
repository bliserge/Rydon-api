const db = require('../config/database');

// Get all cars (basic)
const getAllCars = async (req, res) => {
  try {
    const [cars] = await db.execute('SELECT * FROM cars');
    
    return res.status(200).json({
      success: true,
      data: cars,
      message: 'Cars retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cars:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all car listings with pagination, sorting and filtering
const getAllCarListings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'newest', 
      make, 
      model, 
      minPrice, 
      maxPrice,
      location,
      transmission,
      fuelType,
      seats
    } = req.query;
    
    // Validate pagination parameters
    const validationErrors = [];
    
    // Validate page number
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      validationErrors.push('Page must be a positive integer');
    }
    
    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      validationErrors.push('Limit must be a positive integer between 1 and 100');
    }
    
    // Validate price ranges if provided
    if (minPrice !== undefined && (isNaN(parseFloat(minPrice)) || parseFloat(minPrice) < 0)) {
      validationErrors.push('Minimum price must be a non-negative number');
    }
    
    if (maxPrice !== undefined && (isNaN(parseFloat(maxPrice)) || parseFloat(maxPrice) < 0)) {
      validationErrors.push('Maximum price must be a non-negative number');
    }
    
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      validationErrors.push('Minimum price cannot be greater than maximum price');
    }
    
    // Validate seats if provided
    if (seats !== undefined && (isNaN(parseInt(seats)) || parseInt(seats) < 1)) {
      validationErrors.push('Seats must be a positive integer');
    }
    
    // Validate sort parameter
    const validSortOptions = ['newest', 'price-low', 'price-high', 'rating'];
    if (sort && !validSortOptions.includes(sort)) {
      validationErrors.push(`Sort must be one of: ${validSortOptions.join(', ')}`);
    }
    
    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
  
    // Calculate offset for pagination
    const offset = (pageNum - 1) * limitNum;
    
    // Build the WHERE clause for filtering
    let whereClause = '';
    const params = [];
    
    if (make) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'make = ?';
      params.push(make);
    }
    
    if (model) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'model = ?';
      params.push(model);
    }
    
    if (minPrice) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'pricePerDay >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'pricePerDay <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    if (location) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += '(location LIKE ? OR city LIKE ? OR address LIKE ?)';
      const searchLocation = `%${location}%`;
      params.push(searchLocation, searchLocation, searchLocation);
    }
    
    if (transmission) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'transmission = ?';
      params.push(transmission);
    }
    
    if (fuelType) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'fuelType = ?';
      params.push(fuelType);
    }
    
    if (seats) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'seats = ?';
      params.push(parseInt(seats));
    }
    
    // Add isAvailable filter by default
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'isAvailable = TRUE';
    
    // Build the ORDER BY clause for sorting
    let orderByClause = '';
    switch (sort) {
      case 'price-low':
        orderByClause = ' ORDER BY pricePerDay ASC';
        break;
      case 'price-high':
        orderByClause = ' ORDER BY pricePerDay DESC';
        break;
      case 'rating':
        orderByClause = ' ORDER BY rating DESC';
        break;
      case 'newest':
      default:
        orderByClause = ' ORDER BY createdAt DESC';
    }
    
    // Build the LIMIT clause for pagination
    const limitClause = ' LIMIT ?, ?';
    params.push(offset, limitNum);
    
    try {
      // Get total count for pagination
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM cars${whereClause}`,
        params.slice(0, params.length - 2) // Remove the offset and limit params
      );
      
      if (!countResult || !countResult[0]) {
        throw new Error('Failed to retrieve count of car listings');
      }
      
      const total = countResult[0].total;
      
      // Execute the main query
      const [cars] = await db.execute(
        `SELECT 
          id, title, make, model, year, 
          pricePerDay, location, description, 
          seats, transmission, fuelType, color, 
          mileage, condition, features, 
          exteriorPhotos, interiorPhotos, 
          discountWeekly, discountMonthly, 
          city, country, createdAt, updatedAt
        FROM cars${whereClause}${orderByClause}${limitClause}`,
        params
      );
      
      // Process the results with error handling for JSON parsing
      const processedCars = [];
      for (const car of cars) {
        try {
          // Create a new object to avoid modifying the original
          const processedCar = { ...car };
          
          // Parse JSON fields with error handling
          if (processedCar.features) {
            processedCar.features = JSON.parse(processedCar.features);
          }
          
          if (processedCar.exteriorPhotos) {
            processedCar.exteriorPhotos = JSON.parse(processedCar.exteriorPhotos);
          }
          
          if (processedCar.interiorPhotos) {
            processedCar.interiorPhotos = JSON.parse(processedCar.interiorPhotos);
          }
          
          processedCars.push(processedCar);
        } catch (jsonError) {
          console.error(`Error parsing JSON for car ID ${car.id}:`, jsonError);
          // Still include the car but with unparsed fields
          processedCars.push(car);
        }
      }
      
      return res.status(200).json({
        success: true,
        data: processedCars,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        message: 'Car listings retrieved successfully'
      });
    } catch (dbError) {
      console.error('Database error getting car listings:', dbError);
      
      // Check for specific database errors
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(400).json({
          success: false,
          message: 'Invalid field in query',
          error: dbError.message
        });
      }
      
      throw dbError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error getting car listings:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while retrieving car listings',
      error: error.message
    });
  }
};

// Create a new car
const createCar = async (req, res) => {
  try {
    const {
      title, make, model, year, pricePerDay, location,
      latitude, longitude, description, seats, doors,
      transmission, fuelType
    } = req.body;

    // Get user ID from the authenticated user
    const hostId = req.user.id;

    const [result] = await db.execute(
      `INSERT INTO cars (
        title, make, model, year, pricePerDay, location, 
        latitude, longitude, description, seats, doors, 
        transmission, fuelType, hostId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, make, model, parseInt(year), parseFloat(pricePerDay), location,
        latitude, longitude, description, parseInt(seats), parseInt(doors),
        transmission, fuelType, hostId
      ]
    );

    const carId = result.insertId;

    return res.status(201).json({
      success: true,
      data: {
        id: carId,
        title,
        make,
        model,
        year: parseInt(year),
        pricePerDay: parseFloat(pricePerDay),
        createdAt: new Date()
      },
      message: 'Car created successfully'
    });
  } catch (error) {
    console.error('Error creating car:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create a car listing with extended details
const createCarListing = async (req, res) => {
  try {
    const {
      // Car details
      make, model, year, color, licensePlate, vin, transmission,
      fuelType, seats, mileage, condition,
      
      // Car description
      title, description, features,
      
      // Location
      location, address, city = 'Kigali', country = 'Rwanda',
      
      // Photos
      exteriorPhotos, interiorPhotos,
      
      // Pricing
      price, discountWeekly, discountMonthly, cleaningFee, securityDeposit,
      
      // Availability
      availableAllYear, availableDates, advanceNotice,
      minRentalDuration, maxRentalDuration,
      
      // Rules
      instantBooking, allowPets, allowSmoking, additionalRules
    } = req.body;

    // Enhanced validation with specific error messages
    const validationErrors = [];
    
    // Required fields validation
    if (!make) validationErrors.push('Make is required');
    if (!model) validationErrors.push('Model is required');
    if (!year) validationErrors.push('Year is required');
    if (!title) validationErrors.push('Title is required');
    if (!description) validationErrors.push('Description is required');
    if (!price) validationErrors.push('Price is required');
    if (!location) validationErrors.push('Location is required');
    
    // Data type and range validation
    if (year && (isNaN(parseInt(year)) || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 1)) {
      validationErrors.push(`Year must be a valid number between 1900 and ${new Date().getFullYear() + 1}`);
    }
    
    if (price && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
      validationErrors.push('Price must be a positive number');
    }
    
    if (seats && (isNaN(parseInt(seats)) || parseInt(seats) <= 0)) {
      validationErrors.push('Seats must be a positive number');
    }
    
    if (mileage && (isNaN(parseInt(mileage)) || parseInt(mileage) < 0)) {
      validationErrors.push('Mileage must be a non-negative number');
    }
    
    // Return all validation errors at once
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user ID from the authenticated user
    const hostId = req.user.id;
    
    // Start a database transaction to ensure data consistency
    await db.execute('START TRANSACTION');
    
    try {
      // Convert arrays to JSON strings for storage (except features, which will go in a separate table)
      const exteriorPhotosJson = JSON.stringify(exteriorPhotos || []);
      const interiorPhotosJson = JSON.stringify(interiorPhotos || []);
      const availableDatesJson = JSON.stringify(availableDates || []);
      
      // Insert the car record without features (they'll go in a separate table)
      const [carResult] = await db.execute(
        `INSERT INTO cars (
          title, make, model, year, pricePerDay, location, 
          description, seats, transmission, fuelType, hostId,
          color, licensePlate, vin, mileage, condition,
          address, city, country, exteriorPhotos, interiorPhotos,
          discountWeekly, discountMonthly, cleaningFee, securityDeposit,
          availableAllYear, availableDates, advanceNotice, minRentalDuration,
          maxRentalDuration, instantBooking, allowPets, allowSmoking, additionalRules
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, make, model, parseInt(year), parseFloat(price), location,
          description, seats || null, transmission || null, fuelType || null, hostId,
          color || null, licensePlate || null, vin || null, mileage || null, condition || null,
          address || null, city, country, exteriorPhotosJson, interiorPhotosJson,
          parseFloat(discountWeekly || 0), parseFloat(discountMonthly || 0), 
          parseFloat(cleaningFee || 0), parseFloat(securityDeposit || 0),
          Boolean(availableAllYear), availableDatesJson, advanceNotice || '1', 
          minRentalDuration || '1', maxRentalDuration || '30',
          Boolean(instantBooking), Boolean(allowPets), Boolean(allowSmoking), additionalRules || null
        ]
      );

      if (!carResult || !carResult.insertId) {
        throw new Error('Failed to insert car listing into database');
      }

      const carId = carResult.insertId;
      
      // Insert features into the features table
      if (features && Array.isArray(features) && features.length > 0) {
        for (const feature of features) {
          await db.execute(
            'INSERT INTO features (name, carId) VALUES (?, ?)',
            [feature, carId]
          );
        }
      }
      
      // Update carId for exterior photos
      if (exteriorPhotos && Array.isArray(exteriorPhotos) && exteriorPhotos.length > 0) {
        for (const photoUrl of exteriorPhotos) {
          await db.execute(
            'UPDATE car_images SET carId = ? WHERE url = ?',
            [carId, photoUrl]
          );
        }
      }
      
      // Update carId for interior photos
      if (interiorPhotos && Array.isArray(interiorPhotos) && interiorPhotos.length > 0) {
        for (const photoUrl of interiorPhotos) {
          await db.execute(
            'UPDATE car_images SET carId = ? WHERE url = ?',
            [carId, photoUrl]
          );
        }
      }
      
      // Commit the transaction
      await db.execute('COMMIT');
      
      // Fetch the features to include in the response
      const [featuresResult] = await db.execute(
        'SELECT id, name FROM features WHERE carId = ?',
        [carId]
      );

      return res.status(201).json({
        success: true,
        data: {
          id: carId,
          title,
          make,
          model,
          year: parseInt(year),
          price: parseFloat(price),
          location,
          features: featuresResult,
          exteriorPhotos,
          interiorPhotos,
          createdAt: new Date()
        },
        message: 'Car listing created successfully'
      });
    } catch (dbError) {
      // Rollback the transaction in case of any error
      await db.execute('ROLLBACK');
      console.error('Database error creating car listing:', dbError);
      
      // Check for specific database errors
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'A car with this VIN or license plate already exists',
          error: dbError.message
        });
      }
      
      if (dbError.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference: The host ID may not exist',
          error: dbError.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Database error while creating car listing',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error creating car listing:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while creating the car listing',
      error: error.message
    });
  }
};

module.exports = {
  getAllCars,
  getAllCarListings,
  createCar,
  createCarListing
};
