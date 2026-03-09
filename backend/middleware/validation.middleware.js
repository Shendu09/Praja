import { body, param, query, validationResult } from 'express-validator';

// Validation result handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validations
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid 10-digit Indian phone number'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  // Custom validation: at least email or phone required
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error('Either email or phone is required');
    }
    return true;
  }),
  validate
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

// Complaint validations
export const createComplaintValidation = [
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn([
      'dirty_spot', 'garbage_dump', 'garbage_vehicle', 'burning_garbage',
      'sweeping_not_done', 'dustbins_not_cleaned', 'open_defecation',
      'sewerage_overflow', 'stagnant_water', 'slum_not_clean',
      'overgrown_vegetation', 'stray_animals', 'other'
    ]).withMessage('Invalid category'),
  body('categoryLabel')
    .notEmpty().withMessage('Category label is required'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('location.address')
    .notEmpty().withMessage('Address is required'),
  validate
];

export const updateComplaintValidation = [
  param('id')
    .isMongoId().withMessage('Invalid complaint ID'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'rejected', 'closed'])
    .withMessage('Invalid status'),
  validate
];

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  validate
];

// ID param validation
export const idParamValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  validate
];
