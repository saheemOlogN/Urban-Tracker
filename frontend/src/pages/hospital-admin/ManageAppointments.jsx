import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CalendarCheck, CheckCircle2, Clock, X, Stethoscope, User } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'warning',
  accepted: 'active',
  completed: 'resolved',
  cancelled: 'inactive',
  booked: 'assigned',
};

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [accepting, setAccepting] = useState(null);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    setAccepting(id);
    try {
      await api.patch(`/appointments/${id}/accept`);
      toast.success('Appointment accepted! Patient will be notified.');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept appointment.');
    } finally {
      setAccepting(null);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.patch(`/appointments/${id}/complete`);
      toast.success('Appointment marked as completed.');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete appointment.');
    }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  if (loading) {
    return (
      <Layout title="Manage Appointments">
        <div className="loading"><div className="spinner"></div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Appointments">
      <div className="page-header">
        <h2>Manage Appointments</h2>
        <p>Review and accept patient appointment requests</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['pending', 'accepted', 'completed', 'cancelled', 'all'].map((s) => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span style={{ marginLeft: '6px', opacity: 0.75 }}>
              ({s === 'all' ? appointments.length : appointments.filter((a) => a.status === s).length})
            </span>
          </button>
        ))}
      </div>

      <div className="complaint-list">
        {filtered.map((a) => (
          <div key={a._id} className="complaint-item">
            <div className="complaint-item-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={15} />
                <span className="complaint-item-title">{a.patient?.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.patient?.email}</span>
              </div>
              <span className={`badge badge-${STATUS_COLORS[a.status] || 'pending'}`}>{a.status}</span>
            </div>

            <div className="complaint-item-description">
              <Stethoscope size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Dr. {a.doctor?.name} — {a.doctor?.specialization}
            </div>

            <div className="complaint-item-meta">
              <span>{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span>🕐 {a.timeSlot}</span>
              {a.patient?.phone && <span>📞 {a.patient.phone}</span>}
            </div>

            {a.status === 'pending' && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-primary"
                  onClick={() => handleAccept(a._id)}
                  disabled={accepting === a._id}>
                  <CalendarCheck size={13} />
                  {accepting === a._id ? 'Accepting...' : 'Accept & Notify Patient'}
                </button>
              </div>
            )}

            {a.status === 'accepted' && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => handleComplete(a._id)}>
                  <CheckCircle2 size={13} /> Mark Completed
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <CalendarCheck />
            <h3>No {filter === 'all' ? '' : filter} appointments</h3>
            <p>{filter === 'pending' ? 'All caught up — no pending requests.' : `No ${filter} appointments found.`}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
