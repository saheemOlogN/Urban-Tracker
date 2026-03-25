import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Users, BookOpen, Phone, MapPin } from 'lucide-react';

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user.schoolId) { setLoading(false); return; }
    api.get(`/schools/${user.schoolId}`)
      .then((res) => {
        setSchool(res.data);
        setEditData({
          totalStudents: res.data.totalStudents,
          totalTeachers: res.data.totalTeachers,
          contact: res.data.contact || '',
          status: res.data.status,
        });
      })
      .catch(() => toast.error('Failed to load school details.'))
      .finally(() => setLoading(false));
  }, [user.schoolId]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/schools/${user.schoolId}`, {
        totalStudents: Number(editData.totalStudents),
        totalTeachers: Number(editData.totalTeachers),
        contact: editData.contact,
        status: editData.status,
      });
      setSchool(res.data.school);
      toast.success('School updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="School Dashboard">
        <div className="loading"><div className="spinner"></div>Loading...</div>
      </Layout>
    );
  }

  if (!school) {
    return (
      <Layout title="School Dashboard">
        <div className="empty-state">
          <GraduationCap />
          <h3>No school linked</h3>
          <p>Contact the supervisor to link a school to your account.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="School Dashboard">
      <div className="page-header">
        <h2>{school.name}</h2>
        <p>
          <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
          {school.area} ·{' '}
          <span className={`badge badge-${school.type === 'higher-secondary' ? 'active' : 'assigned'}`}>{school.type}</span>
          {school.contact && <span style={{ marginLeft: '10px' }}><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />{school.contact}</span>}
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="card-icon accent"><Users size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{school.totalStudents}</div>
            <div className="stat-card-label">Total Students</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon info"><BookOpen size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{school.totalTeachers}</div>
            <div className="stat-card-label">Total Teachers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon success"><GraduationCap size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{school.type}</div>
            <div className="stat-card-label">School Type</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-value">
              <span className={`badge badge-${school.status}`}>{school.status}</span>
            </div>
            <div className="stat-card-label">Status</div>
          </div>
        </div>
      </div>

      {/* Facilities */}
      {school.facilities?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>Facilities</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {school.facilities.map((f) => <span key={f} className="facility-tag">{f}</span>)}
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="chart-card" style={{ maxWidth: '560px' }}>
        <div className="chart-card-title"><GraduationCap size={16} /> Update School Details</div>
        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label className="form-label">Total Students</label>
            <input type="number" className="form-input" value={editData.totalStudents}
              onChange={(e) => setEditData({ ...editData, totalStudents: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Total Teachers</label>
            <input type="number" className="form-input" value={editData.totalTeachers}
              onChange={(e) => setEditData({ ...editData, totalTeachers: e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Contact</label>
            <input type="text" className="form-input" value={editData.contact}
              onChange={(e) => setEditData({ ...editData, contact: e.target.value })} />
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
        <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Layout>
  );
}
