const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    area: {
      type: String,
      enum: [
        'Rajiwada', 'Mirjole', 'Kothawade', 'Mandvi', 'Nachane',
        'Bhatye', 'Maruti Mandir', 'Udyam Nagar', 'Zaver Baug',
        'Teli Aali', 'Karbude', 'Shirke Nagar', 'Fishtail', 'Bhagoji Keer',
      ],
      required: true,
    },
    // Weekly availability slots
    availableSlots: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          required: true,
        },
        startTime: { type: String, required: true }, // "09:00"
        endTime: { type: String, required: true },   // "13:00"
      },
    ],
    slotDuration: {
      type: Number,
      default: 30, // minutes per appointment
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'on-leave'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
