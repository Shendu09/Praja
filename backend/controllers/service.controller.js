import ServiceLocation from '../models/ServiceLocation.model.js';
import ServiceRating from '../models/ServiceRating.model.js';

// GET /api/services — get all service locations grouped by category
export const getAllServices = async (req, res) => {
  try {
    const services = await ServiceLocation.find({ isActive: true })
      .sort({ category: 1, name: 1 });
    
    // Group by category
    const grouped = services.reduce((acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    }, {});

    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/:serviceId — get single service by serviceId
// This is what the QR code URL hits when scanned
export const getServiceById = async (req, res) => {
  try {
    const service = await ServiceLocation.findOne({
      serviceId: req.params.serviceId,
      isActive: true
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service location not found'
      });
    }

    // Get recent ratings for this service
    const recentRatings = await ServiceRating.find({
      serviceLocation: service._id
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('overallRating feedback createdAt isAnonymous');

    res.json({
      success: true,
      data: {
        ...service.toObject(),
        recentRatings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/services/:serviceId/rate — submit rating (from QR scan)
export const submitRating = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const {
      overallRating,
      subRatings,
      feedback,
      scannedViaQR,
      isAnonymous
    } = req.body;

    // Find service
    const service = await ServiceLocation.findOne({ serviceId });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Get client IP address
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.ip || 
                     req.connection?.remoteAddress || 
                     'unknown';

    // Prevent duplicate rating from same IP in last 24 hours
    const existingRating = await ServiceRating.findOne({
      serviceLocation: service._id,
      ipAddress: clientIp,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this service in the last 24 hours'
      });
    }

    // Create rating
    const rating = await ServiceRating.create({
      serviceLocation: service._id,
      serviceId,
      citizen: req.user?._id || null,
      isAnonymous: isAnonymous || !req.user,
      overallRating,
      subRatings,
      feedback,
      scannedViaQR: scannedViaQR || false,
      deviceInfo: req.headers['user-agent'],
      ipAddress: clientIp
    });

    // Update service average rating
    const allRatings = await ServiceRating.find({
      serviceLocation: service._id
    });
    
    const avg = allRatings.reduce((sum, r) => sum + r.overallRating, 0) / allRatings.length;
    
    // Update sub-rating averages
    const subAvg = {
      cleanliness: 0, availability: 0, safety: 0, maintenance: 0
    };
    
    let subRatingCount = 0;
    allRatings.forEach(r => {
      if (r.subRatings) {
        subRatingCount++;
        Object.keys(subAvg).forEach(key => {
          if (r.subRatings[key]) subAvg[key] += r.subRatings[key];
        });
      }
    });
    
    if (subRatingCount > 0) {
      Object.keys(subAvg).forEach(key => {
        subAvg[key] = Math.round((subAvg[key] / subRatingCount) * 10) / 10;
      });
    }

    await ServiceLocation.findByIdAndUpdate(service._id, {
      totalRatings: allRatings.length,
      averageRating: Math.round(avg * 10) / 10,
      ratingBreakdown: subAvg
    });

    res.json({
      success: true,
      message: 'Rating submitted successfully! Thank you for your feedback.',
      data: rating,
      xpEarned: req.user ? 15 : 0   // XP only for logged-in users
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/services — create new service location (Admin only)
export const createService = async (req, res) => {
  try {
    const categoryPrefixes = {
      'Public Toilet': 'TOILET',
      'Water Supply': 'WATER',
      'Waste Collection': 'WASTE',
      'Public Transport': 'TRANS',
      'Park & Garden': 'PARK',
      'Street Light': 'LIGHT',
      'Govt Hospital': 'HOSP',
      'Govt Office': 'OFFICE'
    };

    // Generate serviceId
    const prefix = categoryPrefixes[req.body.category] || 'SVC';
    const count = await ServiceLocation.countDocuments({
      category: req.body.category
    });
    const serviceId = `SVC-${prefix}-${String(count + 1).padStart(3, '0')}`;

    const service = await ServiceLocation.create({
      ...req.body,
      serviceId
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/services/analytics/summary — Get rating analytics
export const getRatingAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // QR scan ratings today
    const qrRatingsToday = await ServiceRating.countDocuments({
      scannedViaQR: true,
      createdAt: { $gte: today }
    });

    // Total ratings today
    const totalRatingsToday = await ServiceRating.countDocuments({
      createdAt: { $gte: today }
    });

    // Average rating across all services
    const avgResult = await ServiceLocation.aggregate([
      { $match: { isActive: true, totalRatings: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$averageRating' } } }
    ]);

    // Category-wise ratings
    const categoryStats = await ServiceLocation.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          avgRating: { $avg: '$averageRating' },
          totalRatings: { $sum: '$totalRatings' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalRatings: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        qrRatingsToday,
        totalRatingsToday,
        overallAvgRating: avgResult[0]?.avgRating?.toFixed(1) || '0.0',
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
