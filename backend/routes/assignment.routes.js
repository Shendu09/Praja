import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  assignComplaint,
  getAvailableOfficials,
  getAssignmentStats,
  bulkAssignComplaints
} from '../controllers/assignment.controller.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Assignment routes
router.post('/complaints/:id/assign', assignComplaint);
router.post('/complaints/bulk-assign', bulkAssignComplaints);
router.get('/officials', getAvailableOfficials);
router.get('/assignment-stats', getAssignmentStats);

export default router;
