const db = require('../config/database');

// Get all cars belonging to the logged-in user
const getAllCars = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in.',
        clearAuth: true // Signal to client to clear auth data
      });
    }

    // Get all cars belonging to the logged-in user
    const [cars] = await db.execute(
      'SELECT id, title as name, description, price, address, city, isAvailable FROM cars WHERE hostId = ?',
      [req.user.id]
    );
    
    // Get car images for all cars
    const carIds = cars.map(car => car.id);
    let carImages = [];
    
    if (carIds.length > 0) {
      // Fetch primary images for all cars in one query
      // Create the correct number of placeholders for the IN clause
      const placeholders = carIds.map(() => '?').join(', ');
      
      const [images] = await db.execute(
        `SELECT carId, url, isPrimary FROM car_images 
         WHERE carId IN (${placeholders})
         ORDER BY isPrimary DESC, id ASC`,
        carIds
      );
      carImages = images;
    }
    
    // Create a map of carId to primary image URL
    const carImageMap = {};
    carIds.forEach(carId => {
      // Find images for this car
      const carImagesList = carImages.filter(img => img.carId === carId);
      
      // Find primary image first, or use the first image if no primary is marked
      const primaryImage = carImagesList.find(img => img.isPrimary) || carImagesList[0];
      
      // Store the image URL or a placeholder if no images found
      carImageMap[carId] = primaryImage ? primaryImage.url : `/car-${carId}.png`;
    });
    
    // Format the response according to the specified structure
    const formattedCars = cars.map(car => {
      // Determine status based on isAvailable
      let status = 'Maintenance';
      if (car.isAvailable) {
        status = 'Available';
      }
      
      return {
        id: car.id.toString(),
        name: car.name,
        description: car.description,
        image: carImageMap[car.id], // Use the primary image or first image
        status: status,
        price: parseFloat(car.price),
        location: `${car.city}, ${car.address}`,
        rating: 0, // Default rating as requested
        bookings: 0 // Default bookings as requested
      };
    });
    
    return res.status(200).json({
      success: true,
      data: formattedCars,
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
      whereClause += 'c.make = ?';
      params.push(make);
    }
    
    if (model) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'c.model = ?';
      params.push(model);
    }
    
    if (minPrice) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'c.price >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'c.price <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    if (location) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += '(c.city LIKE ? OR c.address LIKE ? OR c.country LIKE ?)';
      const searchLocation = `%${location}%`;
      params.push(searchLocation, searchLocation, searchLocation);
    }
    
    if (transmission) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'c.transmission = ?';
      params.push(transmission);
    }
    
    if (fuelType) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'c.fuelType = ?';
      params.push(fuelType);
    }
    
    if (seats) {
      whereClause += whereClause ? ' AND ' : ' WHERE ';
      whereClause += 'c.seats = ?';
      params.push(parseInt(seats));
    }
    
    // Add isAvailable filter by default
    whereClause += whereClause ? ' AND ' : ' WHERE ';
    whereClause += 'c.isAvailable = TRUE';
    
    // Build the ORDER BY clause for sorting
    let orderByClause = '';
    switch (sort) {
      case 'price-low':
        orderByClause = ' ORDER BY c.price ASC';
        break;
      case 'price-high':
        orderByClause = ' ORDER BY c.price DESC';
        break;
      case 'rating':
        orderByClause = ' ORDER BY avg_rating DESC';
        break;
      case 'newest':
      default:
        orderByClause = ' ORDER BY c.createdAt DESC';
    }
    
    // Build the LIMIT clause for pagination
    const limitClause = ' LIMIT ?, ?';
    params.push(offset, limitNum);
    
    try {
      // Get total count for pagination
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM cars c${whereClause}`,
        params.slice(0, params.length - 2) // Remove the offset and limit params
      );
      
      if (!countResult || !countResult[0]) {
        throw new Error('Failed to retrieve count of car listings');
      }
      
      const total = countResult[0].total;
      
      // Execute the main query with joins to get all required data
      const [carsData] = await db.execute(
        `SELECT 
          c.id, c.title, c.make, c.model, c.year, 
          c.price, CONCAT(c.city, ', ', c.country) as location, 
          c.seats, c.transmission, c.fuelType,
          u.id as hostId, CONCAT(u.firstName, ' ', LEFT(u.lastName, 1), '.') as hostName, 
          u.profileImage as hostImage,
          (SELECT COUNT(*) FROM reviews r WHERE r.carId = c.id) as reviewCount,
          IFNULL((SELECT AVG(r.rating) FROM reviews r WHERE r.carId = c.id), 0) as avg_rating
        FROM cars c
        LEFT JOIN users u ON c.hostId = u.id
        ${whereClause}
        ${orderByClause}
        ${limitClause}`,
        params
      );
      
      // Get features for all cars in the result
      const carIds = carsData.map(car => car.id);
      let features = [];
      let carImages = [];
      
      if (carIds.length > 0) {
        // Get features for all cars
        const [featuresData] = await db.execute(
          `SELECT carId, name FROM cars_features WHERE carId IN (${carIds.map(() => '?').join(',')})`,
          carIds
        );
        features = featuresData;
        
        // Get images for all cars
        const [imagesData] = await db.execute(
          `SELECT carId, url, type, isPrimary FROM car_images WHERE carId IN (${carIds.map(() => '?').join(',')})`,
          carIds
        );
        carImages = imagesData;
      }
      
      // Process the results into the desired format
      const processedCars = carsData.map(car => {
        // Get features for this car
        const carFeatures = features
          .filter(feature => feature.carId === car.id)
          .map(feature => feature.name);
        
        // Get primary image for this car
        const primaryImage = carImages.find(img => img.carId === car.id && img.isPrimary) || 
                            carImages.find(img => img.carId === car.id) || 
                            { url: "/placeholder.svg?height=300&width=500" };
        
        // Format the car data according to the requested structure
        return {
          id: car.id.toString(),
          name: `${car.make} ${car.model}`,
          image: primaryImage.url,
          price: car.price,
          location: car.location,
          rating: parseFloat(car.avg_rating) || 0,
          reviews: parseInt(car.reviewCount) || 0,
          year: car.year,
          seats: car.seats,
          transmission: car.transmission,
          fuelType: car.fuelType,
          features: carFeatures.length > 0 ? carFeatures : ["Air Conditioning", "Bluetooth", "Backup Camera"],
          host: {
            name: car.hostName,
            rating: 0, // Setting host rating to 0 as requested
            image: "" // Setting host image to empty string as requested
          }
        };
      });
      
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


// Create a car listing with extended details
const createCarListing = async (req, res) => {
  try {
    const {
      // Car details
      make, model, year, transmission, fuelType, seats, mileage, carCondition,
      
      // Car description
      title, description, features,
      
      // Location
      address, city = 'Kigali', country = 'Rwanda',
      
      // Photos
      exteriorPhotos, interiorPhotos,
      
      // Pricing
      price, cleaningFees, securityDeposit,
      
      // Rules
      instantBooking, pets, smoking, additionalRules
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
    if (!address) validationErrors.push('Address is required');
    
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
      // Insert the car record without features (they'll go in a separate table)
      const [carResult] = await db.execute(
        `INSERT INTO cars (
          title, make, model, year, mileage, carCondition,
          transmission, fuelType, seats, description,
          instantBooking, pets, smoking, additionalRules,
          address, city, country, price, cleaningFees, securityDeposit,
          hostId, isAvailable
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, make, model, parseInt(year), mileage || 0, carCondition || 'Good',
          transmission || 'Automatic', fuelType || 'Gasoline', seats || 5, description,
          Boolean(instantBooking), Boolean(pets), Boolean(smoking), additionalRules || null,
          address, city, country, parseFloat(price), parseFloat(cleaningFees || 0), parseFloat(securityDeposit || 0),
          hostId, true
        ]
      );

      if (!carResult || !carResult.insertId) {
        throw new Error('Failed to insert car listing into database');
      }

      const carId = carResult.insertId;
      
      // Insert features into the cars_features table
      if (features && Array.isArray(features) && features.length > 0) {
        for (const feature of features) {
          await db.execute(
            'INSERT INTO cars_features (name, carId, type) VALUES (?, ?, ?)',
            [feature, carId, 'general']
          );
        }
      }
      
      // Insert exterior photos
      if (exteriorPhotos && Array.isArray(exteriorPhotos) && exteriorPhotos.length > 0) {
        for (const photoUrl of exteriorPhotos) {
          await db.execute(
            'INSERT INTO car_images (url, carId, type, isPrimary) VALUES (?, ?, ?, ?)',
            [photoUrl, carId, 'exterior', exteriorPhotos.indexOf(photoUrl) === 0]
          );
        }
      }
      
      // Insert interior photos
      if (interiorPhotos && Array.isArray(interiorPhotos) && interiorPhotos.length > 0) {
        for (const photoUrl of interiorPhotos) {
          await db.execute(
            'INSERT INTO car_images (url, carId, type) VALUES (?, ?, ?)',
            [photoUrl, carId, 'interior']
          );
        }
      }
      
      // Commit the transaction
      await db.execute('COMMIT');
      
      // Fetch the features to include in the response
      const [featuresResult] = await db.execute(
        'SELECT id, name, type FROM cars_features WHERE carId = ?',
        [carId]
      );
      
      // Fetch the images to include in the response
      const [imagesResult] = await db.execute(
        'SELECT id, url, isPrimary, type FROM car_images WHERE carId = ?',
        [carId]
      );
      
      // Organize images by type
      const images = {
        exterior: imagesResult.filter(img => img.type === 'exterior').map(img => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary
        })),
        interior: imagesResult.filter(img => img.type === 'interior').map(img => ({
          id: img.id,
          url: img.url,
          isPrimary: false
        }))
      };

      return res.status(201).json({
        success: true,
        data: {
          id: carId,
          title,
          make,
          model,
          year: parseInt(year),
          price: parseFloat(price),
          address,
          city,
          country,
          features: featuresResult,
          images,
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
          message: 'A car with this information already exists',
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

// Get detailed information about a single car
const getCarById = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in.',
        clearAuth: true // Signal to client to clear auth data
      });
    }

    const carId = req.params.id;
    if (!carId) {
      return res.status(400).json({
        success: false,
        message: 'Car ID is required'
      });
    }

    // Get car details
    const [cars] = await db.execute(
      `SELECT c.id, c.title as name, c.description, c.make, c.model, c.year, 
              c.mileage, c.transmission, c.fuelType, c.seats, c.price, 
              c.address, c.city, c.country, c.isAvailable, 
              c.carCondition, c.instantBooking, c.pets, c.smoking, c.additionalRules, 
              c.cleaningFees, c.securityDeposit, c.hostId 
       FROM cars c 
       WHERE c.id = ?`,
      [carId]
    );

    if (cars.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Car not found or you do not have permission to view it'
      });
    }

    const car = cars[0];

    // Get car images
    const [images] = await db.execute(
      `SELECT id, url, isPrimary, type FROM car_images WHERE carId = ? ORDER BY isPrimary DESC, id ASC`,
      [carId]
    );

    // Get car features
    const [features] = await db.execute(
      `SELECT name, type FROM cars_features WHERE carId = ?`,
      [carId]
    );

    // Format images by type
    const mainImage = images.find(img => img.isPrimary) || images[0] || { url: `/car-${carId}.png` };
    const interiorImages = images.filter(img => img.type === 'interior').map(img => img.url);
    const exteriorImages = images.filter(img => img.type === 'exterior').map(img => img.url);

    // Format features as a simple array of names
    const featuresList = features.map(feature => feature.name);

    // Determine status based on isAvailable
    let status = 'Maintenance';
    if (car.isAvailable) {
      status = 'Available';
    }

    // Format the response according to the specified structure
    const formattedCar = {
      id: car.id.toString(),
      name: car.name,
      description: car.description,
      image: mainImage.url,
      images: {
        main: mainImage.url,
        interior: interiorImages.length > 0 ? interiorImages : ["/default-interior.png"],
        exterior: exteriorImages.length > 0 ? exteriorImages : ["/default-exterior.png"]
      },
      status: status,
      price: parseFloat(car.price),
      location: `${car.city}, ${car.country}`,
      rating: 4.5, // Default rating for now
      totalBookings: 0, // Default bookings for now
      year: car.year,
      make: car.make,
      model: car.model,
      licensePlate: 'Not available', // Not in database yet
      vin: 'Not available', // Not in database yet
      color: 'Not available', // Not in database yet
      seats: car.seats,
      transmission: car.transmission,
      fuelType: car.fuelType,
      mileage: car.mileage,
      features: featuresList.length > 0 ? featuresList : ["No features listed"]
    };

    return res.status(200).json({
      success: true,
      data: formattedCar,
      message: 'Car details retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting car details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAllCars,
  getAllCarListings,
  createCarListing,
  getCarById
};
