import express from 'express';
import {
  getUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getLeaderboard,
  getUserStats
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { idParamValidation, paginationValidation } from '../middleware/validation.middleware.js';

const router = express.Router();

// Public routes
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.get('/stats', protect, getUserStats);
router.get('/notifications', protect, paginationValidation, getNotifications);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.put('/notifications/:id/read', protect, idParamValidation, markNotificationRead);

// Admin routes
router.get('/', protect, authorize('admin'), paginationValidation, getUsers);
router.get('/:id', protect, authorize('admin'), idParamValidation, getUserById);
router.put('/:id/role', protect, authorize('admin'), idParamValidation, updateUserRole);
router.put('/:id/deactivate', protect, authorize('admin'), idParamValidation, deactivateUser);

export default router;
