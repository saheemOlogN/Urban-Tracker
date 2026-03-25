const mongoose = require('mongoose');
require('dotenv').config();
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

const doctorsData = [
  {
    name: "Dr. Rajesh Patil",
    specialization: "Cardiologist",
    qualification: "MD, DM (Cardiology)",
    experience: 12,
    availableSlots: [
      { day: "Monday", startTime: "09:00", endTime: "13:00" },
      { day: "Wednesday", startTime: "09:00", endTime: "13:00" },
      { day: "Friday", startTime: "14:00", endTime: "18:00" }
    ],
    slotDuration: 30
  },
  {
    name: "Dr. Anjali Deshmukh",
    specialization: "Pediatrician",
    qualification: "MBBS, DCH",
    experience: 8,
    availableSlots: [
      { day: "Tuesday", startTime: "10:00", endTime: "14:00" },
      { day: "Thursday", startTime: "10:00", endTime: "14:00" },
      { day: "Saturday", startTime: "10:00", endTime: "13:00" }
    ],
    slotDuration: 20
  },
  {
    name: "Dr. Sameer Kulkarni",
    specialization: "Orthopedic Surgeon",
    qualification: "MS (Ortho)",
    experience: 15,
    availableSlots: [
      { day: "Monday", startTime: "11:00", endTime: "15:00" },
      { day: "Tuesday", startTime: "11:00", endTime: "15:00" },
      { day: "Thursday", startTime: "16:00", endTime: "20:00" }
    ],
    slotDuration: 45
  },
  {
    name: "Dr. Priya Sharma",
    specialization: "Gynecologist",
    qualification: "MBBS, MS (OBG)",
    experience: 10,
    availableSlots: [
      { day: "Wednesday", startTime: "09:00", endTime: "13:00" },
      { day: "Friday", startTime: "09:00", endTime: "13:00" },
      { day: "Saturday", startTime: "14:00", endTime: "17:00" }
    ],
    slotDuration: 30
  },
  {
    name: "Dr. Amit Verma",
    specialization: "General Physician",
    qualification: "MBBS",
    experience: 5,
    availableSlots: [
      { day: "Monday", startTime: "10:00", endTime: "14:00" },
      { day: "Tuesday", startTime: "10:00", endTime: "14:00" },
      { day: "Wednesday", startTime: "10:00", endTime: "14:00" },
      { day: "Thursday", startTime: "10:00", endTime: "14:00" },
      { day: "Friday", startTime: "10:00", endTime: "14:00" }
    ],
    slotDuration: 15
  }
];

async function seedDoctors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const hospital = await Hospital.findOne({});
    if (!hospital) {
      console.error('No hospital found. Please seed hospitals first.');
      process.exit(1);
    }

    console.log(`Seeding doctors for hospital: ${hospital.name} in area: ${hospital.area}`);

    const doctors = doctorsData.map(doc => ({
      ...doc,
      hospital: hospital._id,
      area: hospital.area || 'Rajiwada',
      status: 'active',
      rating: 4 + Math.random(),
      totalReviews: Math.floor(Math.random() * 50) + 10
    }));

    await Doctor.insertMany(doctors);
    console.log(`Successfully seeded ${doctors.length} doctors!`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding doctors:', err);
    process.exit(1);
  }
}

seedDoctors();
