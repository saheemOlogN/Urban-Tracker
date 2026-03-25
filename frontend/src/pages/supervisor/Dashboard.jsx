import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ClipboardList, Building2, GraduationCap, Clock,
  CheckCircle2, AlertCircle, FileText, PieChart as PieIcon,
  BarChart3, IndianRupee, MapPin, TrendingUp, AlertTriangle,
} from 'lucide-react';

const STATUS_COLORS = { pending: '#f59e0b', assigned: '#3b82f6', 'in-progress': '#6366f1', resolved: '#10b981' };

const chartTooltipStyle = {
  backgroundColor: '#151c2c',
  border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#f1f5f9',
};

export default function SupervisorDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/complaints'),
      api.get('/hospitals'),
      api.get('/schools'),
    ])
      .then(([cRes, hRes, sRes]) => {
        setComplaints(cRes.data);
        setHospitals(hRes.data);
        setSchools(sRes.data);
      })
      .catch(() => console.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    totalComplaints: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    assigned: complaints.filter((c) => c.status === 'assigned').length,
    inProgress: complaints.filter((c) => c.status === 'in-progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    hospitals: hospitals.length,
    schools: schools.length,
    totalQuotation: complaints.reduce((sum, c) => sum + (c.quotation?.amount || 0), 0),
    proxyFlagged: complaints.filter((c) => c.proxyFlagged).length,
  };

  const resolutionRate = stats.totalComplaints > 0
    ? Math.round((stats.resolved / stats.totalComplaints) * 100) : 0;

  const statusData = [
    { name: 'Pending', value: stats.pending, color: STATUS_COLORS.pending },
    { name: 'Assigned', value: stats.assigned, color: STATUS_COLORS.assigned },
    { name: 'In Progress', value: stats.inProgress, color: STATUS_COLORS['in-progress'] },
    { name: 'Resolved', value: stats.resolved, color: STATUS_COLORS.resolved },
  ].filter(d => d.value > 0);

  const areaMap = {};
  complaints.forEach((c) => {
    const area = c.location?.area || 'Unknown';
    if (!areaMap[area]) areaMap[area] = { road: 0, garbage: 0, water: 0, sanitation: 0 };
    areaMap[area][c.type] = (areaMap[area][c.type] || 0) + 1;
  });
  const areaData = Object.entries(areaMap)
    .map(([name, counts]) => ({ name, ...counts, total: Object.values(counts).reduce((s, v) => s + v, 0) }))
    .sort((a, b) => b.total - a.total);

  if (loading) {
    return (
      <Layout title="Supervisor Dashboard">
        <div className="loading"><div className="spinner"></div>Loading command centre...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Supervisor Dashboard">
      <div className="page-header">
        <h2>Municipal Command Centre</h2>
        <p>Real-time analytics and operational overview for Ratnagiri</p>
      </div>

      {/* Clickable Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/supervisor/complaints')}>
          <div className="card-icon accent"><FileText size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.totalComplaints}</div>
            <div className="stat-card-label">Total Complaints</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/supervisor/complaints?filter=pending')}>
          <div className="card-icon warning"><Clock size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.pending}</div>
            <div className="stat-card-label">Unassigned</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/supervisor/complaints?filter=assigned')}>
          <div className="card-icon info"><ClipboardList size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.assigned}</div>
            <div className="stat-card-label">Assigned</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/supervisor/complaints?filter=in-progress')}>
          <div className="card-icon accent"><AlertCircle size={20} style={{ color: 'var(--accent)' }} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.inProgress}</div>
            <div className="stat-card-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/supervisor/complaints?filter=resolved')}>
          <div className="card-icon success"><CheckCircle2 size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.resolved}</div>
            <div className="stat-card-label">Resolved</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        <div className="chart-card">
          <div className="chart-card-title"><PieIcon size={16} /> Complaint Status Distribution</div>
          <div style={{ height: '280px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {statusData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="loading" style={{ height: '100%' }}>No complaint data yet</div>
            )}
          </div>
          {statusData.length > 0 && (
            <div style={{ position: 'relative', marginTop: '-180px', textAlign: 'center', pointerEvents: 'none', marginBottom: '120px' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>{resolutionRate}%</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resolved</div>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-title"><BarChart3 size={16} /> Area-wise Complaint Volume</div>
          <div style={{ height: '280px' }}>
            {areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tick={{ fill: '#64748b' }} angle={-35} textAnchor="end" height={60} />
                  <YAxis stroke="#64748b" fontSize={11} tick={{ fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="road" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Road" stackId="a" />
                  <Bar dataKey="garbage" fill="#ef4444" radius={[4, 4, 0, 0]} name="Garbage" stackId="a" />
                  <Bar dataKey="water" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Water" stackId="a" />
                  <Bar dataKey="sanitation" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Sanitation" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="loading" style={{ height: '100%' }}>No area data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Infrastructure + Expenditure */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="card-icon info"><Building2 size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.hospitals}</div>
            <div className="stat-card-label">Hospitals</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon accent"><GraduationCap size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.schools}</div>
            <div className="stat-card-label">Schools</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon warning"><IndianRupee size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">₹{stats.totalQuotation.toLocaleString()}</div>
            <div className="stat-card-label">Total Expenditure</div>
          </div>
        </div>
        {stats.proxyFlagged > 0 && (
          <div className="stat-card" style={{ borderColor: 'var(--danger)' }}>
            <div className="card-icon danger"><AlertTriangle size={20} /></div>
            <div className="stat-card-content">
              <div className="stat-card-value">{stats.proxyFlagged}</div>
              <div className="stat-card-label">Proxy Flagged</div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Complaints (clickable) */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Pending Assignments</h2>
          <p>Complaints awaiting worker assignment</p>
        </div>
        {stats.pending > 0 && (
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/supervisor/complaints?filter=pending')}>
            View All ({stats.pending})
          </button>
        )}
      </div>
      <div className="complaint-list">
        {complaints
          .filter((c) => c.status === 'pending')
          .slice(0, 5)
          .map((c) => (
            <div key={c._id} className="complaint-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/supervisor/complaints?highlight=${c._id}`)}>
              <div className="complaint-item-header">
                <span className="complaint-item-title">{c.title}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`badge badge-${c.type}`}>{c.type}</span>
                  <span className="badge badge-pending">pending</span>
                </div>
              </div>
              <div className="complaint-item-description">{c.description}</div>
              <div className="complaint-item-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {c.location?.area}</span>
                <span>By: {c.filedBy?.name || 'Unknown'}</span>
                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        {stats.pending === 0 && (
          <div className="empty-state">
            <CheckCircle2 />
            <h3>All caught up</h3>
            <p>No pending complaints at the moment.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
