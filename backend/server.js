const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const hospitalRoutes = require('./routes/hospitals');
const schoolRoutes = require('./routes/schools');
const workerRoutes = require('./routes/workers');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Dynamic CORS — allows localhost in dev, and any *.vercel.app in production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB - urban-tracker'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Urban Tracker API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Urban Tracker server running on port ${PORT}`);
});
