const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Book an appointment (citizen only)
router.post('/', authenticate, authorize('citizen'), async (req, res) => {
  try {
    const { doctorId, date, timeSlot } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Doctor, date, and time slot are required.' });
    }

    const doctor = await Doctor.findById(doctorId).populate('hospital', 'name area');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    if (doctor.status !== 'active') {
      return res.status(400).json({ message: 'Doctor is currently on leave.' });
    }

    // Check if slot is already booked
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Appointment.findOne({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: 'cancelled' },
    });

    if (existing) {
      return res.status(400).json({ message: 'This time slot is already booked. Please choose another.' });
    }

    // Check if patient already has an appointment at same time
    const patientConflict = await Appointment.findOne({
      patient: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: 'cancelled' },
    });

    if (patientConflict) {
      return res.status(400).json({ message: 'You already have an appointment at this time.' });
    }

    const appointment = new Appointment({
      doctor: doctorId,
      patient: req.user.id,
      hospital: doctor.hospital._id,
      date: startOfDay,
      timeSlot,
    });

    await appointment.save();
    await appointment.populate('doctor', 'name specialization qualification');
    await appointment.populate('hospital', 'name area');
    await appointment.populate('patient', 'name email');

    res.status(201).json({
      message: `Appointment booked with Dr. ${doctor.name} on ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
      appointment,
    });
  } catch (err) {
    console.error('Book appointment error:', err);
    res.status(500).json({ message: 'Server error while booking appointment.' });
  }
});

// Get appointments (citizen sees own, supervisor sees all)
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'citizen') {
      query.patient = req.user.id;
    }

    const appointments = await Appointment.find(query)
      .populate('doctor', 'name specialization qualification experience rating')
      .populate('hospital', 'name area contact')
      .populate('patient', 'name email phone')
      .sort({ date: -1, timeSlot: -1 });

    res.json(appointments);
  } catch (err) {
    console.error('Get appointments error:', err);
    res.status(500).json({ message: 'Server error while fetching appointments.' });
  }
});

// Cancel appointment (citizen — must be at least 2 hours before)
router.patch('/:id/cancel', authenticate, authorize('citizen'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (appointment.status !== 'booked') {
      return res.status(400).json({ message: 'Only booked appointments can be cancelled.' });
    }

    // Check 2-hour minimum
    const [h, m] = appointment.timeSlot.split(':').map(Number);
    const appointmentTime = new Date(appointment.date);
    appointmentTime.setHours(h, m, 0, 0);
    const hoursUntil = (appointmentTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil < 2) {
      return res.status(400).json({ message: 'Appointments can only be cancelled at least 2 hours in advance.' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully.', appointment });
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).json({ message: 'Server error while cancelling appointment.' });
  }
});

// Mark appointment as completed (supervisor only)
router.patch('/:id/complete', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    )
      .populate('doctor', 'name specialization')
      .populate('patient', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    res.json({ message: 'Appointment marked as completed.', appointment });
  } catch (err) {
    console.error('Complete appointment error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Rate doctor after appointment (citizen only, completed appointments)
router.post('/:id/rate', authenticate, authorize('citizen'), async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed appointments.' });
    }
    if (appointment.rating) {
      return res.status(400).json({ message: 'This appointment has already been rated.' });
    }

    appointment.rating = rating;
    appointment.review = review || '';
    await appointment.save();

    // Update doctor average rating
    const doctorAppointments = await Appointment.find({
      doctor: appointment.doctor,
      rating: { $exists: true, $ne: null },
    });
    const avgRating = doctorAppointments.reduce((sum, a) => sum + a.rating, 0) / doctorAppointments.length;
    await Doctor.findByIdAndUpdate(appointment.doctor, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: doctorAppointments.length,
    });

    res.json({ message: 'Thank you for rating! Your feedback helps us improve.' });
  } catch (err) {
    console.error('Rate appointment error:', err);
    res.status(500).json({ message: 'Server error while rating.' });
  }
});

// Top municipal servants — top doctors + top workers
router.get('/top-servants', authenticate, async (req, res) => {
  try {
    const topDoctors = await Doctor.find({ totalReviews: { $gt: 0 } })
      .populate('hospital', 'name area')
      .sort({ rating: -1, totalReviews: -1 })
      .limit(10);

    const topWorkers = await User.find({ role: 'worker', totalReviews: { $gt: 0 } })
      .select('-password')
      .sort({ rating: -1, totalReviews: -1 })
      .limit(10);

    // Also get all workers with ratings (even 0 reviews, for completeness)
    const allWorkers = await User.find({ role: 'worker' })
      .select('-password')
      .sort({ rating: -1, totalReviews: -1 });

    const allDoctors = await Doctor.find({})
      .populate('hospital', 'name area')
      .sort({ rating: -1, totalReviews: -1 });

    res.json({
      topDoctors: topDoctors.length > 0 ? topDoctors : allDoctors.slice(0, 10),
      topWorkers: topWorkers.length > 0 ? topWorkers : allWorkers.slice(0, 10),
    });
  } catch (err) {
    console.error('Top servants error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
