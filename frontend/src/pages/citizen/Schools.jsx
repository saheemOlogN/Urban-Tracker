import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { getNearestFacilities } from '../../utils/areas';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { GraduationCap, MapPin, Phone, Users, PieChart as PieIcon, BarChart3, Navigation } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b'];

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  if (loading) {
    return (
      <Layout title="School Status">
        <div className="loading">
          <div className="spinner"></div>Loading schools...
        </div>
      </Layout>
    );
  }

  // Analytics Data
  const totalStudents = schools.reduce((sum, s) => sum + s.totalStudents, 0);
  const totalTeachers = schools.reduce((sum, s) => sum + s.totalTeachers, 0);

  const schoolTypeData = [
    { name: 'Primary', value: schools.filter(s => s.type === 'primary').length },
    { name: 'Secondary', value: schools.filter(s => s.type === 'secondary').length },
    { name: 'Higher Secondary', value: schools.filter(s => s.type === 'higher-secondary').length },
  ];

  const strengthData = schools.map(s => ({
    name: s.name.split(' ').slice(-2).join(' '), // Shorten name
    students: s.totalStudents,
    teachers: s.totalTeachers
  })).sort((a, b) => b.students - a.students).slice(0, 5);

  const nearestSchools = getNearestFacilities(schools, user?.area);

  return (
    <Layout title="Education Hub">
      <div className="page-header">
        <h2>Municipality School Analytics</h2>
        <p>Insights into class strength and educational infrastructure in Ratnagiri Urban</p>
      </div>

      {/* Analytics Section */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieIcon size={18} /> School Type Distribution
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={schoolTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {schoolTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3a', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} /> Top 5 Schools by Strength
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strengthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3a', borderRadius: '8px' }}
                />
                <Bar dataKey="students" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="card-icon info"><Users size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{totalStudents.toLocaleString()}</div>
            <div className="stat-card-label">Total Urban Students</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon success"><Users size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{totalTeachers.toLocaleString()}</div>
            <div className="stat-card-label">Total Faculty members</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon accent"><GraduationCap size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{Math.round(totalStudents / totalTeachers)}:1</div>
            <div className="stat-card-label">Avg. Student-Teacher Ratio</div>
          </div>
        </div>
      </div>

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Schools Near You</h2>
          <p>Sorted by distance from {user?.area || 'your area'}</p>
        </div>
        <div className="badge badge-info" style={{ gap: '6px' }}>
          <Navigation size={14} /> Smart Sorting Active
        </div>
      </div>

      <div className="grid-2">
        {nearestSchools.map((s, index) => (
          <div key={s._id} className="facility-card" style={index < 2 ? { border: '1px solid var(--accent-muted)', background: 'rgba(99, 102, 241, 0.05)' } : {}}>
            <div className="facility-card-header">
              <div className="facility-card-name">
                {s.name}
                {index === 0 && <span className="badge badge-accent" style={{ marginLeft: '8px', fontSize: '10px' }}>Nearest</span>}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="badge badge-active">{s.type}</span>
                <span className={`badge badge-${s.status}`}>{s.status}</span>
              </div>
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
              <div className="facility-stat">
                <div className="facility-stat-value">
                  {Math.round(s.totalStudents / s.totalTeachers)}:1
                </div>
                <div className="facility-stat-label">Ratio</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value">{s.facilities?.length || 0}</div>
                <div className="facility-stat-label">Facilities</div>
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
              {s.contact && (
                <span style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> {s.contact}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {schools.length === 0 && (
        <div className="empty-state">
          <GraduationCap />
          <h3>No schools found</h3>
          <p>School data will appear here once added by supervisors.</p>
        </div>
      )}
    </Layout>
  );
}
