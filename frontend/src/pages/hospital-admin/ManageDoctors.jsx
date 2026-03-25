import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { UserCog, Plus, Pencil, Trash2, X, Clock, ChevronDown } from 'lucide-react';

const AREAS = [
  'Rajiwada', 'Mirjole', 'Kothawade', 'Mandvi', 'Nachane',
  'Bhatye', 'Maruti Mandir', 'Udyam Nagar', 'Zaver Baug',
  'Teli Aali', 'Karbude', 'Shirke Nagar', 'Fishtail', 'Bhagoji Keer',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const emptyForm = {
  name: '', specialization: '', qualification: '', experience: '',
  area: 'Rajiwada', slotDuration: 30,
  availableSlots: [],
};

export default function ManageDoctors() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      toast.error('Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (doc) => {
    setForm({
      name: doc.name,
      specialization: doc.specialization,
      qualification: doc.qualification,
      experience: doc.experience,
      area: doc.area,
      slotDuration: doc.slotDuration || 30,
      availableSlots: doc.availableSlots || [],
    });
    setEditId(doc._id);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.specialization || !form.qualification || !form.experience || !form.area) {
      toast.error('Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await api.patch(`/doctors/${editId}`, form);
        toast.success('Doctor updated successfully.');
      } else {
        await api.post('/doctors', form);
        toast.success('Doctor added successfully.');
      }
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/doctors/${id}`);
      toast.success('Doctor removed.');
      setDeleteConfirm(null);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove doctor.');
    }
  };

  const addSlot = () => {
    setForm((f) => ({
      ...f,
      availableSlots: [...f.availableSlots, { day: 'Monday', startTime: '09:00', endTime: '13:00' }],
    }));
  };

  const updateSlot = (idx, key, val) => {
    const slots = [...form.availableSlots];
    slots[idx] = { ...slots[idx], [key]: val };
    setForm((f) => ({ ...f, availableSlots: slots }));
  };

  const removeSlot = (idx) => {
    setForm((f) => ({ ...f, availableSlots: f.availableSlots.filter((_, i) => i !== idx) }));
  };

  if (loading) {
    return (
      <Layout title="Manage Doctors">
        <div className="loading"><div className="spinner"></div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Doctors">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Manage Doctors</h2>
          <p>Add, edit or remove doctors from your hospital</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Doctor
        </button>
      </div>

      <div className="grid-2">
        {doctors.map((doc) => (
          <div key={doc._id} className="facility-card">
            <div className="facility-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="card-icon info" style={{ width: 36, height: 36 }}><UserCog size={16} /></div>
                <div>
                  <div className="facility-card-name">Dr. {doc.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{doc.specialization}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(doc)}>
                  <Pencil size={13} />
                </button>
                <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none' }}
                  onClick={() => setDeleteConfirm(doc._id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="facility-card-stats">
              <div className="facility-stat">
                <div className="facility-stat-value">{doc.experience}y</div>
                <div className="facility-stat-label">Experience</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value">{doc.availableSlots?.length || 0}</div>
                <div className="facility-stat-label">Schedule Days</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value">{doc.slotDuration}m</div>
                <div className="facility-stat-label">Slot Duration</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value">
                  <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                </div>
                <div className="facility-stat-label">Status</div>
              </div>
            </div>
            <div className="facility-card-area">
              {doc.qualification} · {doc.area}
            </div>
          </div>
        ))}
      </div>

      {doctors.length === 0 && (
        <div className="empty-state">
          <UserCog />
          <h3>No doctors yet</h3>
          <p>Add your first doctor to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Doctor' : 'Add New Doctor'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Specialization *</label>
                <input className="form-input" value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Cardiology" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Qualification *</label>
                <input className="form-input" value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. MBBS, MD" />
              </div>
              <div className="form-group">
                <label className="form-label">Experience (years) *</label>
                <input type="number" className="form-input" value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })} min="0" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Area</label>
                <select className="form-select" value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Slot Duration (min)</label>
                <select className="form-select" value={form.slotDuration}
                  onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })}>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>

            {/* Availability Slots */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Weekly Availability
                </label>
                <button className="btn btn-sm btn-secondary" type="button" onClick={addSlot}>
                  <Plus size={13} /> Add Day
                </button>
              </div>
              {form.availableSlots.map((slot, idx) => (
                <div key={idx} className="form-row" style={{ gap: '8px', marginBottom: '8px' }}>
                  <select className="form-select" value={slot.day}
                    onChange={(e) => updateSlot(idx, 'day', e.target.value)}>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="time" className="form-input" value={slot.startTime}
                    onChange={(e) => updateSlot(idx, 'startTime', e.target.value)} />
                  <input type="time" className="form-input" value={slot.endTime}
                    onChange={(e) => updateSlot(idx, 'endTime', e.target.value)} />
                  <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', minWidth: '32px' }}
                    onClick={() => removeSlot(idx)}>
                    <X size={13} />
                  </button>
                </div>
              ))}
              {form.availableSlots.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No schedule set. Click "Add Day" to define availability.</p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editId ? 'Save Changes' : 'Add Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remove Doctor</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Are you sure you want to remove this doctor? All their future appointments will remain unchanged.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn" style={{ background: '#ef4444', color: 'white' }}
                onClick={() => handleDelete(deleteConfirm)}>
                Remove Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
