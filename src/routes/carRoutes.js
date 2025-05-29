const router = require('express').Router();
const carController = require('../controllers/carController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all cars (basic)
router.get('/', carController.getAllCars);

// Get all car listings with pagination, sorting and filtering
router.get('/listings', carController.getAllCarListings);

// Create a new car (basic)
router.post('/', verifyToken, carController.createCar);

// Create a car listing with extended details
router.post('/listings', verifyToken, carController.createCarListing);

module.exports = router;
