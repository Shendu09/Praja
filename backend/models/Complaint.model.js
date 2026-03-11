import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grv_id: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'dirty_spot',
      'garbage_dump',
      'garbage_vehicle',
      'burning_garbage',
      'sweeping_not_done',
      'dustbins_not_cleaned',
      'open_defecation',
      'sewerage_overflow',
      'stagnant_water',
      'slum_not_clean',
      'overgrown_vegetation',
      'stray_animals',
      'other'
    ]
  },
  categoryLabel: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  photo: {
    type: String,
    required: [true, 'Please upload a photo']
  },
  photoPublicId: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    pincode: String
  },
  status: {
    type: String,
    enum: ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Escalated', 'Final Resolution'],
    default: 'Submitted'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedDepartment: {
    type: String,
    enum: [
      'Public Works Department',
      'Water Supply Board', 
      'Electricity Department',
      'Sanitation Department',
      'Municipal Corporation',
      'Transport Department',
      'Health Department',
      'Revenue Department',
      null
    ],
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  assignmentNote: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    enum: ['sanitation', 'health', 'municipal', 'environment', 'roads', 'water', 'electricity', 'other'],
    default: 'sanitation'
  },
  timeline: [{
    status: String,
    comment: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    description: String,
    photo: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  feedbackRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedbackText: {
    type: String,
    default: ''
  },
  isSatisfied: {
    type: Boolean,
    default: null
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalationReason: {
    type: String,
    default: ''
  },
  escalatedAt: {
    type: Date,
    default: null
  },
  escalationStatus: {
    type: String,
    enum: ['Pending', 'Under Review', 'Final Resolution', null],
    default: null
  },
  escalationRemarks: {
    type: String,
    default: ''
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  complaintId: {
    type: String,
    unique: true
  },
  aiVerification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    detectedIssues: [String],
    aiNotes: String,
    verifiedAt: Date
  },
  governmentNotification: {
    isNotified: {
      type: Boolean,
      default: false
    },
    notifiedAt: Date,
    notifiedDepartment: String,
    notifiedOfficers: [{
      name: String,
      email: String,
      role: String
    }],
    escalationDeadline: Date
  }
}, {
  timestamps: true
});

// Generate unique complaint ID and GRV ID before save
complaintSchema.pre('save', async function(next) {
  if (!this.complaintId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Complaint').countDocuments() + 1;
    this.complaintId = `SWC${year}${month}${String(count).padStart(6, '0')}`;
  }
  if (!this.grv_id) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Complaint').countDocuments() + 1;
    this.grv_id = `GRV-${year}-${String(count).padStart(5, '0')}`;
  }
  next();
});

// Add to timeline when status changes
complaintSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      updatedAt: new Date()
    });
  }
  next();
});

// Geospatial index for location-based queries
complaintSchema.index({ 'location': '2dsphere' });

// Compound indexes for common queries
complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ 'location.city': 1, status: 1 });
complaintSchema.index({ complaintId: 1 });
complaintSchema.index({ grv_id: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ isEscalated: 1, escalationStatus: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
