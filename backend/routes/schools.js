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

// Get single school
router.get('/:id', authenticate, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found.' });

    if (req.user.role === 'school_admin' &&
        req.user.schoolId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(school);
  } catch (err) {
    console.error('Get school error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update school data (supervisor OR school_admin for their own school)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { role, schoolId } = req.user;

    if (role === 'school_admin') {
      if (!schoolId || schoolId.toString() !== req.params.id) {
        return res.status(403).json({ message: 'You can only update your own school.' });
      }
    } else if (role !== 'supervisor') {
      return res.status(403).json({ message: 'Access denied.' });
    }

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
