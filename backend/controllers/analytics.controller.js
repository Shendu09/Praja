import Complaint from '../models/Complaint.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// Category mapping for analytics
const categoryDisplayNames = {
  dirty_spot: 'Dirty Spot',
  garbage_dump: 'Garbage Dump',
  garbage_vehicle: 'Garbage Vehicle',
  burning_garbage: 'Burning Garbage',
  sweeping_not_done: 'Sweeping Issue',
  dustbins_not_cleaned: 'Dustbin Issue',
  open_defecation: 'Open Defecation',
  sewerage_overflow: 'Sewerage Overflow',
  stagnant_water: 'Stagnant Water',
  slum_not_clean: 'Slum Cleanliness',
  overgrown_vegetation: 'Overgrown Vegetation',
  stray_animals: 'Stray Animals',
  other: 'Other'
};

// @desc    Get comprehensive analytics dashboard data
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  // Get date range for trend (last 7 days)
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Run all aggregations in parallel
  const [
    totalComplaints,
    statusCounts,
    categoryCounts,
    severityCounts,
    citizenCount,
    officialCount,
    avgResolution,
    trendData,
    topOfficials,
    recentComplaints,
    escalatedCount
  ] = await Promise.all([
    // Total complaints
    Complaint.countDocuments(),
    
    // By status
    Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // By category
    Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed', 'Final Resolution']] }, 1, 0] }
          }
        }
      }
    ]),
    
    // By severity (from AI verification)
    Complaint.aggregate([
      {
        $match: { 'aiVerification.severity': { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$aiVerification.severity',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Total citizens
    User.countDocuments({ role: 'citizen' }),
    
    // Total officials
    User.countDocuments({ role: 'official' }),
    
    // Average resolution time
    Complaint.aggregate([
      {
        $match: {
          status: { $in: ['Resolved', 'Closed', 'Final Resolution'] },
          'resolution.resolvedAt': { $exists: true }
        }
      },
      {
        $project: {
          resolutionDays: {
            $divide: [
              { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$resolutionDays' }
        }
      }
    ]),
    
    // 7-day trend
    Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          complaints: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed', 'Final Resolution']] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Top officials by resolved complaints
    Complaint.aggregate([
      {
        $match: {
          assignedTo: { $ne: null },
          status: { $in: ['Resolved', 'Closed', 'Final Resolution'] }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          resolved: { $sum: 1 }
        }
      },
      { $sort: { resolved: -1 } },
      { $limit: 5 }
    ]),
    
    // Recent complaints for activity feed
    Complaint.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('grv_id complaintId status categoryLabel createdAt aiVerification.severity location.city')
      .lean(),
    
    // Escalated count
    Complaint.countDocuments({ isEscalated: true })
  ]);

  // Process status counts
  const statusMap = {
    'Submitted': 0,
    'Assigned': 0,
    'In Progress': 0,
    'Resolved': 0,
    'Closed': 0,
    'Escalated': 0
  };
  statusCounts.forEach(s => {
    if (statusMap.hasOwnProperty(s._id)) {
      statusMap[s._id] = s.count;
    }
  });
  
  const resolvedTotal = statusMap['Resolved'] + statusMap['Closed'];
  const pendingTotal = statusMap['Submitted'] + statusMap['Assigned'];
  const resolutionRate = totalComplaints > 0 
    ? Math.round((resolvedTotal / totalComplaints) * 100) 
    : 0;

  // Process category counts with display names
  const byCategory = categoryCounts.map(c => ({
    category: categoryDisplayNames[c._id] || c._id,
    count: c.count,
    resolved: c.resolved
  }));

  // Process status for chart
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count
  }));

  // Process severity - add critical from priority if missing
  const priorityCriticalCount = await Complaint.countDocuments({ priority: 'critical' });
  const severityMap = { low: 0, medium: 0, high: 0, critical: priorityCriticalCount };
  severityCounts.forEach(s => {
    if (severityMap.hasOwnProperty(s._id)) {
      severityMap[s._id] += s.count;
    }
  });
  
  const bySeverity = Object.entries(severityMap).map(([severity, count]) => ({
    severity: severity.charAt(0).toUpperCase() + severity.slice(1),
    count
  }));

  // Process trend data with day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayData = trendData.find(d => d._id === dateStr);
    trend.push({
      date: dayNames[date.getDay()],
      fullDate: dateStr,
      complaints: dayData?.complaints || 0,
      resolved: dayData?.resolved || 0
    });
  }

  // Get official details for top officials
  const officialIds = topOfficials.map(o => o._id);
  const officialUsers = await User.find({ _id: { $in: officialIds } })
    .select('name avatar')
    .lean();
  
  const officialMap = {};
  officialUsers.forEach(u => {
    officialMap[u._id.toString()] = u;
  });

  const topOfficialsWithDetails = await Promise.all(
    topOfficials.map(async (o) => {
      const official = officialMap[o._id.toString()] || { name: 'Unknown' };
      
      // Get pending count
      const pending = await Complaint.countDocuments({
        assignedTo: o._id,
        status: { $nin: ['Resolved', 'Closed', 'Final Resolution'] }
      });

      // Get average rating
      const ratingResult = await Complaint.aggregate([
        {
          $match: {
            assignedTo: o._id,
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

      const rating = ratingResult.length > 0 ? parseFloat(ratingResult[0].avgRating.toFixed(1)) : 4.0;

      return {
        name: official.name,
        avatar: official.avatar,
        resolved: o.resolved,
        pending,
        rating
      };
    })
  );

  // Process recent activity
  const recentActivity = recentComplaints.map(c => {
    const timeDiff = Date.now() - new Date(c.createdAt).getTime();
    const mins = Math.floor(timeDiff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    let timeAgo;
    if (days > 0) timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
    else if (hours > 0) timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    else timeAgo = `${mins} min${mins > 1 ? 's' : ''} ago`;

    let type = 'complaint_submitted';
    let message = `New complaint: ${c.categoryLabel}`;
    
    if (c.status === 'Resolved' || c.status === 'Closed') {
      type = 'complaint_resolved';
      message = `Complaint resolved: ${c.categoryLabel}`;
    } else if (c.status === 'In Progress' || c.status === 'Assigned') {
      type = 'status_updated';
      message = `Status updated: ${c.categoryLabel}`;
    }

    return {
      type,
      message,
      time: timeAgo,
      severity: c.aiVerification?.severity || 'medium',
      id: c.grv_id || c.complaintId,
      location: c.location?.city
    };
  });

  // Calculate today's stats
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  
  const [todayNew, todayResolved] = await Promise.all([
    Complaint.countDocuments({ createdAt: { $gte: todayStart } }),
    Complaint.countDocuments({ 
      'resolution.resolvedAt': { $gte: todayStart }
    })
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalComplaints,
        resolvedComplaints: resolvedTotal,
        pendingComplaints: pendingTotal,
        inProgressComplaints: statusMap['In Progress'],
        totalCitizens: citizenCount,
        totalOfficials: officialCount,
        avgResolutionDays: avgResolution.length > 0 ? parseFloat(avgResolution[0].avgDays.toFixed(1)) : 0,
        resolutionRate,
        escalatedCount,
        todayNew,
        todayResolved
      },
      byCategory,
      byStatus,
      bySeverity,
      trend,
      topOfficials: topOfficialsWithDetails,
      recentActivity
    }
  });
});

// @desc    Get department-wise analytics
// @route   GET /api/admin/analytics/departments
// @access  Private/Admin
export const getDepartmentAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const departmentStats = await Complaint.aggregate([
    {
      $match: { assignedDepartment: { $ne: null } }
    },
    {
      $group: {
        _id: '$assignedDepartment',
        total: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed', 'Final Resolution']] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0] }
        },
        assigned: {
          $sum: { $cond: [{ $eq: ['$status', 'Assigned'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
        }
      }
    },
    { $sort: { total: -1 } }
  ]);

  res.json({
    success: true,
    data: departmentStats
  });
});

// @desc    Get location-based analytics
// @route   GET /api/admin/analytics/locations
// @access  Private/Admin
export const getLocationAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const locationStats = await Complaint.aggregate([
    {
      $group: {
        _id: '$location.city',
        total: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed', 'Final Resolution']] }, 1, 0] }
        },
        categories: { $addToSet: '$category' }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 20 }
  ]);

  // Find hotspots - areas with recurring issues
  const hotspots = await Complaint.aggregate([
    {
      $group: {
        _id: {
          area: '$location.address',
          category: '$category'
        },
        count: { $sum: 1 },
        city: { $first: '$location.city' }
      }
    },
    { $match: { count: { $gte: 3 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    data: {
      byCity: locationStats,
      hotspots: hotspots.map(h => ({
        area: h._id.area,
        category: categoryDisplayNames[h._id.category] || h._id.category,
        count: h.count,
        city: h.city,
        isRecurring: h.count >= 5
      }))
    }
  });
});

// @desc    Export analytics data
// @route   GET /api/admin/analytics/export
// @access  Private/Admin
export const exportAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { startDate, endDate, format = 'json' } = req.query;

  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const complaints = await Complaint.find(query)
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name email department')
    .select('-__v')
    .lean();

  // Transform data for export
  const exportData = complaints.map(c => ({
    'Complaint ID': c.grv_id || c.complaintId,
    'Category': c.categoryLabel,
    'Description': c.description,
    'Status': c.status,
    'Priority': c.priority,
    'Department': c.assignedDepartment || c.department,
    'Location': c.location?.address,
    'City': c.location?.city,
    'Submitted By': c.user?.name,
    'Submitted At': c.createdAt,
    'Assigned To': c.assignedTo?.name,
    'Assigned At': c.assignedAt,
    'Resolved At': c.resolution?.resolvedAt,
    'Feedback Rating': c.feedbackRating,
    'Is Escalated': c.isEscalated
  }));

  res.json({
    success: true,
    count: exportData.length,
    data: exportData
  });
});
