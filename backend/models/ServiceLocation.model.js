import mongoose from 'mongoose';

const serviceLocationSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    unique: true,
    required: true
    // Auto-generated format: SVC-TOILET-001, SVC-WATER-001
  },
  category: {
    type: String,
    enum: [
      'Public Toilet',
      'Water Supply',
      'Waste Collection',
      'Public Transport',
      'Park & Garden',
      'Street Light',
      'Govt Hospital',
      'Govt Office'
    ],
    required: true
  },
  name: {
    type: String,
    required: true
    // e.g. "Gandhi Park Public Toilet"
  },
  address: {
    type: String,
    required: true
  },
  ward: String,
  city: {
    type: String,
    default: 'Kadapa'
  },
  state: {
    type: String,
    default: 'Andhra Pradesh'
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  qrCodeUrl: String,       // stored QR image URL
  totalRatings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  ratingBreakdown: {
    cleanliness: { type: Number, default: 0 },
    availability: { type: Number, default: 0 },
    safety: { type: Number, default: 0 },
    maintenance: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('ServiceLocation', serviceLocationSchema);
