import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  getAnalytics,
  getDepartmentAnalytics,
  getLocationAnalytics,
  exportAnalytics
} from '../controllers/analytics.controller.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Analytics routes
router.get('/', getAnalytics);
router.get('/departments', getDepartmentAnalytics);
router.get('/locations', getLocationAnalytics);
router.get('/export', exportAnalytics);

export default router;
