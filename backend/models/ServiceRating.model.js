import mongoose from 'mongoose';

const serviceRatingSchema = new mongoose.Schema({
  serviceLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceLocation',
    required: true
  },
  serviceId: String,       // e.g. SVC-TOILET-001 (for quick lookup)
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null           // null = anonymous rating (from QR scan)
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  subRatings: {
    cleanliness: { type: Number, min: 1, max: 5 },
    availability: { type: Number, min: 1, max: 5 },
    safety: { type: Number, min: 1, max: 5 },
    maintenance: { type: Number, min: 1, max: 5 }
  },
  feedback: {
    type: String,
    maxlength: 500
  },
  scannedViaQR: {
    type: Boolean,
    default: false           // true = came from QR code scan
  },
  deviceInfo: String,        // browser/device info for analytics
  ipAddress: String
}, { timestamps: true });

export default mongoose.model('ServiceRating', serviceRatingSchema);
