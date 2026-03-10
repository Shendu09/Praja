import express from 'express';
import { body, validationResult } from 'express-validator';
import { sendOTP, verifyOTP } from '../services/otp.service.js';
import User from '../models/User.model.js';

const router = express.Router();

// @route   POST /api/otp/send
// @desc    Send OTP to email or phone
// @access  Public
router.post('/send', [
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('type').isIn(['email', 'phone']).withMessage('Type must be email or phone'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { identifier, type } = req.body;

    // Auto-detect whether this is a login or registration flow
    const existingUser = await User.findOne(
      type === 'email' ? { email: identifier } : { phone: identifier }
    );
    const userExists = !!existingUser;

    const result = await sendOTP(identifier, type);

    const responsePayload = {
      success: true,
      message: `OTP sent to your ${type}`,
      userExists,
    };

    // In development, expose OTP so it can be shown on screen (no SMS credentials needed)
    if (process.env.NODE_ENV !== 'production' && result.otp) {
      responsePayload.devOtp = result.otp;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send OTP',
    });
  }
});

// @route   POST /api/otp/verify
// @desc    Verify OTP
// @access  Public
router.post('/verify', [
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { identifier, otp } = req.body;
    const result = verifyOTP(identifier, otp);

    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.message });
    }

    res.json({
      success: true,
      message: result.message,
      verified: true,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
    });
  }
});

// @route   POST /api/otp/resend
// @desc    Resend OTP
// @access  Public
router.post('/resend', [
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('type').isIn(['email', 'phone']).withMessage('Type must be email or phone'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { identifier, type } = req.body;
    const result = await sendOTP(identifier, type);

    const responsePayload = {
      success: true,
      message: `New OTP sent to your ${type}`,
    };
    if (process.env.NODE_ENV !== 'production' && result.otp) {
      responsePayload.devOtp = result.otp;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend OTP',
    });
  }
});

export default router;
