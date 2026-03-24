const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
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
    totalBeds: {
      type: Number,
      required: true,
    },
    availableBeds: {
      type: Number,
      required: true,
    },
    doctors: {
      type: Number,
      required: true,
    },
    contact: {
      type: String,
      trim: true,
    },
    specializations: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hospital', hospitalSchema);
