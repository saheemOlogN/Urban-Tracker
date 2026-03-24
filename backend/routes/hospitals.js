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

// Update hospital data (supervisor only)
router.patch('/:id', authenticate, authorize('supervisor'), async (req, res) => {
  try {
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
