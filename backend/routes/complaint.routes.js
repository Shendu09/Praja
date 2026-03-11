import express from 'express';
import {
  createComplaint,
  getComplaints,
  getMyComplaints,
  getComplaint,
  updateComplaintStatus,
  addFeedback,
  upvoteComplaint,
  getNearbyComplaints,
  getComplaintStats,
  getCategories,
  escalateComplaint,
  resolveEscalation,
  checkDuplicate
} from '../controllers/complaint.controller.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import { upload, handleMulterError } from '../middleware/upload.middleware.js';
import {
  createComplaintValidation,
  updateComplaintValidation,
  paginationValidation,
  idParamValidation
} from '../middleware/validation.middleware.js';

const router = express.Router();

// Public routes
router.get('/', paginationValidation, getComplaints);
router.get('/categories', getCategories);
router.get('/stats', getComplaintStats);
router.get('/nearby', getNearbyComplaints);

// Duplicate check route (public, no auth needed for checking)
router.post('/check-duplicate', checkDuplicate);

// Protected routes
router.post(
  '/',
  protect,
  upload.single('photo'),
  handleMulterError,
  createComplaintValidation,
  createComplaint
);

router.get('/my', protect, paginationValidation, getMyComplaints);

// Single complaint routes
router.get('/:id', idParamValidation, optionalAuth, getComplaint);
router.post('/:id/upvote', protect, idParamValidation, upvoteComplaint);
router.post('/:id/feedback', protect, idParamValidation, addFeedback);
router.post('/:id/escalate', protect, idParamValidation, escalateComplaint);

// Admin routes
router.put(
  '/:id/status',
  protect,
  authorize('admin', 'moderator'),
  updateComplaintValidation,
  updateComplaintStatus
);

// Also allow PATCH for status updates
router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'moderator'),
  updateComplaintValidation,
  updateComplaintStatus
);

router.patch(
  '/:id/escalation-resolution',
  protect,
  authorize('admin'),
  resolveEscalation
);

export default router;
