const express = require('express');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all doctors (any authenticated user)
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.query.hospital) filter.hospital = req.query.hospital;
    if (req.query.specialization) filter.specialization = { $regex: req.query.specialization, $options: 'i' };
    if (req.query.area) filter.area = req.query.area;
    if (req.query.status) filter.status = req.query.status;

    // hospital_admin can only see doctors in their hospital
    if (req.user.role === 'hospital_admin') {
      filter.hospital = req.user.hospitalId;
    }

    const doctors = await Doctor.find(filter)
      .populate('hospital', 'name area contact')
      .sort({ rating: -1, name: 1 });

    res.json(doctors);
  } catch (err) {
    console.error('Get doctors error:', err);
    res.status(500).json({ message: 'Server error while fetching doctors.' });
  }
});

// Get available slots for a doctor on a specific date
router.get('/:id/slots', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date query parameter is required (YYYY-MM-DD).' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const requestedDate = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[requestedDate.getDay()];

    const daySchedule = doctor.availableSlots.filter(s => s.day === dayName);
    if (daySchedule.length === 0) {
      return res.json({ doctor: doctor.name, date, day: dayName, slots: [], message: 'Doctor is not available on this day.' });
    }

    const allSlots = [];
    for (const schedule of daySchedule) {
      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      for (let m = startMinutes; m < endMinutes; m += doctor.slotDuration) {
        const hours = Math.floor(m / 60);
        const mins = m % 60;
        allSlots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
      }
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    }).select('timeSlot');

    const bookedSlots = new Set(bookedAppointments.map(a => a.timeSlot));

    const slots = allSlots.map(slot => ({
      time: slot,
      available: !bookedSlots.has(slot),
    }));

    res.json({
      doctor: doctor.name,
      date,
      day: dayName,
      slotDuration: doctor.slotDuration,
      slots,
    });
  } catch (err) {
    console.error('Get slots error:', err);
    res.status(500).json({ message: 'Server error while fetching slots.' });
  }
});

// Create a new doctor (supervisor OR hospital_admin for their own hospital)
router.post('/', authenticate, async (req, res) => {
  try {
    const { role, hospitalId } = req.user;

    if (role !== 'supervisor' && role !== 'hospital_admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { name, specialization, qualification, experience, hospital, area, availableSlots, slotDuration } = req.body;

    if (!name || !specialization || !qualification || !experience || !area) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // hospital_admin must assign the doctor to their own hospital
    let doctorHospital = hospital;
    if (role === 'hospital_admin') {
      if (!hospitalId) return res.status(403).json({ message: 'No hospital linked to your account.' });
      doctorHospital = hospitalId;
    } else if (!hospital) {
      return res.status(400).json({ message: 'Hospital field is required.' });
    }

    const doctor = new Doctor({
      name,
      specialization,
      qualification,
      experience,
      hospital: doctorHospital,
      area,
      availableSlots: availableSlots || [],
      slotDuration: slotDuration || 30,
    });

    await doctor.save();
    await doctor.populate('hospital', 'name area contact');

    res.status(201).json({ message: 'Doctor added successfully.', doctor });
  } catch (err) {
    console.error('Create doctor error:', err);
    res.status(500).json({ message: 'Server error while creating doctor.' });
  }
});

// Update doctor (supervisor OR hospital_admin for their own hospital's doctors)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { role, hospitalId } = req.user;

    if (role !== 'supervisor' && role !== 'hospital_admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found.' });

    if (role === 'hospital_admin' && doc.hospital.toString() !== hospitalId?.toString()) {
      return res.status(403).json({ message: 'You can only update doctors in your own hospital.' });
    }

    const updated = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('hospital', 'name area contact');

    res.json({ message: 'Doctor updated successfully.', doctor: updated });
  } catch (err) {
    console.error('Update doctor error:', err);
    res.status(500).json({ message: 'Server error while updating doctor.' });
  }
});

// Delete doctor (supervisor OR hospital_admin for their own hospital)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { role, hospitalId } = req.user;

    if (role !== 'supervisor' && role !== 'hospital_admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found.' });

    if (role === 'hospital_admin' && doc.hospital.toString() !== hospitalId?.toString()) {
      return res.status(403).json({ message: 'You can only delete doctors in your own hospital.' });
    }

    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doctor removed successfully.' });
  } catch (err) {
    console.error('Delete doctor error:', err);
    res.status(500).json({ message: 'Server error while deleting doctor.' });
  }
});

module.exports = router;
