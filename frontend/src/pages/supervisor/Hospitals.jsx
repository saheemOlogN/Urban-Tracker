import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Building2, MapPin, Phone, X, Pencil } from 'lucide-react';

export default function SupervisorHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data);
    } catch (err) {
      console.error('Failed to fetch hospitals');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (h) => {
    setEditData({
      totalBeds: h.totalBeds,
      availableBeds: h.availableBeds,
      doctors: h.doctors,
      contact: h.contact || '',
      status: h.status,
    });
    setEditModal(h._id);
  };

  const handleUpdate = async () => {
    try {
      await api.patch(`/hospitals/${editModal}`, {
        totalBeds: Number(editData.totalBeds),
        availableBeds: Number(editData.availableBeds),
        doctors: Number(editData.doctors),
        contact: editData.contact,
        status: editData.status,
      });
      toast.success('Hospital updated successfully.');
      setEditModal(null);
      fetchHospitals();
    } catch (err) {
      toast.error('Failed to update hospital.');
    }
  };

  if (loading) {
    return (
      <Layout title="Manage Hospitals">
        <div className="loading"><div className="spinner"></div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Hospitals">
      <div className="page-header">
        <h2>Manage Hospitals</h2>
        <p>Update hospital data for Ratnagiri</p>
      </div>

      <div className="grid-2">
        {hospitals.map((h) => (
          <div key={h._id} className="facility-card">
            <div className="facility-card-header">
              <div className="facility-card-name">{h.name}</div>
              <button className="btn btn-sm btn-secondary" onClick={() => openEdit(h)}>
                <Pencil size={14} /> Edit
              </button>
            </div>

            <div className="facility-card-stats">
              <div className="facility-stat">
                <div className="facility-stat-value">{h.totalBeds}</div>
                <div className="facility-stat-label">Total Beds</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value" style={{ color: h.availableBeds > 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {h.availableBeds}
                </div>
                <div className="facility-stat-label">Available</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value">{h.doctors}</div>
                <div className="facility-stat-label">Doctors</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value">
                  <span className={`badge badge-${h.status}`}>{h.status}</span>
                </div>
                <div className="facility-stat-label">Status</div>
              </div>
            </div>

            <div className="facility-card-area">
              <MapPin size={14} /> {h.area}
              {h.contact && (
                <span style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> {h.contact}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Hospital</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total Beds</label>
                <input type="number" className="form-input" value={editData.totalBeds} onChange={(e) => setEditData({ ...editData, totalBeds: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Available Beds</label>
                <input type="number" className="form-input" value={editData.availableBeds} onChange={(e) => setEditData({ ...editData, availableBeds: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Doctors</label>
                <input type="number" className="form-input" value={editData.doctors} onChange={(e) => setEditData({ ...editData, doctors: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact</label>
                <input type="text" className="form-input" value={editData.contact} onChange={(e) => setEditData({ ...editData, contact: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
