import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Building2, UserCog, CalendarCheck, CheckCircle2, Clock, Stethoscope } from 'lucide-react';

export default function HospitalAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      user.hospitalId ? api.get(`/hospitals/${user.hospitalId}`) : Promise.resolve({ data: null }),
      api.get('/doctors'),
      api.get('/appointments'),
    ])
      .then(([hRes, dRes, aRes]) => {
        setHospital(hRes.data);
        setDoctors(dRes.data);
        setAppointments(aRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.hospitalId]);

  const pending = appointments.filter((a) => a.status === 'pending').length;
  const accepted = appointments.filter((a) => a.status === 'accepted').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;

  if (loading) {
    return (
      <Layout title="Hospital Dashboard">
        <div className="loading"><div className="spinner"></div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Hospital Dashboard">
      <div className="page-header">
        <h2>{hospital?.name || 'Hospital Admin Portal'}</h2>
        <p>{hospital?.area} · {hospital?.contact}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/hospital-admin/doctors')}>
          <div className="card-icon info"><UserCog size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{doctors.length}</div>
            <div className="stat-card-label">Doctors</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/hospital-admin/appointments')}>
          <div className="card-icon warning"><Clock size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{pending}</div>
            <div className="stat-card-label">Pending Appointments</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/hospital-admin/appointments')}>
          <div className="card-icon success"><CalendarCheck size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{accepted}</div>
            <div className="stat-card-label">Accepted</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon accent"><CheckCircle2 size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{completed}</div>
            <div className="stat-card-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Hospital Info */}
      {hospital && (
        <div className="chart-card" style={{ marginBottom: '24px' }}>
          <div className="chart-card-title"><Building2 size={16} /> Hospital Overview</div>
          <div className="grid-4" style={{ paddingTop: '12px' }}>
            <div className="facility-stat">
              <div className="facility-stat-value">{hospital.totalBeds}</div>
              <div className="facility-stat-label">Total Beds</div>
            </div>
            <div className="facility-stat">
              <div className="facility-stat-value" style={{ color: hospital.availableBeds > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {hospital.availableBeds}
              </div>
              <div className="facility-stat-label">Available Beds</div>
            </div>
            <div className="facility-stat">
              <div className="facility-stat-value">{hospital.doctors}</div>
              <div className="facility-stat-label">Registered Doctors</div>
            </div>
            <div className="facility-stat">
              <div className="facility-stat-value">
                <span className={`badge badge-${hospital.status}`}>{hospital.status}</span>
              </div>
              <div className="facility-stat-label">Status</div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Appointments Preview */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Pending Approvals</h2>
          <p>Appointments awaiting your acceptance</p>
        </div>
        {pending > 0 && (
          <button className="btn btn-sm btn-primary" onClick={() => navigate('/hospital-admin/appointments')}>
            View All ({pending})
          </button>
        )}
      </div>
      <div className="complaint-list">
        {appointments.filter((a) => a.status === 'pending').slice(0, 5).map((a) => (
          <div key={a._id} className="complaint-item">
            <div className="complaint-item-header">
              <span className="complaint-item-title">{a.patient?.name}</span>
              <span className="badge badge-pending">pending</span>
            </div>
            <div className="complaint-item-description">
              <Stethoscope size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Dr. {a.doctor?.name} — {a.doctor?.specialization}
            </div>
            <div className="complaint-item-meta">
              <span>{new Date(a.date).toLocaleDateString()}</span>
              <span>{a.timeSlot}</span>
            </div>
          </div>
        ))}
        {pending === 0 && (
          <div className="empty-state">
            <CheckCircle2 />
            <h3>All clear!</h3>
            <p>No pending appointments at the moment.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
