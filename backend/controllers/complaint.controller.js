import Complaint from '../models/Complaint.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { analyzeImage } from '../services/ai.service.js';
import { notifyOfficials } from '../services/notification.service.js';

// Category mapping for labels
const categoryMap = {
  dirty_spot: { icon: '🗑️', label: 'Cleanliness Target Unit (Dirty Spot)' },
  garbage_dump: { icon: '🏔️', label: 'Garbage Dump' },
  garbage_vehicle: { icon: '🚛', label: 'Garbage Vehicle Not Arrived' },
  burning_garbage: { icon: '🔥', label: 'Burning of Garbage in Open Space' },
  sweeping_not_done: { icon: '🧹', label: 'Sweeping Not Done' },
  dustbins_not_cleaned: { icon: '🗑️', label: 'Dustbins Not Cleaned' },
  open_defecation: { icon: '🚽', label: 'Open Defecation' },
  sewerage_overflow: { icon: '💧', label: 'Overflow of Sewerage or Storm Water' },
  stagnant_water: { icon: '🌊', label: 'Stagnant Water on Road / Open Area' },
  slum_not_clean: { icon: '🏚️', label: 'Slum Area Not Clean' },
  overgrown_vegetation: { icon: '🌿', label: 'Overgrown Vegetation on Road' },
  stray_animals: { icon: '🐄', label: 'Stray Animals' },
  other: { icon: '📋', label: 'Other' }
};

// AI Category mapping for new system
const aiCategoryMap = {
  'Road & Infrastructure': 'other',
  'Water Supply': 'sewerage_overflow',
  'Electricity': 'other',
  'Waste Management': 'garbage_dump',
  'Public Safety': 'other',
  'Sanitation': 'dirty_spot',
  'Public Property': 'other',
  'Other': 'other'
};

// @desc    Check for duplicate/similar complaints
// @route   POST /api/complaints/check-duplicate
// @access  Public
export const checkDuplicate = asyncHandler(async (req, res) => {
  const { category, latitude, longitude, aiCategory } = req.body;

  // Validate required fields
  if (!latitude || !longitude) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  // Build query based on category type (legacy or new AI category)
  const categoryQuery = aiCategory 
    ? { categoryLabel: { $regex: aiCategory, $options: 'i' } }
    : category 
      ? { category: category }
      : {};

  try {
    // Find complaints within 500 meters using MongoDB geospatial query
    // that are NOT resolved/closed
    const nearby = await Complaint.find({
      ...categoryQuery,
      status: { $nin: ['Resolved', 'Closed', 'Final Resolution'] },
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: 500 // 500 meters
        }
      }
    })
    .limit(3)
    .select('grv_id complaintId title categoryLabel status createdAt location description')
    .sort({ createdAt: -1 })
    .lean();

    // Calculate distance for each complaint
    const complaintsWithDistance = nearby.map(complaint => {
      const [lng, lat] = complaint.location?.coordinates || [0, 0];
      const distance = calculateDistance(latitude, longitude, lat, lng);
      return {
        ...complaint,
        distance: Math.round(distance),
        distanceText: distance < 1000 ? `${Math.round(distance)}m away` : `${(distance / 1000).toFixed(1)}km away`,
        daysAgo: Math.floor((Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      };
    });

    res.json({
      success: true,
      hasDuplicate: nearby.length > 0,
      count: nearby.length,
      complaints: complaintsWithDistance,
      message: nearby.length > 0 
        ? `Found ${nearby.length} similar complaint(s) within 500m of this location` 
        : 'No similar complaints found nearby'
    });
  } catch (error) {
    // If geo query fails (no 2dsphere index), return empty result
    console.warn('Geo query failed, falling back to basic query:', error.message);
    res.json({
      success: true,
      hasDuplicate: false,
      count: 0,
      complaints: [],
      message: 'Duplicate check unavailable'
    });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
export const createComplaint = asyncHandler(async (req, res) => {
  const { category, description, location, isAnonymous } = req.body;

  // Get category info
  const categoryInfo = categoryMap[category] || categoryMap.other;

  // Handle photo - could be from file upload or base64
  let photoUrl = '';
  if (req.file) {
    photoUrl = `/uploads/complaints/${req.file.filename}`;
  } else if (req.body.photo) {
    photoUrl = req.body.photo; // Base64 or URL
  }

  if (!photoUrl) {
    res.status(400);
    throw new Error('Photo is required');
  }

  // AI Image Analysis - Verify the complaint
  console.log('\n🤖 Running AI Image Analysis...');
  const aiAnalysis = await analyzeImage(photoUrl, category, description);
  console.log(`✅ AI Analysis Complete - Confidence: ${(aiAnalysis.confidence * 100).toFixed(0)}%`);
  console.log(`   Priority: ${aiAnalysis.priority}, Severity: ${aiAnalysis.severity}`);
  console.log(`   Department: ${aiAnalysis.department}`);

  const complaint = await Complaint.create({
    user: req.user._id,
    category,
    categoryLabel: categoryInfo.label,
    description,
    photo: photoUrl,
    location: {
      type: 'Point',
      coordinates: location.coordinates,
      address: location.address,
      city: location.city || '',
      state: location.state || '',
      pincode: location.pincode || ''
    },
    isAnonymous: isAnonymous || false,
    priority: aiAnalysis.priority,
    department: aiAnalysis.department,
    aiVerification: {
      isVerified: aiAnalysis.isValid,
      confidence: aiAnalysis.confidence,
      severity: aiAnalysis.severity,
      detectedIssues: aiAnalysis.detectedIssues,
      aiNotes: aiAnalysis.aiNotes,
      verifiedAt: aiAnalysis.verifiedAt
    },
    timeline: [{
      status: 'pending',
      comment: `Complaint submitted. AI Verified with ${(aiAnalysis.confidence * 100).toFixed(0)}% confidence. Priority: ${aiAnalysis.priority.toUpperCase()}`,
      updatedAt: new Date()
    }]
  });

  // Notify Government Officials
  console.log('\n📨 Notifying Government Officials...');
  const govNotification = await notifyOfficials(complaint, aiAnalysis);

  // Create DB notifications for all active official-role users
  try {
    const officials = await User.find({ role: 'official', isActive: true }).select('_id').lean();
    if (officials.length > 0) {
      await Notification.insertMany(officials.map(official => ({
        user: official._id,
        type: 'new_complaint',
        title: '🆕 New Complaint',
        message: `${complaint.complaintId} — ${categoryInfo.label} at ${complaint.location?.city || 'your area'}. Priority: ${aiAnalysis.priority.toUpperCase()}`,
        data: { complaintId: complaint._id },
        isRead: false,
      })));
    }
  } catch (e) {
    console.error('Failed to create official notifications:', e.message);
  }

  // Update user stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { complaintsPosted: 1, points: 10 }
  });

  // Create user notification
  await Notification.create({
    user: req.user._id,
    type: 'complaint_update',
    title: 'Complaint Submitted & Verified',
    message: `Your complaint ${complaint.complaintId} has been verified by AI (${(aiAnalysis.confidence * 100).toFixed(0)}% confidence) and forwarded to ${aiAnalysis.department} department.`,
    data: { complaintId: complaint._id }
  });

  res.status(201).json({
    success: true,
    data: complaint,
    aiAnalysis: {
      confidence: aiAnalysis.confidence,
      severity: aiAnalysis.severity,
      priority: aiAnalysis.priority,
      department: aiAnalysis.department,
      detectedIssues: aiAnalysis.detectedIssues,
      notes: aiAnalysis.aiNotes
    },
    governmentNotified: true,
    notifiedDepartment: aiAnalysis.department
  });
});

// @desc    Get all complaints (with filters)
// @route   GET /api/complaints
// @access  Public
export const getComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    city,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (city) query['location.city'] = new RegExp(city, 'i');

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('user', 'name avatar')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Complaint.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: complaints,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get user's complaints
// @route   GET /api/complaints/my
// @access  Private
export const getMyComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { user: req.user._id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Complaint.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: complaints,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Public
export const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name avatar')
    .populate('timeline.updatedBy', 'name')
    .populate('resolution.resolvedBy', 'name');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Increment views
  complaint.views += 1;
  await complaint.save();

  res.json({
    success: true,
    data: complaint
  });
});

// @desc    Update complaint status (Admin)
// @route   PUT /api/complaints/:id/status
// @access  Private/Admin
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, comment, priority, assignedTo } = req.body;

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const oldStatus = complaint.status;
  
  // Update fields
  if (status) complaint.status = status;
  if (priority) complaint.priority = priority;
  if (assignedTo) complaint.assignedTo = assignedTo;

  // Add to timeline
  complaint.timeline.push({
    status: status || complaint.status,
    comment: comment || `Status updated to ${status}`,
    updatedBy: req.user._id,
    updatedAt: new Date()
  });

  // Handle resolution
  if (status === 'resolved') {
    complaint.resolution = {
      ...complaint.resolution,
      resolvedAt: new Date(),
      resolvedBy: req.user._id,
      description: comment || 'Issue resolved'
    };

    // Update user stats and points
    await User.findByIdAndUpdate(complaint.user, {
      $inc: { complaintsResolved: 1, points: 20 }
    });
  }

  await complaint.save();

  // Create notification for user
  await Notification.create({
    user: complaint.user,
    type: status === 'resolved' ? 'complaint_resolved' : 'complaint_update',
    title: status === 'resolved' ? 'Complaint Resolved!' : 'Complaint Update',
    message: `Your complaint ${complaint.complaintId} has been ${status === 'resolved' ? 'resolved' : 'updated to ' + status}.`,
    data: { complaintId: complaint._id }
  });

  res.json({
    success: true,
    data: complaint
  });
});

// @desc    Add feedback to resolved complaint
// @route   POST /api/complaints/:id/feedback
// @access  Private
export const addFeedback = asyncHandler(async (req, res) => {
  const { rating, comment, feedbackText, isSatisfied } = req.body;

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Check if user owns the complaint
  if (complaint.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to provide feedback');
  }

  // Check if complaint is resolved
  if (complaint.status !== 'Resolved' && complaint.status !== 'resolved') {
    res.status(400);
    throw new Error('Can only provide feedback for resolved complaints');
  }

  // Check if feedback already submitted
  if (complaint.feedbackRating !== null) {
    res.status(400);
    throw new Error('Feedback already submitted for this complaint');
  }

  // Update feedback fields - support both old and new format
  complaint.feedbackRating = rating;
  complaint.feedbackText = feedbackText || comment || '';
  complaint.isSatisfied = isSatisfied;
  
  // Also update the legacy feedback object
  complaint.feedback = {
    rating,
    comment: feedbackText || comment,
    submittedAt: new Date()
  };

  // Add to timeline
  complaint.timeline.push({
    status: complaint.status,
    comment: `Citizen feedback: ${rating} stars - ${isSatisfied ? 'Satisfied' : 'Not Satisfied'}`,
    updatedAt: new Date()
  });

  // If satisfied, close the complaint
  if (isSatisfied === true) {
    complaint.status = 'Closed';
    complaint.timeline.push({
      status: 'Closed',
      comment: 'Complaint closed - Citizen satisfied with resolution',
      updatedAt: new Date()
    });
  }

  // Award points for feedback
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { points: 10 }
  });

  await complaint.save();

  // Create notification for feedback submission
  await Notification.create({
    user: req.user._id,
    type: 'points_earned',
    title: 'Feedback Submitted',
    message: `Thank you for your feedback! You earned 10 points.`,
    data: { complaintId: complaint._id }
  });

  res.json({
    success: true,
    message: isSatisfied ? 'Complaint closed successfully' : 'Feedback submitted. You can escalate if not satisfied.',
    data: complaint
  });
});

// @desc    Escalate complaint to higher authority
// @route   POST /api/complaints/:id/escalate
// @access  Private
export const escalateComplaint = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    res.status(400);
    throw new Error('Please provide a detailed reason for escalation (minimum 10 characters)');
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Check if user owns the complaint
  if (complaint.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to escalate this complaint');
  }

  // Check if feedback was submitted and user was not satisfied
  if (complaint.isSatisfied === null) {
    res.status(400);
    throw new Error('Please submit feedback before escalating');
  }

  if (complaint.isSatisfied === true) {
    res.status(400);
    throw new Error('Cannot escalate - you marked the complaint as resolved to satisfaction');
  }

  // Check if already escalated
  if (complaint.isEscalated) {
    res.status(400);
    throw new Error('Complaint has already been escalated');
  }

  // Generate escalation reference
  const year = new Date().getFullYear();
  const escCount = await Complaint.countDocuments({ isEscalated: true }) + 1;
  const escalationRef = `ESC-${year}-${String(escCount).padStart(5, '0')}`;

  // Update complaint with escalation details
  complaint.isEscalated = true;
  complaint.escalatedAt = new Date();
  complaint.escalationReason = reason;
  complaint.escalationStatus = 'Pending';
  complaint.status = 'Escalated';

  // Add to timeline
  complaint.timeline.push({
    status: 'Escalated',
    comment: `Escalated to Nodal Appellate Authority. Reason: ${reason}`,
    updatedBy: req.user._id,
    updatedAt: new Date()
  });

  await complaint.save();

  // Create notification for admin about escalation
  const admins = await User.find({ role: 'admin' }).select('_id');
  for (const admin of admins) {
    await Notification.create({
      user: admin._id,
      type: 'system',
      title: '🚨 Complaint Escalated',
      message: `Complaint ${complaint.grv_id || complaint.complaintId} has been escalated by citizen. Needs immediate review.`,
      data: { complaintId: complaint._id }
    });
  }

  // Create notification for citizen
  await Notification.create({
    user: req.user._id,
    type: 'complaint_update',
    title: 'Escalation Received',
    message: `Your complaint has been escalated to higher authority. Reference: ${escalationRef}`,
    data: { complaintId: complaint._id }
  });

  res.json({
    success: true,
    message: 'Complaint escalated successfully',
    data: {
      complaint,
      escalationRef
    }
  });
});

// @desc    Resolve escalation (Admin only)
// @route   PATCH /api/complaints/:id/escalation-resolution
// @access  Private/Admin
export const resolveEscalation = asyncHandler(async (req, res) => {
  const { remarks, escalationStatus } = req.body;

  // Verify admin role
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  if (!remarks || remarks.trim().length < 10) {
    res.status(400);
    throw new Error('Please provide detailed resolution remarks');
  }

  if (!['Under Review', 'Final Resolution'].includes(escalationStatus)) {
    res.status(400);
    throw new Error('Invalid escalation status');
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (!complaint.isEscalated) {
    res.status(400);
    throw new Error('This complaint has not been escalated');
  }

  // Update escalation fields
  complaint.escalationRemarks = remarks;
  complaint.escalationStatus = escalationStatus;

  if (escalationStatus === 'Final Resolution') {
    complaint.status = 'Final Resolution';
  }

  // Add to timeline
  complaint.timeline.push({
    status: escalationStatus,
    comment: `Escalation ${escalationStatus}: ${remarks}`,
    updatedBy: req.user._id,
    updatedAt: new Date()
  });

  await complaint.save();

  // Notify citizen
  await Notification.create({
    user: complaint.user,
    type: 'complaint_update',
    title: escalationStatus === 'Final Resolution' ? 'Final Resolution Provided' : 'Escalation Update',
    message: `${escalationStatus === 'Final Resolution' ? 'Final resolution' : 'Update'} on your escalated complaint: ${remarks.substring(0, 100)}...`,
    data: { complaintId: complaint._id }
  });

  const updatedComplaint = await Complaint.findById(complaint._id)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email');

  res.json({
    success: true,
    message: 'Escalation updated successfully',
    data: updatedComplaint
  });
});

// @desc    Upvote complaint
// @route   POST /api/complaints/:id/upvote
// @access  Private
export const upvoteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  const userId = req.user._id.toString();
  const hasUpvoted = complaint.upvotes.map(id => id.toString()).includes(userId);

  if (hasUpvoted) {
    // Remove upvote
    complaint.upvotes = complaint.upvotes.filter(id => id.toString() !== userId);
  } else {
    // Add upvote
    complaint.upvotes.push(req.user._id);
  }

  await complaint.save();

  res.json({
    success: true,
    data: {
      upvotes: complaint.upvotes.length,
      hasUpvoted: !hasUpvoted
    }
  });
});

// @desc    Get nearby complaints
// @route   GET /api/complaints/nearby
// @access  Public
export const getNearbyComplaints = asyncHandler(async (req, res) => {
  const { longitude, latitude, radius = 5000 } = req.query; // radius in meters

  if (!longitude || !latitude) {
    res.status(400);
    throw new Error('Longitude and latitude are required');
  }

  const complaints = await Complaint.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseInt(radius)
      }
    },
    status: { $ne: 'closed' }
  })
    .limit(50)
    .lean();

  res.json({
    success: true,
    data: complaints
  });
});

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Public
export const getComplaintStats = asyncHandler(async (req, res) => {
  const [statusStats, categoryStats, totalComplaints, resolvedToday] = await Promise.all([
    Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    Complaint.countDocuments(),
    Complaint.countDocuments({
      status: 'resolved',
      'resolution.resolvedAt': {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      total: totalComplaints,
      resolvedToday,
      byStatus: statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topCategories: categoryStats.map(item => ({
        category: item._id,
        label: categoryMap[item._id]?.label || item._id,
        count: item.count
      }))
    }
  });
});

// @desc    Get categories list
// @route   GET /api/complaints/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const categories = Object.entries(categoryMap).map(([key, value]) => ({
    id: key,
    ...value
  }));

  res.json({
    success: true,
    data: categories
  });
});
