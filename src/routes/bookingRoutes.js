const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');

// All booking routes require authentication
router.use(verifyToken);

// Create a new booking
router.post('/', bookingController.createBooking);

// Get all bookings for the current user
router.get('/my-bookings', bookingController.getUserBookings);

// Get a specific booking by ID
router.get('/:id', bookingController.getBookingById);

// Update booking status
router.patch('/:id/status', bookingController.updateBookingStatus);

// Cancel a booking
router.delete('/:id', bookingController.cancelBooking);

module.exports = router;
