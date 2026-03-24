import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { GraduationCap, MapPin, Phone, X, Pencil } from 'lucide-react';

export default function SupervisorSchools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await api.get('/schools');
      setSchools(res.data);
    } catch (err) {
      console.error('Failed to fetch schools');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (s) => {
    setEditData({
      totalStudents: s.totalStudents,
      totalTeachers: s.totalTeachers,
      contact: s.contact || '',
      status: s.status,
    });
    setEditModal(s._id);
  };

  const handleUpdate = async () => {
    try {
      await api.patch(`/schools/${editModal}`, {
        totalStudents: Number(editData.totalStudents),
        totalTeachers: Number(editData.totalTeachers),
        contact: editData.contact,
        status: editData.status,
      });
      toast.success('School updated successfully.');
      setEditModal(null);
      fetchSchools();
    } catch (err) {
      toast.error('Failed to update school.');
    }
  };

  if (loading) {
    return (
      <Layout title="Manage Schools">
        <div className="loading"><div className="spinner"></div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Schools">
      <div className="page-header">
        <h2>Manage Schools</h2>
        <p>Update school data for Ratnagiri municipality</p>
      </div>

      <div className="grid-2">
        {schools.map((s) => (
          <div key={s._id} className="facility-card">
            <div className="facility-card-header">
              <div className="facility-card-name">{s.name}</div>
              <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>
                <Pencil size={14} /> Edit
              </button>
            </div>

            <div className="facility-card-stats">
              <div className="facility-stat">
                <div className="facility-stat-value">{s.totalStudents}</div>
                <div className="facility-stat-label">Students</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value">{s.totalTeachers}</div>
                <div className="facility-stat-label">Teachers</div>
              </div>
            </div>

            {s.facilities && s.facilities.length > 0 && (
              <div className="facility-card-tags">
                {s.facilities.map((f) => (
                  <span key={f} className="facility-tag">{f}</span>
                ))}
              </div>
            )}

            <div className="facility-card-area">
              <MapPin size={14} /> {s.area}
              <span style={{ marginLeft: '8px' }} className={`badge badge-${s.type === 'higher-secondary' ? 'active' : 'assigned'}`}>
                {s.type}
              </span>
              {s.contact && (
                <span style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> {s.contact}
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
              <h3>Update School</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total Students</label>
                <input type="number" className="form-input" value={editData.totalStudents} onChange={(e) => setEditData({ ...editData, totalStudents: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Teachers</label>
                <input type="number" className="form-input" value={editData.totalTeachers} onChange={(e) => setEditData({ ...editData, totalTeachers: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact</label>
                <input type="text" className="form-input" value={editData.contact} onChange={(e) => setEditData({ ...editData, contact: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
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
