import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Receipt, IndianRupee, TrendingUp, Filter, Search,
  ArrowUpDown, MapPin, Calendar, ChevronDown, ChevronUp, Image as ImageIcon,
} from 'lucide-react';

const TYPE_COLORS = { road: '#f59e0b', garbage: '#ef4444', water: '#3b82f6', sanitation: '#8b5cf6' };
const CHART_TOOLTIP = {
  backgroundColor: '#151c2c', border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: '10px', fontSize: '12px', color: '#f1f5f9',
};

export default function Quotations() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedExpenses, setExpandedExpenses] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/complaints/analytics/quotations');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to fetch quotation analytics');
    } finally { setLoading(false); }
  };

  const totalSpent = useMemo(() => complaints.reduce((sum, c) => sum + (c.quotation?.amount || 0), 0), [complaints]);
  const avgPerComplaint = useMemo(() => complaints.length > 0 ? totalSpent / complaints.length : 0, [totalSpent, complaints]);
  const highestSingle = useMemo(() => Math.max(...complaints.map(c => c.quotation?.amount || 0), 0), [complaints]);

  // Calculate expected (average) costs per type
  const typeAverages = useMemo(() => {
    const sums = {};
    const counts = {};
    complaints.forEach(c => {
      const amt = c.quotation?.amount || 0;
      sums[c.type] = (sums[c.type] || 0) + amt;
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    const avgs = {};
    Object.keys(sums).forEach(type => {
      avgs[type] = sums[type] / counts[type];
    });
    return avgs;
  }, [complaints]);

  // Areas list
  const areas = useMemo(() => [...new Set(complaints.map(c => c.location?.area).filter(Boolean))], [complaints]);

  // Charts data
  const areaData = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const area = c.location?.area || 'Unknown';
      map[area] = (map[area] || 0) + (c.quotation?.amount || 0);
    });
    return Object.entries(map).map(([name, amount]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, amount, fullName: name }))
      .sort((a, b) => b.amount - a.amount);
  }, [complaints]);

  const typeData = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      map[c.type] = (map[c.type] || 0) + (c.quotation?.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const monthlyData = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + (c.quotation?.amount || 0);
    });
    return Object.entries(map).sort().map(([month, amount]) => ({ month, amount }));
  }, [complaints]);

  // Filtered + sorted data
  const filtered = useMemo(() => {
    let data = [...complaints];
    if (filterType !== 'all') data = data.filter(c => c.type === filterType);
    if (filterArea !== 'all') data = data.filter(c => c.location?.area === filterArea);
    if (searchTerm) data = data.filter(c => c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || c.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    data.sort((a, b) => {
      let val = 0;
      if (sortBy === 'date') val = new Date(a.createdAt) - new Date(b.createdAt);
      else if (sortBy === 'amount') val = (a.quotation?.amount || 0) - (b.quotation?.amount || 0);
      else if (sortBy === 'area') val = (a.location?.area || '').localeCompare(b.location?.area || '');
      return sortDir === 'desc' ? -val : val;
    });
    return data;
  }, [complaints, filterType, filterArea, searchTerm, sortBy, sortDir]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  if (loading) {
    return (
      <Layout title="Quotations & Analytics">
        <div className="loading"><div className="spinner"></div>Loading analytics...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Quotations & Analytics">
      <div className="page-header">
        <h2>Quotations & Expenditure Analytics</h2>
        <p>Track municipal spending, worker expenses, and receipt audit trail</p>
      </div>

      {/* Summary Stats */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="card-icon accent"><IndianRupee size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">₹{totalSpent.toLocaleString()}</div>
            <div className="stat-card-label">Total Expenditure</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon info"><TrendingUp size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">₹{Math.round(avgPerComplaint).toLocaleString()}</div>
            <div className="stat-card-label">Avg Per Complaint</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon warning"><IndianRupee size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">₹{highestSingle.toLocaleString()}</div>
            <div className="stat-card-label">Highest Single</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon success"><Receipt size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{complaints.length}</div>
            <div className="stat-card-label">Total Quotations</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Expenditure by Area */}
        <div className="card">
          <div className="card-header"><div className="card-title">Expenditure by Area</div></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']} />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenditure by Type */}
        <div className="card">
          <div className="card-header"><div className="card-title">Expenditure by Type</div></div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {typeData.map((entry) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyData.length > 1 && (
        <div className="card" style={{ marginBottom: '28px' }}>
          <div className="card-header"><div className="card-title">Monthly Expenditure Trend</div></div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [`₹${v.toLocaleString()}`, 'Expenditure']} />
              <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6, fill: '#818cf8' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="page-header">
        <h2>All Quotations</h2>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', flex: '1', minWidth: '200px' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search quotations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }} />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}>
          <option value="all">All Types</option>
          <option value="road">Road</option>
          <option value="garbage">Garbage</option>
          <option value="water">Water</option>
          <option value="sanitation">Sanitation</option>
        </select>
        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}>
          <option value="all">All Areas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Data Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <th style={thStyle}>Title</th>
                <th style={thStyle} onClick={() => toggleSort('area')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>Area <ArrowUpDown size={12} /></span>
                </th>
                <th style={thStyle}>Type</th>
                <th style={thStyle} onClick={() => toggleSort('amount')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>Actual <ArrowUpDown size={12} /></span>
                </th>
                <th style={thStyle}>Expected (Avg)</th>
                <th style={thStyle}>Variance</th>
                <th style={thStyle}>Worker</th>
                <th style={thStyle} onClick={() => toggleSort('date')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>Date <ArrowUpDown size={12} /></span>
                </th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Expenses</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <>
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{c.title}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <MapPin size={11} /> {c.location?.area || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}><span className={`badge badge-${c.type}`}>{c.type}</span></td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: 'var(--accent)', fontSize: '14px' }}>
                      ₹{(c.quotation?.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ₹{Math.round(typeAverages[c.type] || 0).toLocaleString()}
                    </td>
                    <td style={tdStyle}>
                      {(() => {
                        const actual = c.quotation?.amount || 0;
                        const expected = typeAverages[c.type] || 0;
                        const diff = actual - expected;
                        const percent = expected > 0 ? (diff / expected) * 100 : 0;
                        return (
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '600',
                            color: diff > 0 ? 'var(--danger)' : diff < 0 ? 'var(--success)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            {diff > 0 ? '↑' : diff < 0 ? '↓' : ''}
                            {Math.abs(Math.round(percent))}%
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px' }}>{c.assignedTo?.name || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} /> {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={tdStyle}><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                    <td style={tdStyle}>
                      {c.expenses && c.expenses.length > 0 ? (
                        <button className="btn btn-sm btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => setExpandedExpenses(s => ({ ...s, [c._id]: !s[c._id] }))}>
                          {expandedExpenses[c._id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {c.expenses.length} items
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                  {expandedExpenses[c._id] && c.expenses && (
                    <tr key={`${c._id}-exp`}>
                      <td colSpan="8" style={{ padding: '0 16px 16px' }}>
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-color)' }}>
                          {c.expenses.map((exp, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < c.expenses.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{exp.description}</span>
                                {exp.receiptImage && (
                                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}>
                                    <ImageIcon size={10} /> Receipt
                                  </span>
                                )}
                              </div>
                              <span style={{ color: 'var(--accent)', fontWeight: '700' }}>₹{exp.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No quotations match your filters.
          </div>
        )}
      </div>
    </Layout>
  );
}

const thStyle = {
  padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
  textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)',
};
