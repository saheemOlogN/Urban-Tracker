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
import { Building2, MapPin, Phone, PieChart as PieIcon, Activity, Navigation } from 'lucide-react';

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#6366f1'];

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  if (loading) {
    return (
      <Layout title="Hospital Status">
        <div className="loading">
          <div className="spinner"></div>Loading hospitals...
        </div>
      </Layout>
    );
  }

  // Analytics Data
  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const totalAvailable = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
  const totalOccupied = totalBeds - totalAvailable;

  const bedStatusData = [
    { name: 'Available Beds', value: totalAvailable },
    { name: 'Occupied Beds', value: totalOccupied },
  ];

  const areaWiseData = hospitals.map(h => ({
    name: h.area,
    available: h.availableBeds,
    total: h.totalBeds
  }));

  const nearestHospitals = getNearestFacilities(hospitals, user?.area);

  return (
    <Layout title="Hospital Hub">
      <div className="page-header">
        <h2>Hospital Analytics & Status</h2>
        <p>Real-time data visualization of medical facilities in Ratnagiri Urban</p>
      </div>

      {/* Analytics Section */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieIcon size={18} /> Bed Availability Overview
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bedStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bedStatusData.map((entry, index) => (
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
              <Activity size={18} /> Area-wise Availability
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaWiseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3a', borderRadius: '8px' }}
                />
                <Bar dataKey="available" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hospital List sorted by proximity */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Facilities Near You</h2>
          <p>Showing hospitals sorted by distance from {user?.area || 'your area'}</p>
        </div>
        <div className="badge badge-info" style={{ gap: '6px' }}>
          <Navigation size={14} /> Smart Sorting Active
        </div>
      </div>

      <div className="grid-2">
        {nearestHospitals.map((h, index) => (
          <div key={h._id} className="facility-card" style={index < 2 ? { border: '1px solid var(--accent-muted)', background: 'rgba(99, 102, 241, 0.05)' } : {}}>
            <div className="facility-card-header">
              <div className="facility-card-name">
                {h.name}
                {index === 0 && <span className="badge badge-accent" style={{ marginLeft: '8px', fontSize: '10px' }}>Nearest</span>}
              </div>
              <span className={`badge badge-${h.status}`}>{h.status}</span>
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
                <div className="facility-stat-label">Available Beds</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value">{h.doctors}</div>
                <div className="facility-stat-label">Doctors</div>
              </div>
              <div className="facility-stat">
                <div className="facility-stat-value">
                  {Math.round((h.availableBeds / h.totalBeds) * 100)}%
                </div>
                <div className="facility-stat-label">Availability</div>
              </div>
            </div>

            {h.specializations && h.specializations.length > 0 && (
              <div className="facility-card-tags">
                {h.specializations.map((s) => (
                  <span key={s} className="facility-tag">{s}</span>
                ))}
              </div>
            )}

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

      {hospitals.length === 0 && (
        <div className="empty-state">
          <Building2 />
          <h3>No hospitals found</h3>
          <p>Hospital data will appear here once added by supervisors.</p>
        </div>
      )}
    </Layout>
  );
}
