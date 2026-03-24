const express = require('express');
const School = require('../models/School');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all schools (any authenticated user)
router.get('/', authenticate, async (req, res) => {
  try {
    const schools = await School.find().sort({ area: 1, name: 1 });
    res.json(schools);
  } catch (err) {
    console.error('Get schools error:', err);
    res.status(500).json({ message: 'Server error while fetching schools.' });
  }
});

// Update school data (supervisor only)
router.patch('/:id', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const updates = req.body;
    const school = await School.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    res.json({ message: 'School updated successfully.', school });
  } catch (err) {
    console.error('Update school error:', err);
    res.status(500).json({ message: 'Server error while updating school.' });
  }
});

module.exports = router;
