import express from 'express';
import {
  getAllServices,
  getServiceById,
  submitRating,
  createService,
  getRatingAnalytics
} from '../controllers/service.controller.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllServices);
router.get('/analytics/summary', getRatingAnalytics);
router.get('/:serviceId', getServiceById);

// Rating route - allows anonymous ratings (no auth required)
router.post('/:serviceId/rate', optionalAuth, submitRating);

// Admin only
router.post('/', protect, authorize('admin'), createService);

export default router;
