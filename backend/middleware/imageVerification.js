import verifyImage from '../services/imageVerificationService.js';
import fs from 'fs';

/**
 * Express middleware to verify uploaded image
 * Runs AFTER multer has saved the file
 * 
 * Usage:
 * router.post('/complaints', 
 *   upload.single('image'),
 *   verifyUploadedImage,
 *   complaintController.createComplaint
 * );
 */
export const verifyUploadedImage = async (req, res, next) => {
  // If no file was uploaded, skip verification
  if (!req.file) {
    return next();
  }

  try {
    console.log(`[MIDDLEWARE] Verifying uploaded image: ${req.file.filename}`);

    // Run image verification
    const result = await verifyImage(req.file.path);

    // If verification failed, delete file and return error
    if (!result.verified) {
      console.warn(`[MIDDLEWARE] Image verification failed: ${result.code}`);
      
      // Delete the uploaded file
      try {
        fs.unlinkSync(req.file.path);
        console.log(`[MIDDLEWARE] Deleted rejected file: ${req.file.filename}`);
      } catch (err) {
        console.error(`[MIDDLEWARE] Error deleting file: ${err.message}`);
      }

      return res.status(400).json({
        success: false,
        error: result.message,
        code: result.code
      });
    }

    // Verification passed - attach metadata to request
    console.log(`[MIDDLEWARE] Image verified successfully`);
    req.imageMetadata = result.metadata;

    next();
  } catch (error) {
    console.error('[MIDDLEWARE] Unexpected error during image verification:', error.message);
    
    // Delete the file on error
    try {
      if (req.file) fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error(`[MIDDLEWARE] Error deleting file: ${err.message}`);
    }

    return res.status(500).json({
      success: false,
      error: 'Image verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
};

export default verifyUploadedImage;
