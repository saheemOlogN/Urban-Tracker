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

    // Determine day of week
    const requestedDate = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[requestedDate.getDay()];

    // Find schedule for this day
    const daySchedule = doctor.availableSlots.filter(s => s.day === dayName);
    if (daySchedule.length === 0) {
      return res.json({ doctor: doctor.name, date, day: dayName, slots: [], message: 'Doctor is not available on this day.' });
    }

    // Generate all possible time slots
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

    // Find already booked slots on this date
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

// Create a new doctor (supervisor only)
router.post('/', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const { name, specialization, qualification, experience, hospital, area, availableSlots, slotDuration } = req.body;

    if (!name || !specialization || !qualification || !experience || !hospital || !area) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const doctor = new Doctor({
      name,
      specialization,
      qualification,
      experience,
      hospital,
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

// Update doctor (supervisor only)
router.patch('/:id', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('hospital', 'name area contact');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    res.json({ message: 'Doctor updated successfully.', doctor });
  } catch (err) {
    console.error('Update doctor error:', err);
    res.status(500).json({ message: 'Server error while updating doctor.' });
  }
});

module.exports = router;
