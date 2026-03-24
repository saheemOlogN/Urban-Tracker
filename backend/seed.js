const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Hospital = require('./models/Hospital');
const School = require('./models/School');
const Doctor = require('./models/Doctor');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    const salt = await bcrypt.genSalt(10);

    // ─── Upsert supervisor (will NOT delete existing citizens/workers) ───
    const supervisorPassword = await bcrypt.hash('Admin@123', salt);
    await User.findOneAndUpdate(
      { email: 'supervisor@ratnagiri.gov.in' },
      {
        $setOnInsert: {
          name: 'Supervisor Admin',
          password: supervisorPassword,
          role: 'supervisor',
          phone: '9876543210',
          aadhar: '111122223333',
          area: 'Rajiwada',
        },
      },
      { upsert: true, new: true }
    );
    console.log('Upserted supervisor: supervisor@ratnagiri.gov.in / Admin@123');

    // ─── Upsert workers (keyed by email, never overwrites existing) ───
    const workerPassword = await bcrypt.hash('Worker@123', salt);
    const workerData = [
      { name: 'Ramesh Patil', area: 'Rajiwada', aadhar: '444455556666' },
      { name: 'Suresh Kamble', area: 'Mirjole', aadhar: '777788889999' },
      { name: 'Vijay Deshmukh', area: 'Mandvi', aadhar: '121234345656' },
      { name: 'Mahesh Sawant', area: 'Udyam Nagar', aadhar: '787890901212' },
      { name: 'Anil Jadhav', area: 'Maruti Mandir', aadhar: '343456567878' },
    ];
    for (let i = 0; i < workerData.length; i++) {
      await User.findOneAndUpdate(
        { email: `worker${i + 1}@ratnagiri.gov.in` },
        {
          $setOnInsert: {
            name: workerData[i].name,
            password: workerPassword,
            role: 'worker',
            phone: `98765432${10 + i + 1}`,
            aadhar: workerData[i].aadhar,
            area: workerData[i].area,
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log('Upserted workers: worker[1-5]@ratnagiri.gov.in / Worker@123');

    // ─── Upsert hospitals (keyed by name + area) ───
    const hospitals = [
      {
        name: 'Ratnagiri Civil Hospital',
        area: 'Rajiwada',
        totalBeds: 250,
        availableBeds: 42,
        doctors: 34,
        contact: '02352-222333',
        specializations: ['General Medicine', 'Surgery', 'Pediatrics', 'Orthopedics', 'Gynecology'],
        status: 'active',
      },
      {
        name: 'Shree Clinic & Hospital',
        area: 'Mirjole',
        totalBeds: 60,
        availableBeds: 18,
        doctors: 12,
        contact: '02352-233444',
        specializations: ['General Medicine', 'Maternity', 'Pediatrics'],
        status: 'active',
      },
      {
        name: 'Mandvi Urban Health Centre',
        area: 'Mandvi',
        totalBeds: 40,
        availableBeds: 15,
        doctors: 8,
        contact: '02352-244555',
        specializations: ['General Medicine', 'Dental', 'Eye Care'],
        status: 'active',
      },
      {
        name: 'Nachane Municipal Hospital',
        area: 'Nachane',
        totalBeds: 80,
        availableBeds: 25,
        doctors: 16,
        contact: '02352-255666',
        specializations: ['General Medicine', 'Surgery', 'ENT', 'Dermatology'],
        status: 'active',
      },
      {
        name: 'Udyam Nagar Health Post',
        area: 'Udyam Nagar',
        totalBeds: 20,
        availableBeds: 8,
        doctors: 4,
        contact: '02352-266777',
        specializations: ['General Medicine', 'First Aid'],
        status: 'active',
      },
      {
        name: 'Karbude Community Hospital',
        area: 'Karbude',
        totalBeds: 45,
        availableBeds: 12,
        doctors: 9,
        contact: '02352-277888',
        specializations: ['General Medicine', 'Maternity', 'Orthopedics'],
        status: 'active',
      },
      {
        name: 'Maruti Mandir Polyclinic',
        area: 'Maruti Mandir',
        totalBeds: 30,
        availableBeds: 10,
        doctors: 7,
        contact: '02352-288999',
        specializations: ['General Medicine', 'Pediatrics', 'Dental'],
        status: 'active',
      },
      {
        name: 'Bhatye Cottage Hospital',
        area: 'Bhatye',
        totalBeds: 35,
        availableBeds: 14,
        doctors: 6,
        contact: '02352-299000',
        specializations: ['General Medicine', 'Emergency'],
        status: 'active',
      },
    ];
    for (const h of hospitals) {
      await Hospital.findOneAndUpdate(
        { name: h.name, area: h.area },
        { $setOnInsert: h },
        { upsert: true, new: true }
      );
    }
    console.log(`Upserted ${hospitals.length} hospitals.`);

    // ─── Upsert schools (keyed by name + area) ───
    const schools = [
      {
        name: 'Ratnagiri Municipal School No. 1',
        area: 'Rajiwada',
        type: 'primary',
        totalStudents: 340,
        totalTeachers: 15,
        contact: '02352-211100',
        facilities: ['Library', 'Playground', 'Computer Lab', 'Mid-day Meal'],
        status: 'active',
      },
      {
        name: 'Mirjole Vidya Mandir',
        area: 'Mirjole',
        type: 'secondary',
        totalStudents: 520,
        totalTeachers: 24,
        contact: '02352-211200',
        facilities: ['Library', 'Science Lab', 'Sports Ground', 'Computer Lab'],
        status: 'active',
      },
      {
        name: 'Kothawade Municipal School',
        area: 'Kothawade',
        type: 'primary',
        totalStudents: 210,
        totalTeachers: 10,
        contact: '02352-211300',
        facilities: ['Library', 'Playground', 'Mid-day Meal'],
        status: 'active',
      },
      {
        name: 'Mandvi Higher Secondary School',
        area: 'Mandvi',
        type: 'higher-secondary',
        totalStudents: 680,
        totalTeachers: 38,
        contact: '02352-211400',
        facilities: ['Library', 'Science Lab', 'Computer Lab', 'Auditorium', 'Sports Ground'],
        status: 'active',
      },
      {
        name: 'Maruti Mandir Primary School',
        area: 'Maruti Mandir',
        type: 'primary',
        totalStudents: 190,
        totalTeachers: 9,
        contact: '02352-211500',
        facilities: ['Library', 'Playground', 'Mid-day Meal'],
        status: 'active',
      },
      {
        name: 'Nachane Secondary School',
        area: 'Nachane',
        type: 'secondary',
        totalStudents: 410,
        totalTeachers: 20,
        contact: '02352-211600',
        facilities: ['Library', 'Science Lab', 'Computer Lab', 'Sports Ground'],
        status: 'active',
      },
      {
        name: 'Udyam Nagar Municipal School',
        area: 'Udyam Nagar',
        type: 'primary',
        totalStudents: 260,
        totalTeachers: 12,
        contact: '02352-211700',
        facilities: ['Library', 'Playground', 'Computer Lab', 'Mid-day Meal'],
        status: 'active',
      },
      {
        name: 'Zaver Baug High School',
        area: 'Zaver Baug',
        type: 'secondary',
        totalStudents: 380,
        totalTeachers: 18,
        contact: '02352-211800',
        facilities: ['Library', 'Science Lab', 'Sports Ground'],
        status: 'active',
      },
      {
        name: 'Shirke Nagar Primary School',
        area: 'Shirke Nagar',
        type: 'primary',
        totalStudents: 150,
        totalTeachers: 7,
        contact: '02352-211900',
        facilities: ['Library', 'Playground'],
        status: 'active',
      },
      {
        name: 'Bhagoji Keer Higher Secondary',
        area: 'Bhagoji Keer',
        type: 'higher-secondary',
        totalStudents: 590,
        totalTeachers: 32,
        contact: '02352-212000',
        facilities: ['Library', 'Science Lab', 'Computer Lab', 'Auditorium', 'Sports Ground'],
        status: 'active',
      },
    ];
    for (const s of schools) {
      await School.findOneAndUpdate(
        { name: s.name, area: s.area },
        { $setOnInsert: s },
        { upsert: true, new: true }
      );
    }
    console.log(`Upserted ${schools.length} schools.`);

    // ─── Upsert doctors across hospitals ───
    const allHospitals = await Hospital.find();
    const hospitalMap = {};
    allHospitals.forEach(h => { hospitalMap[h.name] = h; });

    const doctorData = [
      // Ratnagiri Civil Hospital — Rajiwada
      { name: 'Dr. Anand Kulkarni', spec: 'General Medicine', qual: 'MBBS, MD', exp: 15, hospital: 'Ratnagiri Civil Hospital', area: 'Rajiwada' },
      { name: 'Dr. Meera Joshi', spec: 'Surgery', qual: 'MBBS, MS', exp: 12, hospital: 'Ratnagiri Civil Hospital', area: 'Rajiwada' },
      { name: 'Dr. Rajesh Patwardhan', spec: 'Pediatrics', qual: 'MBBS, DCH', exp: 18, hospital: 'Ratnagiri Civil Hospital', area: 'Rajiwada' },
      { name: 'Dr. Sunita Deshpande', spec: 'Orthopedics', qual: 'MBBS, MS Ortho', exp: 10, hospital: 'Ratnagiri Civil Hospital', area: 'Rajiwada' },
      { name: 'Dr. Priya Gokhale', spec: 'Gynecology', qual: 'MBBS, DGO', exp: 14, hospital: 'Ratnagiri Civil Hospital', area: 'Rajiwada' },
      // Shree Clinic — Mirjole
      { name: 'Dr. Sanjay Bhosle', spec: 'General Medicine', qual: 'MBBS', exp: 8, hospital: 'Shree Clinic & Hospital', area: 'Mirjole' },
      { name: 'Dr. Kavita Rane', spec: 'Maternity', qual: 'MBBS, DGO', exp: 11, hospital: 'Shree Clinic & Hospital', area: 'Mirjole' },
      { name: 'Dr. Rohit Sawant', spec: 'Pediatrics', qual: 'MBBS, DCH', exp: 6, hospital: 'Shree Clinic & Hospital', area: 'Mirjole' },
      // Mandvi Urban Health Centre
      { name: 'Dr. Amol Pawar', spec: 'General Medicine', qual: 'MBBS', exp: 9, hospital: 'Mandvi Urban Health Centre', area: 'Mandvi' },
      { name: 'Dr. Neha Deshmukh', spec: 'Dental', qual: 'BDS, MDS', exp: 7, hospital: 'Mandvi Urban Health Centre', area: 'Mandvi' },
      { name: 'Dr. Vikram Shet', spec: 'Eye Care', qual: 'MBBS, MS Ophth', exp: 13, hospital: 'Mandvi Urban Health Centre', area: 'Mandvi' },
      // Nachane Municipal Hospital
      { name: 'Dr. Arun Kamat', spec: 'General Medicine', qual: 'MBBS, MD', exp: 20, hospital: 'Nachane Municipal Hospital', area: 'Nachane' },
      { name: 'Dr. Sreedevi Nair', spec: 'Surgery', qual: 'MBBS, MS', exp: 16, hospital: 'Nachane Municipal Hospital', area: 'Nachane' },
      { name: 'Dr. Prakash Kale', spec: 'ENT', qual: 'MBBS, DLO', exp: 11, hospital: 'Nachane Municipal Hospital', area: 'Nachane' },
      { name: 'Dr. Deepa Kini', spec: 'Dermatology', qual: 'MBBS, DVD', exp: 8, hospital: 'Nachane Municipal Hospital', area: 'Nachane' },
      // Udyam Nagar Health Post
      { name: 'Dr. Ramesh Gawde', spec: 'General Medicine', qual: 'MBBS', exp: 5, hospital: 'Udyam Nagar Health Post', area: 'Udyam Nagar' },
      { name: 'Dr. Sheetal More', spec: 'First Aid', qual: 'MBBS', exp: 3, hospital: 'Udyam Nagar Health Post', area: 'Udyam Nagar' },
      // Karbude Community Hospital
      { name: 'Dr. Nilesh Jagtap', spec: 'General Medicine', qual: 'MBBS, MD', exp: 14, hospital: 'Karbude Community Hospital', area: 'Karbude' },
      { name: 'Dr. Pooja Mhatre', spec: 'Maternity', qual: 'MBBS, DGO', exp: 9, hospital: 'Karbude Community Hospital', area: 'Karbude' },
      { name: 'Dr. Ashok Dalvi', spec: 'Orthopedics', qual: 'MBBS, MS Ortho', exp: 17, hospital: 'Karbude Community Hospital', area: 'Karbude' },
      // Maruti Mandir Polyclinic
      { name: 'Dr. Swati Phadke', spec: 'General Medicine', qual: 'MBBS', exp: 7, hospital: 'Maruti Mandir Polyclinic', area: 'Maruti Mandir' },
      { name: 'Dr. Hemant Chavan', spec: 'Pediatrics', qual: 'MBBS, DCH', exp: 10, hospital: 'Maruti Mandir Polyclinic', area: 'Maruti Mandir' },
      { name: 'Dr. Nandini Ghate', spec: 'Dental', qual: 'BDS', exp: 4, hospital: 'Maruti Mandir Polyclinic', area: 'Maruti Mandir' },
      // Bhatye Cottage Hospital
      { name: 'Dr. Manoj Lotlikar', spec: 'General Medicine', qual: 'MBBS', exp: 12, hospital: 'Bhatye Cottage Hospital', area: 'Bhatye' },
      { name: 'Dr. Aparna Tendulkar', spec: 'Emergency', qual: 'MBBS, DEMS', exp: 6, hospital: 'Bhatye Cottage Hospital', area: 'Bhatye' },
    ];

    const defaultSlots = [
      { day: 'Monday', startTime: '09:00', endTime: '13:00' },
      { day: 'Tuesday', startTime: '09:00', endTime: '13:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '13:00' },
      { day: 'Thursday', startTime: '14:00', endTime: '18:00' },
      { day: 'Friday', startTime: '09:00', endTime: '13:00' },
      { day: 'Saturday', startTime: '09:00', endTime: '12:00' },
    ];

    const afternoonSlots = [
      { day: 'Monday', startTime: '14:00', endTime: '18:00' },
      { day: 'Tuesday', startTime: '14:00', endTime: '18:00' },
      { day: 'Wednesday', startTime: '14:00', endTime: '18:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '13:00' },
      { day: 'Friday', startTime: '14:00', endTime: '18:00' },
      { day: 'Saturday', startTime: '10:00', endTime: '13:00' },
    ];

    let doctorCount = 0;
    for (let i = 0; i < doctorData.length; i++) {
      const d = doctorData[i];
      const hosp = hospitalMap[d.hospital];
      if (!hosp) continue;

      await Doctor.findOneAndUpdate(
        { name: d.name, hospital: hosp._id },
        {
          $setOnInsert: {
            name: d.name,
            specialization: d.spec,
            qualification: d.qual,
            experience: d.exp,
            hospital: hosp._id,
            area: d.area,
            availableSlots: i % 2 === 0 ? defaultSlots : afternoonSlots,
            slotDuration: 30,
            rating: 0,
            totalReviews: 0,
            status: 'active',
          },
        },
        { upsert: true, new: true }
      );
      doctorCount++;
    }
    console.log(`Upserted ${doctorCount} doctors.`);

    console.log('Seeding complete. Existing citizen data was preserved.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
