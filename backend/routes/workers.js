const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all workers (supervisor only)
router.get('/', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' })
      .select('-password')
      .sort({ area: 1, name: 1 });
    res.json(workers);
  } catch (err) {
    console.error('Get workers error:', err);
    res.status(500).json({ message: 'Server error while fetching workers.' });
  }
});

// Create a new worker (supervisor only)
router.post('/', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const { name, email, password, phone, aadhar, area } = req.body;

    if (!name || !email || !password || !aadhar || !area) {
      return res.status(400).json({ message: 'Name, email, password, aadhar, and area are required.' });
    }

    if (aadhar.length !== 12) {
      return res.status(400).json({ message: 'Aadhar must be exactly 12 digits.' });
    }

    const existing = await User.findOne({ $or: [{ email }, { aadhar }] });
    if (existing) {
      return res.status(400).json({
        message: existing.email === email
          ? 'An account with this email already exists.'
          : 'An account with this Aadhar number already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const worker = new User({
      name,
      email,
      password: hashedPassword,
      role: 'worker',
      phone: phone || '',
      aadhar,
      area,
    });

    await worker.save();

    const workerResponse = worker.toObject();
    delete workerResponse.password;

    res.status(201).json({ message: 'Worker created successfully.', worker: workerResponse });
  } catch (err) {
    console.error('Create worker error:', err);
    res.status(500).json({ message: 'Server error while creating worker.' });
  }
});

// Update worker (supervisor only)
router.patch('/:id', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const { name, email, password, phone, aadhar, area } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (aadhar) updates.aadhar = aadhar;
    if (area) updates.area = area;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const worker = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'worker' },
      updates,
      { new: true }
    ).select('-password');

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.json({ message: 'Worker updated successfully.', worker });
  } catch (err) {
    console.error('Update worker error:', err);
    res.status(500).json({ message: 'Server error while updating worker.' });
  }
});

// Delete worker (supervisor only)
router.delete('/:id', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const worker = await User.findOneAndDelete({ _id: req.params.id, role: 'worker' });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.json({ message: 'Worker removed successfully.' });
  } catch (err) {
    console.error('Delete worker error:', err);
    res.status(500).json({ message: 'Server error while deleting worker.' });
  }
});

module.exports = router;
