import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { AREAS } from '../../utils/areas';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, Pencil, Trash2, X, MapPin, Mail, Phone, Shield,
} from 'lucide-react';

export default function SupervisorWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', aadhar: '', area: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchWorkers(); }, []);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/workers');
      setWorkers(res.data);
    } catch (err) {
      console.error('Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', phone: '', aadhar: '', area: '' });
    setEditingId(null);
    setShowModal(false);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (w) => {
    setForm({
      name: w.name,
      email: w.email,
      password: '',
      phone: w.phone || '',
      aadhar: w.aadhar || '',
      area: w.area || '',
    });
    setEditingId(w._id);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.area || !form.aadhar) {
      toast.error('Name, email, area, and aadhar are required.');
      return;
    }
    if (!editingId && !form.password) {
      toast.error('Password is required for new workers.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editingId) {
        await api.patch(`/workers/${editingId}`, payload);
        toast.success('Worker updated successfully.');
      } else {
        await api.post('/workers', payload);
        toast.success('Worker created successfully.');
      }
      resetForm();
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove worker "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/workers/${id}`);
      toast.success('Worker removed.');
      fetchWorkers();
    } catch (err) {
      toast.error('Failed to remove worker.');
    }
  };

  if (loading) {
    return (
      <Layout title="Manage Workers">
        <div className="loading"><div className="spinner"></div>Loading workers...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Workers">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Manage Workers</h2>
          <p>Add, modify, or remove municipal field workers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <UserPlus size={16} /> Add Worker
        </button>
      </div>

      {/* Workers Grid */}
      <div className="grid-2">
        {workers.map((w) => (
          <div key={w._id} className="facility-card">
            <div className="facility-card-header">
              <div className="facility-card-name">
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '700', fontSize: '13px', marginRight: '12px', flexShrink: 0,
                }}>
                  {w.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{w.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{w.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(w)}>
                  <Pencil size={13} />
                </button>
                <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(w._id, w.name)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="facility-card-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="facility-stat">
                <div className="facility-stat-value" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <MapPin size={13} /> {w.area || '—'}
                </div>
                <div className="facility-stat-label">Area</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Phone size={13} /> {w.phone || '—'}
                </div>
                <div className="facility-stat-label">Phone</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Shield size={13} /> {'****' + (w.aadhar?.slice(-4) || '****')}
                </div>
                <div className="facility-stat-label">Aadhar</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {workers.length === 0 && (
        <div className="empty-state">
          <Users />
          <h3>No workers found</h3>
          <p>Click "Add Worker" to create a new field worker account.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Worker' : 'Add Worker'}</h3>
              <button className="modal-close" onClick={resetForm}><X size={18} /></button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Worker's full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="worker@ratnagiri.gov.in" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{editingId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? '••••••••' : 'Set password'} />
              </div>
              <div className="form-group">
                <label className="form-label">Area *</label>
                <select className="form-select" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                  <option value="">Select area</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Aadhar Number *</label>
                <input type="text" className="form-input" maxLength={12} value={form.aadhar} onChange={(e) => setForm({ ...form, aadhar: e.target.value.replace(/\D/g, '') })} placeholder="12-digit Aadhar number" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Worker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
