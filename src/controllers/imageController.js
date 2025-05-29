const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../assets/vehicles'));
  },
  filename: (req, file, cb) => {
    // Create a unique filename with original extension
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${fileExt}`);
  }
});

// File filter to validate images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
}).array('files', 10); // 'files' is the key name in form data, max 10 files

/**
 * Upload multiple vehicle images
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadVehicleImages = async (req, res) => {
  try {
    // Use multer upload as a promise
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            return reject({
              status: 400,
              message: `Upload error: ${err.message}`
            });
          }
          return reject({
            status: 500,
            message: `Server error during upload: ${err.message}`
          });
        }
        resolve();
      });
    });

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Get carId from request if provided
    const { carId } = req.body;
    
    // Generate base URL for images
    const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
    
    // Store results
    const imageResults = [];
    
    // Start a database transaction
    await db.execute('START TRANSACTION');
    
    // Process all uploaded files - no image processing, just save to database
    for (const file of req.files) {
      try {
        // Generate the URL for the image
        const imageUrl = `${baseUrl}/assets/vehicles/${file.filename}`;
        
        // Insert into database
        const [result] = await db.execute(
          'INSERT INTO car_images (url, carId, isPrimary) VALUES (?, ?, ?)',
          [imageUrl, carId || null, false]
        );
        
        // Add to results
        imageResults.push({
          id: result.insertId,
          url: imageUrl,
          carId: carId || null,
          isPrimary: false,
          filename: file.filename
        });
      } catch (dbError) {
        // Log database errors but continue with other files
        console.error(`Error saving file ${file.filename} to database:`, dbError);
      }
    }
    
    // Commit the transaction if we have any successful uploads
    if (imageResults.length > 0) {
      await db.execute('COMMIT');
      
      // Return success response with all saved images
      return res.status(201).json({
        success: true,
        data: imageResults,
        message: `${imageResults.length} image(s) uploaded successfully`
      });
    } else {
      // If no images were successfully saved, rollback and return error
      await db.execute('ROLLBACK');
      throw new Error('Failed to save any of the uploaded images');
    }
  } catch (error) {
    console.error('Error uploading vehicle images:', error);
    
    // Rollback any database changes
    try {
      await db.execute('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }

    // Return appropriate error response
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'An unexpected error occurred while uploading the images',
      error: error.message
    });
  }
};

module.exports = {
  uploadVehicleImages
};
