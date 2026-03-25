const express = require('express');
const Hospital = require('../models/Hospital');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all hospitals (any authenticated user)
router.get('/', authenticate, async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ area: 1, name: 1 });
    res.json(hospitals);
  } catch (err) {
    console.error('Get hospitals error:', err);
    res.status(500).json({ message: 'Server error while fetching hospitals.' });
  }
});

// Get single hospital (hospital_admin sees own only)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found.' });

    // hospital_admin can only view their own hospital
    if (req.user.role === 'hospital_admin' &&
        req.user.hospitalId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(hospital);
  } catch (err) {
    console.error('Get hospital error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update hospital data (supervisor OR hospital_admin for their own hospital)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { role, hospitalId } = req.user;

    if (role === 'hospital_admin') {
      if (!hospitalId || hospitalId.toString() !== req.params.id) {
        return res.status(403).json({ message: 'You can only update your own hospital.' });
      }
    } else if (role !== 'supervisor') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const updates = req.body;
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found.' });
    }

    res.json({ message: 'Hospital updated successfully.', hospital });
  } catch (err) {
    console.error('Update hospital error:', err);
    res.status(500).json({ message: 'Server error while updating hospital.' });
  }
});

module.exports = router;
