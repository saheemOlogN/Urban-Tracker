/**
 * seed-admin-users.js
 * Run: node seed-admin-users.js
 *
 * Creates test hospital_admin and school_admin users.
 * Requires a MongoDB database with at least one Hospital and one School.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Hospital = require('./models/Hospital');
const School = require('./models/School');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Get first hospital and school
  const hospital = await Hospital.findOne({});
  const school = await School.findOne({});

  if (!hospital) {
    console.error('❌ No hospitals found. Run the main seed script first.');
    process.exit(1);
  }
  if (!school) {
    console.error('❌ No schools found. Run the main seed script first.');
    process.exit(1);
  }

  const password = await bcrypt.hash('Admin@123', 10);

  // Hospital Admin
  const existingHospAdmin = await User.findOne({ email: 'hospitaladmin@urban.test' });
  if (!existingHospAdmin) {
    await User.create({
      name: 'Hospital Admin',
      email: 'hospitaladmin@urban.test',
      password,
      role: 'hospital_admin',
      hospitalId: hospital._id,
      aadhar: '990011223344',
      phone: '9876543210',
    });
    console.log(`✅ Hospital Admin created`);
    console.log(`   Email: hospitaladmin@urban.test`);
    console.log(`   Password: Admin@123`);
    console.log(`   Hospital: ${hospital.name} (${hospital.area})`);
  } else {
    console.log('ℹ️  Hospital Admin already exists:', existingHospAdmin.email);
  }

  // School Admin
  const existingSchoolAdmin = await User.findOne({ email: 'schooladmin@urban.test' });
  if (!existingSchoolAdmin) {
    await User.create({
      name: 'School Admin',
      email: 'schooladmin@urban.test',
      password,
      role: 'school_admin',
      schoolId: school._id,
      aadhar: '990011223355',
      phone: '9876543211',
    });
    console.log(`✅ School Admin created`);
    console.log(`   Email: schooladmin@urban.test`);
    console.log(`   Password: Admin@123`);
    console.log(`   School: ${school.name} (${school.area})`);
  } else {
    console.log('ℹ️  School Admin already exists:', existingSchoolAdmin.email);
  }

  await mongoose.disconnect();
  console.log('\n✅ Done. You can now log in with the above credentials.');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
