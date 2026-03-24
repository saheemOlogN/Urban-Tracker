const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['primary', 'secondary', 'higher-secondary'],
      required: true,
    },
    totalStudents: {
      type: Number,
      required: true,
    },
    totalTeachers: {
      type: Number,
      required: true,
    },
    contact: {
      type: String,
      trim: true,
    },
    facilities: [
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

module.exports = mongoose.model('School', schoolSchema);
