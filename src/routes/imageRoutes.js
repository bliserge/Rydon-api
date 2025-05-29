const router = require('express').Router();
const imageController = require('../controllers/imageController');
const { verifyToken } = require('../middleware/authMiddleware');

// Simple test route (no authentication required)
router.get('/test', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Image routes are working correctly'
  });
});

// Upload multiple vehicle images (secured endpoint)
router.post('/vehicles', verifyToken, imageController.uploadVehicleImages);

module.exports = router;
