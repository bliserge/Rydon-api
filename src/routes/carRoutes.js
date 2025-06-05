const router = require('express').Router();
const carController = require('../controllers/carController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all cars belonging to the logged-in user
router.get('/userCars', verifyToken, carController.getAllCars);

// Get detailed information about a single car
router.get('/carDetails/:id', verifyToken, carController.getCarById);

// Get all car listings with pagination, sorting and filtering
router.get('/listings', carController.getAllCarListings);

// Create a car listing with extended details
router.post('/listings', verifyToken, carController.createCarListing);

module.exports = router;
