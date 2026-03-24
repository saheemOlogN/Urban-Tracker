const express = require('express');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { sendResolutionEmail } = require('../utils/email');

const router = express.Router();

// Area center coordinates for anti-proxy distance calculation
const AREA_COORDS = {
  'Rajiwada': { lat: 16.9925, lng: 73.3120 },
  'Mirjole': { lat: 16.9880, lng: 73.3078 },
  'Kothawade': { lat: 16.9850, lng: 73.3050 },
  'Mandvi': { lat: 16.9960, lng: 73.3140 },
  'Nachane': { lat: 16.9800, lng: 73.2980 },
  'Bhatye': { lat: 16.9700, lng: 73.2900 },
  'Maruti Mandir': { lat: 16.9940, lng: 73.3100 },
  'Udyam Nagar': { lat: 16.9860, lng: 73.3060 },
  'Zaver Baug': { lat: 16.9910, lng: 73.3090 },
  'Teli Aali': { lat: 16.9930, lng: 73.3110 },
  'Karbude': { lat: 16.9780, lng: 73.3000 },
  'Shirke Nagar': { lat: 16.9820, lng: 73.3040 },
  'Fishtail': { lat: 16.9950, lng: 73.3150 },
  'Bhagoji Keer': { lat: 16.9870, lng: 73.3070 },
};

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// File a new complaint + auto-assign to area worker
router.post('/', authenticate, authorize('citizen'), async (req, res) => {
  try {
    const { type, title, description, location } = req.body;

    if (!type || !title || !description || !location || !location.area) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Find a worker in the same area (least loaded first)
    const areaWorkers = await User.find({ role: 'worker', area: location.area });
    let assignedTo = null;
    let status = 'pending';

    if (areaWorkers.length > 0) {
      // Assign to the worker with fewest active complaints in this area
      const workerLoads = await Promise.all(
        areaWorkers.map(async (w) => {
          const count = await Complaint.countDocuments({
            assignedTo: w._id,
            status: { $in: ['assigned', 'in-progress'] },
          });
          return { worker: w, count };
        })
      );
      workerLoads.sort((a, b) => a.count - b.count);
      assignedTo = workerLoads[0].worker._id;
      status = 'assigned';
    }

    const complaint = new Complaint({
      type,
      title,
      description,
      location,
      filedBy: req.user.id,
      assignedTo,
      status,
    });

    await complaint.save();
    await complaint.populate('filedBy', 'name email');
    await complaint.populate('assignedTo', 'name email');

    res.status(201).json({
      message: assignedTo
        ? 'Complaint filed and auto-assigned to area worker.'
        : 'Complaint filed. No worker available in this area — pending manual assignment.',
      complaint,
    });
  } catch (err) {
    console.error('File complaint error:', err);
    res.status(500).json({ message: 'Server error while filing complaint.' });
  }
});

// Get all complaints (filtered by role)
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'citizen') {
      query.filedBy = req.user.id;
    } else if (req.user.role === 'worker') {
      query.assignedTo = req.user.id;
    }
    // Supervisor sees all

    const complaints = await Complaint.find(query)
      .populate('filedBy', 'name email')
      .populate('assignedTo', 'name email area')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Fetch complaints error:', err);
    res.status(500).json({ message: 'Server error while fetching complaints.' });
  }
});

// Get resolved complaints in citizen's area (for review page)
router.get('/area-resolved', authenticate, authorize('citizen'), async (req, res) => {
  try {
    const citizen = await User.findById(req.user.id);
    if (!citizen || !citizen.area) {
      return res.status(400).json({ message: 'Your area is not set.' });
    }

    const complaints = await Complaint.find({
      'location.area': citizen.area,
      status: 'resolved',
    })
      .populate('filedBy', 'name email')
      .populate('assignedTo', 'name email area rating totalReviews')
      .populate('reviewedBy', 'name')
      .sort({ resolvedAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Fetch area-resolved error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get workers list (for supervisor assignment dropdown)
router.get('/workers/list', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('name email area');
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch workers.' });
  }
});

// Get all quotation/expense data (for analytics — any authenticated user)
router.get('/analytics/quotations', authenticate, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      $or: [
        { 'quotation.amount': { $gt: 0 } },
        { 'expenses.0': { $exists: true } },
      ],
    })
      .populate('filedBy', 'name email area')
      .populate('assignedTo', 'name email area')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Quotation analytics error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all complaints data for ML predictions (any authenticated user)
router.get('/analytics/predictions', authenticate, async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .select('type location status quotation expenses createdAt resolvedAt startedAt')
      .sort({ createdAt: 1 });

    res.json(complaints);
  } catch (err) {
    console.error('Predictions data error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get single complaint
router.get('/:id', authenticate, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('filedBy', 'name email')
      .populate('assignedTo', 'name email area');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (req.user.role === 'citizen' && complaint.filedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (req.user.role === 'worker' && complaint.assignedTo?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    res.json(complaint);
  } catch (err) {
    console.error('Fetch complaint error:', err);
    res.status(500).json({ message: 'Server error while fetching complaint.' });
  }
});

// Assign complaint to worker (supervisor only)
router.patch('/:id/assign', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({ message: 'Worker ID is required.' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo: workerId, status: 'assigned' },
      { new: true }
    )
      .populate('filedBy', 'name email')
      .populate('assignedTo', 'name email area');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.json({ message: 'Complaint assigned successfully.', complaint });
  } catch (err) {
    console.error('Assign complaint error:', err);
    res.status(500).json({ message: 'Server error while assigning complaint.' });
  }
});

// Update complaint status with GPS tracking + anti-proxy
router.patch('/:id/status', authenticate, authorize('worker', 'supervisor'), async (req, res) => {
  try {
    const { status, lat, lng, beforeImage, afterImage } = req.body;

    if (!status || !['in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    complaint.status = status;

    if (status === 'in-progress') {
      complaint.startedAt = new Date();

      // Store worker GPS
      if (lat && lng) {
        complaint.workerGps = { lat, lng, updatedAt: new Date() };
        // Push to GPS history trail
        if (!complaint.gpsHistory) complaint.gpsHistory = [];
        complaint.gpsHistory.push({ lat, lng, timestamp: new Date() });

        // Anti-proxy check: if worker is too far from complaint area
        const areaCoords = AREA_COORDS[complaint.location?.area];
        if (areaCoords) {
          const distance = getDistanceKm(lat, lng, areaCoords.lat, areaCoords.lng);
          const timeSinceAssign = (Date.now() - new Date(complaint.updatedAt).getTime()) / 1000 / 3600; // hours
          const maxPossibleDistance = timeSinceAssign * 5; // 5 km/h walking speed

          if (distance > 2 && distance > maxPossibleDistance) {
            complaint.proxyFlagged = true;
          }
        }
      }

      if (beforeImage) {
        complaint.beforeImage = beforeImage;
      }
    }

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
      if (afterImage) {
        complaint.afterImage = afterImage;
      }
    }

    await complaint.save();
    await complaint.populate('filedBy', 'name email');
    await complaint.populate('assignedTo', 'name email area');

    // Send email to all area residents on resolution
    if (status === 'resolved' && complaint.location?.area) {
      const areaResidents = await User.find({
        role: 'citizen',
        area: complaint.location.area,
      }).select('email name');
      sendResolutionEmail(complaint, areaResidents); // fire and forget
    }

    res.json({ message: 'Status updated successfully.', complaint });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error while updating status.' });
  }
});

// Update GPS location (worker pings periodically) + proxy check + history
router.patch('/:id/gps', authenticate, authorize('worker'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ message: 'GPS coordinates required.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    complaint.workerGps = { lat, lng, updatedAt: new Date() };

    // Push to GPS history trail
    if (!complaint.gpsHistory) complaint.gpsHistory = [];
    complaint.gpsHistory.push({ lat, lng, timestamp: new Date() });

    // Anti-proxy check on every GPS ping
    const areaCoords = AREA_COORDS[complaint.location?.area];
    if (areaCoords) {
      const distance = getDistanceKm(lat, lng, areaCoords.lat, areaCoords.lng);
      if (distance > 2) {
        complaint.proxyFlagged = true;
      }
    }

    await complaint.save();

    res.json({ message: 'GPS updated.', workerGps: complaint.workerGps, proxyFlagged: complaint.proxyFlagged });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Submit review (citizen only — for resolved complaints in their area)
router.post('/:id/review', authenticate, authorize('citizen'), async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    if (complaint.status !== 'resolved') {
      return res.status(400).json({ message: 'Can only review resolved complaints.' });
    }
    if (complaint.rating) {
      return res.status(400).json({ message: 'This complaint has already been reviewed.' });
    }

    complaint.rating = rating;
    complaint.review = review || '';
    complaint.reviewedBy = req.user.id;
    await complaint.save();

    // Update worker average rating
    if (complaint.assignedTo) {
      const workerComplaints = await Complaint.find({
        assignedTo: complaint.assignedTo,
        rating: { $exists: true, $ne: null },
      });
      const avgRating = workerComplaints.reduce((sum, c) => sum + c.rating, 0) / workerComplaints.length;
      await User.findByIdAndUpdate(complaint.assignedTo, {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: workerComplaints.length,
      });
    }

    res.json({ message: 'Review submitted. Thank you for your feedback!' });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ message: 'Server error while submitting review.' });
  }
});

// Update quotation (supervisor only)
router.patch('/:id/quotation', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (amount === undefined) {
      return res.status(400).json({ message: 'Quotation amount is required.' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        quotation: {
          amount,
          description: description || '',
          updatedBy: req.user.id,
        },
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.json({ message: 'Quotation updated successfully.', complaint });
  } catch (err) {
    console.error('Update quotation error:', err);
    res.status(500).json({ message: 'Server error while updating quotation.' });
  }
});

// Add expense (worker only — during in-progress)
router.post('/:id/expenses', authenticate, authorize('worker'), async (req, res) => {
  try {
    const { description, amount, receiptImage } = req.body;

    if (!description || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Description and valid amount are required.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    if (complaint.status !== 'in-progress') {
      return res.status(400).json({ message: 'Can only add expenses to in-progress complaints.' });
    }
    if (complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (!complaint.expenses) complaint.expenses = [];
    complaint.expenses.push({
      description,
      amount: Number(amount),
      receiptImage: receiptImage || '',
      addedAt: new Date(),
    });

    // Auto-update quotation total from expenses
    const expenseTotal = complaint.expenses.reduce((sum, e) => sum + e.amount, 0);
    if (!complaint.quotation) complaint.quotation = {};
    complaint.quotation.amount = expenseTotal;
    complaint.quotation.description = `Worker expenses (${complaint.expenses.length} items)`;

    await complaint.save();
    await complaint.populate('assignedTo', 'name email area');

    res.json({ message: 'Expense added.', complaint });
  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ message: 'Server error while adding expense.' });
  }
});

module.exports = router;
