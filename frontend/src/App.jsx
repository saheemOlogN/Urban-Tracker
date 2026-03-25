import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CitizenDashboard from './pages/citizen/Dashboard';
import FileComplaint from './pages/citizen/FileComplaint';
import Hospitals from './pages/citizen/Hospitals';
import Schools from './pages/citizen/Schools';
import Quotations from './pages/citizen/Quotations';
import ReviewComplaints from './pages/citizen/ReviewComplaints';
import Predictions from './pages/citizen/Predictions';
import BookAppointment from './pages/citizen/BookAppointment';
import TopServants from './pages/citizen/TopServants';
import WorkerDashboard from './pages/worker/Dashboard';
import WorkerComplaints from './pages/worker/Complaints';
import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorComplaints from './pages/supervisor/Complaints';
import SupervisorHospitals from './pages/supervisor/Hospitals';
import SupervisorSchools from './pages/supervisor/Schools';
import SupervisorWorkers from './pages/supervisor/Workers';
import HospitalAdminDashboard from './pages/hospital-admin/Dashboard';
import ManageDoctors from './pages/hospital-admin/ManageDoctors';
import ManageAppointments from './pages/hospital-admin/ManageAppointments';
import ManageHospital from './pages/hospital-admin/ManageHospital';
import SchoolAdminDashboard from './pages/school-admin/Dashboard';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'citizen') return <Navigate to="/citizen" />;
  if (user.role === 'worker') return <Navigate to="/worker" />;
  if (user.role === 'supervisor') return <Navigate to="/supervisor" />;
  if (user.role === 'hospital_admin') return <Navigate to="/hospital-admin" />;
  if (user.role === 'school_admin') return <Navigate to="/school-admin" />;
  return <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Citizen Routes */}
      <Route path="/citizen" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
      <Route path="/citizen/file-complaint" element={<ProtectedRoute allowedRoles={['citizen']}><FileComplaint /></ProtectedRoute>} />
      <Route path="/citizen/hospitals" element={<ProtectedRoute allowedRoles={['citizen']}><Hospitals /></ProtectedRoute>} />
      <Route path="/citizen/schools" element={<ProtectedRoute allowedRoles={['citizen']}><Schools /></ProtectedRoute>} />
      <Route path="/citizen/quotations" element={<ProtectedRoute allowedRoles={['citizen']}><Quotations /></ProtectedRoute>} />
      <Route path="/citizen/reviews" element={<ProtectedRoute allowedRoles={['citizen']}><ReviewComplaints /></ProtectedRoute>} />
      <Route path="/citizen/appointments" element={<ProtectedRoute allowedRoles={['citizen']}><BookAppointment /></ProtectedRoute>} />
      <Route path="/citizen/top-servants" element={<ProtectedRoute allowedRoles={['citizen', 'supervisor']}><TopServants /></ProtectedRoute>} />

      {/* Worker Routes */}
      <Route path="/worker" element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
      <Route path="/worker/complaints" element={<ProtectedRoute allowedRoles={['worker']}><WorkerComplaints /></ProtectedRoute>} />

      {/* Supervisor Routes */}
      <Route path="/supervisor" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorDashboard /></ProtectedRoute>} />
      <Route path="/supervisor/complaints" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorComplaints /></ProtectedRoute>} />
      <Route path="/supervisor/hospitals" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorHospitals /></ProtectedRoute>} />
      <Route path="/supervisor/schools" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorSchools /></ProtectedRoute>} />
      <Route path="/supervisor/workers" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorWorkers /></ProtectedRoute>} />
      <Route path="/supervisor/predictions" element={<ProtectedRoute allowedRoles={['supervisor']}><Predictions /></ProtectedRoute>} />

      {/* Hospital Admin Routes */}
      <Route path="/hospital-admin" element={<ProtectedRoute allowedRoles={['hospital_admin']}><HospitalAdminDashboard /></ProtectedRoute>} />
      <Route path="/hospital-admin/doctors" element={<ProtectedRoute allowedRoles={['hospital_admin']}><ManageDoctors /></ProtectedRoute>} />
      <Route path="/hospital-admin/appointments" element={<ProtectedRoute allowedRoles={['hospital_admin']}><ManageAppointments /></ProtectedRoute>} />
      <Route path="/hospital-admin/hospital" element={<ProtectedRoute allowedRoles={['hospital_admin']}><ManageHospital /></ProtectedRoute>} />

      {/* School Admin Routes */}
      <Route path="/school-admin" element={<ProtectedRoute allowedRoles={['school_admin']}><SchoolAdminDashboard /></ProtectedRoute>} />

      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
