import Complaint from '../models/Complaint.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// @desc    Assign complaint to official/department
// @route   POST /api/admin/complaints/:id/assign
// @access  Private/Admin
export const assignComplaint = asyncHandler(async (req, res) => {
  const { officialId, department, note, priorityOverride } = req.body;

  // Verify admin role
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Validate official exists and has official role
  if (officialId) {
    const official = await User.findById(officialId);
    if (!official || official.role !== 'official') {
      res.status(400);
      throw new Error('Invalid official selected');
    }
  }

  // Update complaint assignment
  complaint.assignedTo = officialId || null;
  complaint.assignedDepartment = department;
  complaint.assignedAt = new Date();
  complaint.assignmentNote = note || '';
  complaint.status = 'Assigned';

  // Handle priority override
  if (priorityOverride) {
    complaint.priority = priorityOverride;
  }

  // Add to timeline
  complaint.timeline.push({
    status: 'Assigned',
    comment: `Assigned to ${department}${officialId ? ' - Official assigned' : ''}. ${note ? `Note: ${note}` : ''}`,
    updatedBy: req.user._id,
    updatedAt: new Date()
  });

  await complaint.save();

  // Create notification for assigned official
  if (officialId) {
    await Notification.create({
      user: officialId,
      type: 'new_assignment',
      title: 'New Complaint Assigned',
      message: `New complaint assigned: ${complaint.grv_id || complaint.complaintId} - ${complaint.categoryLabel}`,
      data: { complaintId: complaint._id }
    });
  }

  // Create notification for citizen
  await Notification.create({
    user: complaint.user,
    type: 'complaint_update',
    title: 'Complaint Assigned',
    message: `Your complaint ${complaint.grv_id || complaint.complaintId} has been assigned to ${department}`,
    data: { complaintId: complaint._id }
  });

  // Populate and return updated complaint
  const updatedComplaint = await Complaint.findById(complaint._id)
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name email department')
    .populate('timeline.updatedBy', 'name');

  res.json({
    success: true,
    message: 'Complaint assigned successfully',
    data: updatedComplaint
  });
});

// @desc    Get all available officials
// @route   GET /api/admin/officials
// @access  Private/Admin
export const getAvailableOfficials = asyncHandler(async (req, res) => {
  // Verify admin role
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { department } = req.query;

  // Build query for officials
  const query = { role: 'official', isActive: true };
  if (department) {
    query.department = department;
  }

  // Get all officials
  const officials = await User.find(query)
    .select('name email department avatar phone')
    .lean();

  // Get active complaints count for each official
  const officialsWithStats = await Promise.all(
    officials.map(async (official) => {
      const activeComplaints = await Complaint.countDocuments({
        assignedTo: official._id,
        status: { $nin: ['Resolved', 'Closed', 'Final Resolution'] }
      });

      const resolvedComplaints = await Complaint.countDocuments({
        assignedTo: official._id,
        status: { $in: ['Resolved', 'Closed', 'Final Resolution'] }
      });

      // Get average rating from resolved complaints
      const ratingsResult = await Complaint.aggregate([
        {
          $match: {
            assignedTo: official._id,
            feedbackRating: { $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$feedbackRating' }
          }
        }
      ]);

      const avgRating = ratingsResult.length > 0 ? ratingsResult[0].avgRating : null;

      return {
        ...official,
        activeComplaints,
        resolvedComplaints,
        avgRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null
      };
    })
  );

  res.json({
    success: true,
    count: officialsWithStats.length,
    data: officialsWithStats
  });
});

// @desc    Get assignment statistics
// @route   GET /api/admin/assignment-stats
// @access  Private/Admin
export const getAssignmentStats = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const [
    totalUnassigned,
    totalAssigned,
    byDepartment
  ] = await Promise.all([
    // Unassigned complaints
    Complaint.countDocuments({
      $or: [
        { assignedTo: null },
        { assignedDepartment: null }
      ],
      status: 'Submitted'
    }),
    // Assigned complaints
    Complaint.countDocuments({
      assignedTo: { $ne: null },
      status: { $in: ['Assigned', 'In Progress'] }
    }),
    // By department
    Complaint.aggregate([
      {
        $match: { assignedDepartment: { $ne: null } }
      },
      {
        $group: {
          _id: '$assignedDepartment',
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $in: ['$status', ['Assigned', 'In Progress']] }, 1, 0] }
          }
        }
      }
    ])
  ]);

  res.json({
    success: true,
    data: {
      totalUnassigned,
      totalAssigned,
      byDepartment
    }
  });
});

// @desc    Bulk assign complaints
// @route   POST /api/admin/complaints/bulk-assign
// @access  Private/Admin
export const bulkAssignComplaints = asyncHandler(async (req, res) => {
  const { complaintIds, officialId, department, note } = req.body;

  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
    res.status(400);
    throw new Error('Please provide complaint IDs');
  }

  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const id of complaintIds) {
    try {
      const complaint = await Complaint.findById(id);
      if (!complaint) {
        results.failed++;
        results.errors.push({ id, error: 'Complaint not found' });
        continue;
      }

      complaint.assignedTo = officialId || null;
      complaint.assignedDepartment = department;
      complaint.assignedAt = new Date();
      complaint.assignmentNote = note || '';
      complaint.status = 'Assigned';

      complaint.timeline.push({
        status: 'Assigned',
        comment: `Bulk assigned to ${department}`,
        updatedBy: req.user._id,
        updatedAt: new Date()
      });

      await complaint.save();

      // Notify citizen
      await Notification.create({
        user: complaint.user,
        type: 'complaint_update',
        title: 'Complaint Assigned',
        message: `Your complaint ${complaint.grv_id || complaint.complaintId} has been assigned to ${department}`,
        data: { complaintId: complaint._id }
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({ id, error: error.message });
    }
  }

  // Notify assigned official once for bulk
  if (officialId && results.successful > 0) {
    await Notification.create({
      user: officialId,
      type: 'new_assignment',
      title: 'Multiple Complaints Assigned',
      message: `${results.successful} new complaints have been assigned to you`,
      data: {}
    });
  }

  res.json({
    success: true,
    message: `${results.successful} complaints assigned successfully`,
    data: results
  });
});
