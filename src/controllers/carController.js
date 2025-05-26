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
    
    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
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
      whereClause += 'price >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'price <= ?';
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
        orderByClause = ' ORDER BY price ASC';
        break;
      case 'price-high':
        orderByClause = ' ORDER BY price DESC';
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
    params.push(offset, parseInt(limit));
    
    // Get total count for pagination
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM cars${whereClause}`,
      params.slice(0, params.length - 2) // Remove the offset and limit params
    );
    const total = countResult[0].total;
    
    // Execute the main query
    const [cars] = await db.execute(
      `SELECT 
        id, title, make, model, year, 
        pricePerDay as price, location, description, 
        seats, transmission, fuelType, color, 
        mileage, condition, features, 
        exteriorPhotos, interiorPhotos, 
        discountWeekly, discountMonthly, 
        city, country, createdAt, updatedAt
      FROM cars${whereClause}${orderByClause}${limitClause}`,
      params
    );
    
    // Process the results
    const processedCars = cars.map(car => {
      // Parse JSON fields
      if (car.features) car.features = JSON.parse(car.features);
      if (car.exteriorPhotos) car.exteriorPhotos = JSON.parse(car.exteriorPhotos);
      if (car.interiorPhotos) car.interiorPhotos = JSON.parse(car.interiorPhotos);
      
      return car;
    });
    
    return res.status(200).json({
      success: true,
      data: processedCars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      message: 'Car listings retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting car listings:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
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

    // Validate required fields
    if (!make || !model || !year || !title || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: make, model, year, title, description, and price are required'
      });
    }

    // Get user ID from the authenticated user
    const hostId = req.user.id;
    
    // Convert arrays and objects to JSON strings for storage
    const featuresJson = JSON.stringify(features || []);
    const exteriorPhotosJson = JSON.stringify(exteriorPhotos || []);
    const interiorPhotosJson = JSON.stringify(interiorPhotos || []);
    const availableDatesJson = JSON.stringify(availableDates || []);

    const [result] = await db.execute(
      `INSERT INTO cars (
        title, make, model, year, pricePerDay, location, 
        description, seats, transmission, fuelType, hostId,
        color, licensePlate, vin, mileage, condition, features,
        address, city, country, exteriorPhotos, interiorPhotos,
        discountWeekly, discountMonthly, cleaningFee, securityDeposit,
        availableAllYear, availableDates, advanceNotice, minRentalDuration,
        maxRentalDuration, instantBooking, allowPets, allowSmoking, additionalRules
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, make, model, parseInt(year), parseFloat(price), location,
        description, seats, transmission, fuelType, hostId,
        color, licensePlate, vin, mileage, condition, featuresJson,
        address, city, country, exteriorPhotosJson, interiorPhotosJson,
        parseFloat(discountWeekly || 0), parseFloat(discountMonthly || 0), 
        parseFloat(cleaningFee || 0), parseFloat(securityDeposit || 0),
        Boolean(availableAllYear), availableDatesJson, advanceNotice || '1', 
        minRentalDuration || '1', maxRentalDuration || '30',
        Boolean(instantBooking), Boolean(allowPets), Boolean(allowSmoking), additionalRules
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
        year,
        price,
        location,
        features: features || [],
        createdAt: new Date()
      },
      message: 'Car listing created successfully'
    });
  } catch (error) {
    console.error('Error creating car listing:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
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
