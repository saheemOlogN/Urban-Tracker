const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['road', 'garbage', 'water', 'sanitation'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      area: {
        type: String,
        enum: [
          'Rajiwada',
          'Mirjole',
          'Kothawade',
          'Mandvi',
          'Nachane',
          'Bhatye',
          'Maruti Mandir',
          'Udyam Nagar',
          'Zaver Baug',
          'Teli Aali',
          'Karbude',
          'Shirke Nagar',
          'Fishtail',
          'Bhagoji Keer',
        ],
        required: true,
      },
      landmark: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-progress', 'resolved'],
      default: 'pending',
    },
    filedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // GPS tracking
    workerGps: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    startedAt: Date,
    resolvedAt: Date,
    // Photo evidence
    beforeImage: String,
    afterImage: String,
    // GPS history trail for map polyline and audit
    gpsHistory: [
      {
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // Anti-proxy
    proxyFlagged: {
      type: Boolean,
      default: false,
    },
    // Review
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Worker Expenses
    expenses: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        receiptImage: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    // Quotation
    quotation: {
      amount: {
        type: Number,
        default: 0,
      },
      description: {
        type: String,
        default: '',
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
