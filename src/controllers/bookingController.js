const db = require('../config/database');
const AppError = require('../utils/appError');

/**
 * Create a new booking
 */
exports.createBooking = async (req, res, next) => {
  try {
    // Extract booking data from request body
    const {
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      insuranceOption,
      additionalDrivers,
      specialRequests,
      agreeToTerms,
      carId,
      totalCost,
      payment
    } = req.body;

    // Validate required fields
    if (!pickupDate || !pickupTime || !returnDate || !returnTime || !carId) {
      return next(new AppError('Missing required booking information', 400));
    }

    // Validate dates
    const pickupDateTime = new Date(pickupDate);
    const returnDateTime = new Date(returnDate);
    
    if (isNaN(pickupDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
      return next(new AppError('Invalid date format', 400));
    }

    if (pickupDateTime >= returnDateTime) {
      return next(new AppError('Return date must be after pickup date', 400));
    }

    if (!agreeToTerms) {
      return next(new AppError('You must agree to the terms and conditions', 400));
    }

    // Validate payment information
    const { cardNumber, cardName, expiryDate, cvv, saveCard } = payment;
    
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      return next(new AppError('Missing required payment information', 400));
    }

    // Validate card number (basic validation - remove spaces and check length)
    const cleanCardNumber = cardNumber.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(cleanCardNumber)) {
      return next(new AppError('Invalid card number', 400));
    }

    // Validate expiry date format (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return next(new AppError('Invalid expiry date format. Use MM/YY', 400));
    }

    // Validate CVV (3 or 4 digits)
    if (!/^\d{3,4}$/.test(cvv)) {
      return next(new AppError('Invalid CVV', 400));
    }

    // Get car information to verify it exists and get host ID
    const [carRows] = await db.execute(
      'SELECT id, hostId FROM cars WHERE id = ?',
      [carId]
    );

    if (carRows.length === 0) {
      return next(new AppError('Car not found', 404));
    }

    const hostId = carRows[0].hostId;
    const tenantId = req.user.id;

    // Check if tenant is trying to book their own car
    if (hostId === tenantId) {
      return next(new AppError('You cannot book your own car', 400));
    }

    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Create booking
      const [bookingResult] = await connection.execute(
        `INSERT INTO bookings 
        (pickupDate, pickupTime, returnDate, returnTime, totalPrice, insuranceOption, 
        additionalDrivers, specialRequests, agreeToTerms, carId, tenantId, hostId) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pickupDate,
          pickupTime,
          returnDate,
          returnTime,
          totalCost,
          insuranceOption || 'basic',
          additionalDrivers || 0,
          specialRequests || '',
          agreeToTerms,
          carId,
          tenantId,
          hostId
        ]
      );

      const bookingId = bookingResult.insertId;

      // Create payment record
      const [paymentResult] = await connection.execute(
        `INSERT INTO payments (amount, status, bookingId, paymentMethod, transactionId) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          totalCost,
          'PENDING', // Initial payment status
          bookingId,
          'CREDIT_CARD',
          `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}` // Generate a transaction ID
        ]
      );

      // If user wants to save the card, check if it already exists
      if (saveCard) {
        const lastFourDigits = cleanCardNumber.slice(-4);
        
        // Check if card already exists for this user
        const [existingCards] = await connection.execute(
          'SELECT id FROM user_cards WHERE userId = ? AND cardNumber = ?',
          [tenantId, cleanCardNumber]
        );

        // Only save if card doesn't exist
        if (existingCards.length === 0) {
          await connection.execute(
            `INSERT INTO user_cards (userId, cardNumber, cardName, expiryDate, lastFourDigits) 
            VALUES (?, ?, ?, ?, ?)`,
            [tenantId, cleanCardNumber, cardName, expiryDate, lastFourDigits]
          );
        }
      }

      // Commit the transaction
      await connection.commit();

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          bookingId,
          status: 'PENDING'
        }
      });
    } catch (error) {
      // If anything goes wrong, rollback the transaction
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Handle 401 status code according to memory
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        clearAuth: true // Signal to client to clear auth data
      });
    }
    
    next(new AppError(error.message || 'Failed to create booking', error.statusCode || 500));
  }
};

/**
 * Get all bookings for the current user
 */
exports.getUserBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get bookings where user is either tenant or host
    const [bookings] = await db.execute(
      `SELECT b.*, c.make, c.model, c.year, c.imageUrl 
       FROM bookings b
       JOIN cars c ON b.carId = c.id
       WHERE b.tenantId = ? OR b.hostId = ?
       ORDER BY b.createdAt DESC`,
      [userId, userId]
    );

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    
    // Handle 401 status code according to memory
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        clearAuth: true
      });
    }
    
    next(new AppError('Failed to fetch bookings', 500));
  }
};

/**
 * Get a specific booking by ID
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get booking details with car and user information
    const [bookings] = await db.execute(
      `SELECT b.*, 
       c.make, c.model, c.year, c.imageUrl,
       host.firstName as hostFirstName, host.lastName as hostLastName,
       tenant.firstName as tenantFirstName, tenant.lastName as tenantLastName
       FROM bookings b
       JOIN cars c ON b.carId = c.id
       JOIN users host ON b.hostId = host.id
       JOIN users tenant ON b.tenantId = tenant.id
       WHERE b.id = ? AND (b.tenantId = ? OR b.hostId = ?)`,
      [id, userId, userId]
    );

    if (bookings.length === 0) {
      return next(new AppError('Booking not found or you do not have permission to view it', 404));
    }

    // Get payment information
    const [payments] = await db.execute(
      'SELECT id, amount, status, paymentMethod, createdAt FROM payments WHERE bookingId = ?',
      [id]
    );

    const bookingData = {
      ...bookings[0],
      payment: payments[0] || null
    };

    res.status(200).json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    
    // Handle 401 status code according to memory
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        clearAuth: true
      });
    }
    
    next(new AppError('Failed to fetch booking details', 500));
  }
};

/**
 * Update booking status
 */
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    if (!status || !['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    // Check if booking exists and user has permission (must be host to update status)
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );

    if (bookings.length === 0) {
      return next(new AppError('Booking not found', 404));
    }

    const booking = bookings[0];
    
    // Only host can confirm/complete bookings, both host and tenant can cancel
    if (status !== 'CANCELLED' && booking.hostId !== userId) {
      return next(new AppError('Only the host can update this booking status', 403));
    }
    
    if (status === 'CANCELLED' && booking.tenantId !== userId && booking.hostId !== userId) {
      return next(new AppError('Only the host or tenant can cancel this booking', 403));
    }

    // Update booking status
    await db.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, id]
    );

    // If status is CONFIRMED, update payment status
    if (status === 'CONFIRMED') {
      await db.execute(
        'UPDATE payments SET status = "COMPLETED" WHERE bookingId = ?',
        [id]
      );
    }

    // If status is CANCELLED, update payment status to REFUNDED
    if (status === 'CANCELLED') {
      await db.execute(
        'UPDATE payments SET status = "REFUNDED" WHERE bookingId = ?',
        [id]
      );
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: {
        bookingId: id,
        status
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    
    // Handle 401 status code according to memory
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        clearAuth: true
      });
    }
    
    next(new AppError('Failed to update booking status', 500));
  }
};

/**
 * Cancel a booking
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if booking exists and user has permission
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE id = ? AND (tenantId = ? OR hostId = ?)',
      [id, userId, userId]
    );

    if (bookings.length === 0) {
      return next(new AppError('Booking not found or you do not have permission to cancel it', 404));
    }

    const booking = bookings[0];
    
    // Cannot cancel if already completed
    if (booking.status === 'COMPLETED') {
      return next(new AppError('Cannot cancel a completed booking', 400));
    }

    // Update booking status to CANCELLED
    await db.execute(
      'UPDATE bookings SET status = "CANCELLED" WHERE id = ?',
      [id]
    );

    // Update payment status to REFUNDED
    await db.execute(
      'UPDATE payments SET status = "REFUNDED" WHERE bookingId = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        bookingId: id,
        status: 'CANCELLED'
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    
    // Handle 401 status code according to memory
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        clearAuth: true
      });
    }
    
    next(new AppError('Failed to cancel booking', 500));
  }
};
