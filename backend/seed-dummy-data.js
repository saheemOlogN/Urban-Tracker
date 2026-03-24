const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

// ──────────────────────────── Config ────────────────────────────
const AREAS = [
  'Rajiwada', 'Mirjole', 'Kothawade', 'Mandvi', 'Nachane',
  'Bhatye', 'Maruti Mandir', 'Udyam Nagar', 'Zaver Baug',
  'Teli Aali', 'Karbude', 'Shirke Nagar', 'Fishtail', 'Bhagoji Keer',
];

const TYPES = ['road', 'garbage', 'water', 'sanitation'];

const LANDMARKS = {
  'Rajiwada': ['Near Tilak Chowk', 'Behind Old Collectorate', 'Rajiwada Main Road'],
  'Mirjole': ['Mirjole Bus Stop', 'Near SBI Branch', 'Mirjole Naka'],
  'Kothawade': ['Kothawade Bridge', 'Near Water Tank', 'Kothawade Market'],
  'Mandvi': ['Mandvi Beach Road', 'Near Ferry Point', 'Mandvi Fish Market'],
  'Nachane': ['Nachane MIDC Road', 'Industrial Area Gate', 'Nachane Railway Station'],
  'Bhatye': ['Bhatye Beach', 'Bhatye Main Road', 'Near Lighthouse'],
  'Maruti Mandir': ['Near Maruti Temple', 'Maruti Mandir Galli', 'Old Market Area'],
  'Udyam Nagar': ['Udyam Nagar Circle', 'Near Telephone Exchange', 'Housing Colony'],
  'Zaver Baug': ['Zaver Baug Garden', 'Near Municipal Office', 'Main Street'],
  'Teli Aali': ['Teli Aali Lane', 'Near Oil Mill', 'Market Yard'],
  'Karbude': ['Karbude Junction', 'Near Health Centre', 'Karbude Village Road'],
  'Shirke Nagar': ['Shirke Nagar Society', 'Near School', 'Colony Gate'],
  'Fishtail': ['Fishtail Beach', 'Coastal Road', 'Near Jetty'],
  'Bhagoji Keer': ['Bhagoji Keer Chowk', 'Near High School', 'Market Lane'],
};

const COMPLAINT_TEMPLATES = {
  road: [
    { title: 'Pothole on main road', desc: 'Large pothole causing accidents near the intersection.' },
    { title: 'Road surface damaged', desc: 'Road surface is completely broken after monsoon rains.' },
    { title: 'Speed breaker damaged', desc: 'Speed breaker is broken and creating hazard for vehicles.' },
    { title: 'Road waterlogging', desc: 'Waterlogging on road due to poor drainage system.' },
    { title: 'Footpath broken', desc: 'Footpath tiles are broken making it difficult for pedestrians.' },
    { title: 'Street light not working', desc: 'Street lights are not functioning on this road segment.' },
    { title: 'Road divider damaged', desc: 'Road divider is broken at multiple places.' },
    { title: 'Unpaved road needs repair', desc: 'Unpaved section of road needs immediate attention.' },
  ],
  garbage: [
    { title: 'Garbage dump overflow', desc: 'Community garbage bin is overflowing and causing bad smell.' },
    { title: 'Waste not collected', desc: 'Municipal waste collection has not happened for 5 days.' },
    { title: 'Open dumping near houses', desc: 'People are dumping waste openly near residential area.' },
    { title: 'Dead animal on road', desc: 'Dead animal carcass on road needs removal.' },
    { title: 'Construction debris', desc: 'Construction waste dumped on public road blocking traffic.' },
    { title: 'Garbage burning complaint', desc: 'Burning of garbage in open creating air pollution.' },
    { title: 'Overflowing dustbin', desc: 'Public dustbin is overflowing and garbage spreading on road.' },
  ],
  water: [
    { title: 'Water pipe leaking', desc: 'Municipal water pipeline is leaking and wasting water.' },
    { title: 'No water supply', desc: 'No water supply for the past 3 days in our area.' },
    { title: 'Contaminated water', desc: 'Water supply appears dirty and contaminated.' },
    { title: 'Low water pressure', desc: 'Very low water pressure making it difficult to use.' },
    { title: 'Water meter faulty', desc: 'Water meter showing incorrect readings.' },
    { title: 'Drainage overflow', desc: 'Drainage is overflowing near the main road junction.' },
  ],
  sanitation: [
    { title: 'Open drain clogged', desc: 'Open drain is completely clogged causing flooding.' },
    { title: 'Sewage overflow', desc: 'Sewage line has burst and sewage is flowing on road.' },
    { title: 'Public toilet dirty', desc: 'Public toilet facility is extremely dirty and unmaintained.' },
    { title: 'Mosquito breeding', desc: 'Stagnant water creating mosquito breeding ground.' },
    { title: 'Manhole cover missing', desc: 'Manhole cover is missing creating dangerous situation.' },
    { title: 'Gutter cleaning needed', desc: 'Gutters are blocked and need immediate cleaning.' },
  ],
};

const CITIZEN_DATA = [
  { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', phone: '9123456780', aadhar: '210987654321', area: 'Rajiwada' },
  { name: 'Amit Kulkarni', email: 'amit.kulkarni@gmail.com', phone: '9123456781', aadhar: '210987654322', area: 'Mirjole' },
  { name: 'Sneha Desai', email: 'sneha.desai@gmail.com', phone: '9123456782', aadhar: '210987654323', area: 'Mandvi' },
  { name: 'Rajesh Pawar', email: 'rajesh.pawar@gmail.com', phone: '9123456783', aadhar: '210987654324', area: 'Nachane' },
  { name: 'Meena Joshi', email: 'meena.joshi@gmail.com', phone: '9123456784', aadhar: '210987654325', area: 'Bhatye' },
  { name: 'Vikram Naik', email: 'vikram.naik@gmail.com', phone: '9123456785', aadhar: '210987654326', area: 'Udyam Nagar' },
  { name: 'Anita Gaikwad', email: 'anita.gaikwad@gmail.com', phone: '9123456786', aadhar: '210987654327', area: 'Maruti Mandir' },
  { name: 'Deepak More', email: 'deepak.more@gmail.com', phone: '9123456787', aadhar: '210987654328', area: 'Kothawade' },
  { name: 'Kavita Bhosle', email: 'kavita.bhosle@gmail.com', phone: '9123456788', aadhar: '210987654329', area: 'Zaver Baug' },
  { name: 'Sunil Mane', email: 'sunil.mane@gmail.com', phone: '9123456789', aadhar: '210987654330', area: 'Karbude' },
];

// ──────────────────── Helpers ────────────────────
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ──────────────────── Main ────────────────────
async function seedDummyData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for dummy data seeding...');

    const salt = await bcrypt.genSalt(10);
    const citizenPassword = await bcrypt.hash('Citizen@123', salt);

    // ─── Upsert citizen users ───
    const citizenIds = [];
    for (const c of CITIZEN_DATA) {
      const user = await User.findOneAndUpdate(
        { email: c.email },
        {
          $setOnInsert: {
            name: c.name,
            email: c.email,
            password: citizenPassword,
            role: 'citizen',
            phone: c.phone,
            aadhar: c.aadhar,
            area: c.area,
          },
        },
        { upsert: true, new: true }
      );
      citizenIds.push(user._id);
    }
    console.log(`Upserted ${CITIZEN_DATA.length} citizen users (password: Citizen@123)`);

    // ─── Get worker IDs for assignments ───
    const workers = await User.find({ role: 'worker' });
    if (workers.length === 0) {
      console.error('No workers found! Run seed.js first.');
      process.exit(1);
    }
    const workerMap = {};
    workers.forEach(w => { workerMap[w.area] = w._id; });

    // ─── Check existing dummy complaints to avoid duplication ───
    const existingCount = await Complaint.countDocuments({
      title: { $regex: /^(Pothole|Road surface|Garbage dump|Water pipe|Open drain|Sewage|Speed breaker|Waste not|No water|Footpath|Drainage|Manhole|Public toilet|Low water)/i }
    });
    if (existingCount > 50) {
      console.log(`Already ${existingCount} dummy complaints in DB. Skipping insertion to avoid duplication.`);
      console.log('To force re-seed, manually delete existing dummy complaints first.');
      process.exit(0);
    }

    // ─── Generate complaints across 3 months (Jan 2026, Feb 2026, Mar 2026) ───
    const months = [
      { start: new Date('2026-01-01'), end: new Date('2026-01-31'), count: 35 },
      { start: new Date('2026-02-01'), end: new Date('2026-02-28'), count: 45 },
      { start: new Date('2026-03-01'), end: new Date('2026-03-24'), count: 40 },
    ];

    const allComplaints = [];

    for (const monthCfg of months) {
      for (let i = 0; i < monthCfg.count; i++) {
        const type = randomFrom(TYPES);
        const template = randomFrom(COMPLAINT_TEMPLATES[type]);
        const area = randomFrom(AREAS);
        const landmark = randomFrom(LANDMARKS[area]);
        const citizenId = randomFrom(citizenIds);
        const createdAt = randomDate(monthCfg.start, monthCfg.end);

        // Decide status — weighted distribution
        const rand = Math.random();
        let status, assignedTo, startedAt, resolvedAt, quotation, expenses, rating, review, reviewedBy;

        const areaWorker = workerMap[area] || workers[0]._id;

        if (rand < 0.10) {
          // 10% pending
          status = 'pending';
          assignedTo = null;
        } else if (rand < 0.20) {
          // 10% assigned
          status = 'assigned';
          assignedTo = areaWorker;
        } else if (rand < 0.35) {
          // 15% in-progress
          status = 'in-progress';
          assignedTo = areaWorker;
          startedAt = new Date(createdAt.getTime() + randomBetween(1, 48) * 3600000);
          expenses = generateExpenses();
          quotation = {
            amount: expenses.reduce((s, e) => s + e.amount, 0),
            description: `Worker expenses (${expenses.length} items)`,
          };
        } else {
          // 65% resolved
          status = 'resolved';
          assignedTo = areaWorker;
          startedAt = new Date(createdAt.getTime() + randomBetween(1, 24) * 3600000);
          resolvedAt = new Date(startedAt.getTime() + randomBetween(2, 72) * 3600000);
          expenses = generateExpenses();
          const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
          quotation = {
            amount: totalExpense > 0 ? totalExpense : randomBetween(500, 15000),
            description: totalExpense > 0 ? `Worker expenses (${expenses.length} items)` : 'Supervisor estimate',
          };

          // 60% of resolved get reviews
          if (Math.random() < 0.6) {
            rating = randomBetween(2, 5);
            review = randomFrom([
              'Good work by the worker.',
              'Issue resolved quickly, thank you!',
              'Satisfactory resolution.',
              'Could have been faster but decent work.',
              'Excellent job, very professional.',
              'Took too long but finally resolved.',
              'Average work quality.',
              'Very happy with the quick response.',
            ]);
            reviewedBy = randomFrom(citizenIds);
          }
        }

        allComplaints.push({
          type,
          title: `${template.title} - ${area}`,
          description: `${template.desc} Location: near ${landmark}.`,
          location: { area, landmark },
          status,
          filedBy: citizenId,
          assignedTo: assignedTo || undefined,
          startedAt: startedAt || undefined,
          resolvedAt: resolvedAt || undefined,
          quotation: quotation || undefined,
          expenses: expenses || [],
          rating: rating || undefined,
          review: review || undefined,
          reviewedBy: reviewedBy || undefined,
          createdAt,
          updatedAt: resolvedAt || startedAt || createdAt,
        });
      }
    }

    // Insert all complaints at once
    await Complaint.insertMany(allComplaints);
    console.log(`\nInserted ${allComplaints.length} complaints across 3 months:`);

    // Summary
    const statusCounts = {};
    const monthCounts = {};
    const typeCounts = {};
    allComplaints.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      const m = c.createdAt.toISOString().slice(0, 7);
      monthCounts[m] = (monthCounts[m] || 0) + 1;
      typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
    });

    console.log('\n  By month:', monthCounts);
    console.log('  By status:', statusCounts);
    console.log('  By type:', typeCounts);

    const totalExpenditure = allComplaints.reduce((s, c) => s + (c.quotation?.amount || 0), 0);
    console.log(`  Total expenditure: ₹${totalExpenditure.toLocaleString()}`);

    // Update worker ratings from reviews
    const workersToUpdate = await Complaint.aggregate([
      { $match: { rating: { $exists: true, $ne: null }, assignedTo: { $exists: true } } },
      { $group: { _id: '$assignedTo', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    for (const w of workersToUpdate) {
      await User.findByIdAndUpdate(w._id, {
        rating: Math.round(w.avgRating * 10) / 10,
        totalReviews: w.count,
      });
    }
    console.log(`\nUpdated ratings for ${workersToUpdate.length} workers.`);

    // ─── Generate dummy doctor appointments and ratings ───
    const doctors = await Doctor.find();
    if (doctors.length > 0) {
      console.log(`Generating dummy appointments for ${doctors.length} doctors...`);
      const allAppointments = [];
      for (const doc of doctors) {
        // Generate 5-12 appointments per doctor
        const aptCount = randomBetween(5, 12);
        for (let i = 0; i < aptCount; i++) {
          const patientId = randomFrom(citizenIds);
          const date = randomDate(new Date('2026-01-01'), new Date('2026-03-24'));
          const hour = randomBetween(9, 17);
          const min = randomFrom(['00', '30']);
          const timeSlot = `${String(hour).padStart(2, '0')}:${min}`;
          
          // 80% completed, 10% booked, 10% cancelled
          const r = Math.random();
          let status = 'completed';
          if (r < 0.1) status = 'booked';
          else if (r < 0.2) status = 'cancelled';

          let rating, review;
          if (status === 'completed' && Math.random() < 0.8) {
            rating = randomBetween(3, 5);
            review = randomFrom([
              'Very professional doctor.',
              'Great consultation, highly recommended.',
              'The doctor explained everything clearly.',
              'Wait time was a bit long but doctor is good.',
              'Very polite and thorough.',
              'Good experience at the municipal hospital.',
              'Efficient and helpful staff as well.',
              'Doctor was very attentive to my concerns.',
            ]);
          }

          allAppointments.push({
            doctor: doc._id,
            patient: patientId,
            hospital: doc.hospital,
            date,
            timeSlot,
            status,
            rating,
            review,
          });
        }
      }

      await Appointment.insertMany(allAppointments);
      console.log(`Inserted ${allAppointments.length} dummy appointments.`);

      // Update doctor ratings
      const doctorAverages = await Appointment.aggregate([
        { $match: { rating: { $exists: true, $ne: null } } },
        { $group: { _id: '$doctor', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);

      for (const d of doctorAverages) {
        await Doctor.findByIdAndUpdate(d._id, {
          rating: Math.round(d.avgRating * 10) / 10,
          totalReviews: d.count,
        });
      }
      console.log(`Updated ratings for ${doctorAverages.length} doctors.`);
    }

    console.log('\n✓ Dummy data seeding complete!');
    console.log('  Citizens can log in with email + password: Citizen@123');
    console.log('  ML Predictions page should now show charts and forecasts.');
    process.exit(0);
  } catch (err) {
    console.error('Dummy data seeding error:', err);
    process.exit(1);
  }
}

function generateExpenses() {
  if (Math.random() < 0.3) return []; // 30% chance no expenses

  const expenseTemplates = [
    { description: 'Labour charges', min: 500, max: 5000 },
    { description: 'Material cost', min: 1000, max: 10000 },
    { description: 'Equipment rental', min: 800, max: 4000 },
    { description: 'Transportation', min: 200, max: 1500 },
    { description: 'Cement and sand', min: 1500, max: 8000 },
    { description: 'Pipe fittings', min: 300, max: 2500 },
    { description: 'Cleaning supplies', min: 200, max: 1000 },
    { description: 'Safety equipment', min: 400, max: 2000 },
  ];

  const count = randomBetween(1, 4);
  const selected = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let idx;
    do { idx = randomBetween(0, expenseTemplates.length - 1); } while (used.has(idx));
    used.add(idx);
    const t = expenseTemplates[idx];
    selected.push({
      description: t.description,
      amount: randomBetween(t.min, t.max),
      receiptImage: '',
      addedAt: new Date(),
    });
  }
  return selected;
}

seedDummyData();
