import User from '../models/User.model.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, location } = req.body;

  // Check if user already exists
  const query = [];
  if (email) query.push({ email });
  if (phone) query.push({ phone });
  
  if (query.length > 0) {
    const userExists = await User.findOne({ $or: query });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email or phone');
    }
  }

  // Create user with role and location
  const user = await User.create({
    name,
    email: email || undefined,
    phone: phone || undefined,
    password,
    role: role || 'citizen',
    isVerified: true, // Since OTP was verified
    address: location ? {
      city: location.city,
      state: location.state,
      pincode: location.pincode,
      full: location.formatted || location.full,
    } : undefined,
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points,
        token: generateToken(user._id)
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and include password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    res.status(401);
    throw new Error('Account has been deactivated');
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      points: user.points,
      complaintsPosted: user.complaintsPosted,
      complaintsResolved: user.complaintsResolved,
      avatar: user.avatar,
      token: generateToken(user._id)
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      address: user.address,
      points: user.points,
      complaintsPosted: user.complaintsPosted,
      complaintsResolved: user.complaintsResolved,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        avatar: updatedUser.avatar
      }
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    OTP-based login (after OTP verification)
// @route   POST /api/auth/otp-login
// @access  Public
export const otpLogin = asyncHandler(async (req, res) => {
  const { identifier, type, role } = req.body;

  // Find user by email or phone
  const query = type === 'email' ? { email: identifier } : { phone: identifier };
  const user = await User.findOne(query);

  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  // Check if account is active
  if (!user.isActive) {
    res.status(401);
    throw new Error('Account has been deactivated');
  }

  // Verify role matches (optional - for security)
  if (role && user.role !== role && role !== 'citizen') {
    res.status(403);
    throw new Error(`You are not registered as ${role}. Your role is ${user.role}.`);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      points: user.points,
      complaintsPosted: user.complaintsPosted,
      complaintsResolved: user.complaintsResolved,
      avatar: user.avatar,
    },
    token: generateToken(user._id)
  });
});
