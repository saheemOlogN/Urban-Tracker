import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, MapPin, Phone, X } from 'lucide-react';

export default function ManageHospital() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user.hospitalId) {
      setLoading(false);
      return;
    }
    api.get(`/hospitals/${user.hospitalId}`)
      .then((res) => {
        setHospital(res.data);
        setEditData({
          totalBeds: res.data.totalBeds,
          availableBeds: res.data.availableBeds,
          contact: res.data.contact || '',
          status: res.data.status,
          specializations: (res.data.specializations || []).join(', '),
        });
      })
      .catch(() => toast.error('Failed to load hospital details.'))
      .finally(() => setLoading(false));
  }, [user.hospitalId]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const payload = {
        totalBeds: Number(editData.totalBeds),
        availableBeds: Number(editData.availableBeds),
        contact: editData.contact,
        status: editData.status,
        specializations: editData.specializations.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const res = await api.patch(`/hospitals/${user.hospitalId}`, payload);
      setHospital(res.data.hospital);
      toast.success('Hospital updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="My Hospital">
        <div className="loading"><div className="spinner"></div>Loading...</div>
      </Layout>
    );
  }

  if (!hospital) {
    return (
      <Layout title="My Hospital">
        <div className="empty-state">
          <Building2 />
          <h3>No hospital linked</h3>
          <p>Contact the supervisor to link a hospital to your account.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Hospital">
      <div className="page-header">
        <h2>{hospital.name}</h2>
        <p>
          <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
          {hospital.area}
          {hospital.contact && (
            <span style={{ marginLeft: '12px' }}>
              <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
              {hospital.contact}
            </span>
          )}
        </p>
      </div>

      <div className="chart-card" style={{ maxWidth: '600px' }}>
        <div className="chart-card-title"><Building2 size={16} /> Update Hospital Details</div>

        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label className="form-label">Total Beds</label>
            <input type="number" className="form-input" value={editData.totalBeds}
              onChange={(e) => setEditData({ ...editData, totalBeds: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Available Beds</label>
            <input type="number" className="form-input" value={editData.availableBeds}
              onChange={(e) => setEditData({ ...editData, availableBeds: e.target.value })} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Contact Number</label>
            <input type="text" className="form-input" value={editData.contact}
              onChange={(e) => setEditData({ ...editData, contact: e.target.value })}
              placeholder="e.g. +91-02352-222111" />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Specializations (comma-separated)</label>
          <input type="text" className="form-input" value={editData.specializations}
            onChange={(e) => setEditData({ ...editData, specializations: e.target.value })}
            placeholder="e.g. Cardiology, Neurology, Orthopedics" />
        </div>

        <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Current Specializations */}
      {hospital.specializations?.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>Current Specializations</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {hospital.specializations.map((s) => (
              <span key={s} className="facility-tag">{s}</span>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
