const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['citizen', 'worker', 'supervisor'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    aadhar: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{12}$/, 'Please provide a valid 12-digit Aadhar number'],
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
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
