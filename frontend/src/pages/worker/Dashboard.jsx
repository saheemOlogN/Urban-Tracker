import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import GPSMap from '../../components/GPSMap';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import {
  ClipboardList, Clock, CheckCircle2, AlertCircle,
  PieChart as PieIcon, MapPin, Navigation, AlertTriangle,
  Camera, Image as ImageIcon, Timer, Map, Plus, Receipt, IndianRupee,
} from 'lucide-react';

function formatDuration(startedAt, resolvedAt) {
  if (!startedAt || !resolvedAt) return null;
  const ms = new Date(resolvedAt).getTime() - new Date(startedAt).getTime();
  const totalMins = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

const TYPE_COLORS = { road: '#f59e0b', garbage: '#ef4444', water: '#3b82f6', sanitation: '#8b5cf6' };

const chartTooltipStyle = {
  backgroundColor: '#151c2c',
  border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#f1f5f9',
};

function LiveTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: '8px 14px', borderRadius: '8px',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
      border: '1px solid rgba(99,102,241,0.2)',
      fontFamily: 'monospace', fontSize: '18px', fontWeight: '700',
      color: 'var(--accent)', letterSpacing: '2px',
    }}>
      <Timer size={16} style={{ animation: 'pulse 2s infinite' }} />
      {pad(hrs)}:{pad(mins)}:{pad(secs)}
    </div>
  );
}

export default function WorkerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState({});
  const [beforeImages, setBeforeImages] = useState({});
  const [afterImages, setAfterImages] = useState({});
  const [expandedMaps, setExpandedMaps] = useState({});
  const gpsInterval = useRef(null);
  // Expense state
  const [expenseModal, setExpenseModal] = useState(null);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReceipt, setExpenseReceipt] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  useEffect(() => {
    fetchComplaints();
    return () => { if (gpsInterval.current) clearInterval(gpsInterval.current); };
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const getGPS = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const handleImageUpload = (e, complaintId, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'before') setBeforeImages((s) => ({ ...s, [complaintId]: reader.result }));
      else setAfterImages((s) => ({ ...s, [complaintId]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setExpenseReceipt(reader.result);
    reader.readAsDataURL(file);
  };

  const submitExpense = async () => {
    if (!expenseDesc || !expenseAmount || Number(expenseAmount) <= 0) {
      toast.error('Please enter description and a valid amount.'); return;
    }
    setSubmittingExpense(true);
    try {
      await api.post(`/complaints/${expenseModal}/expenses`, {
        description: expenseDesc, amount: Number(expenseAmount), receiptImage: expenseReceipt,
      });
      toast.success('Expense added.');
      setExpenseModal(null); setExpenseDesc(''); setExpenseAmount(''); setExpenseReceipt('');
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense.');
    } finally { setSubmittingExpense(false); }
  };

  const toggleMap = (id) => {
    setExpandedMaps((s) => ({ ...s, [id]: !s[id] }));
  };

  const startWork = async (id) => {
    if (!beforeImages[id]) {
      toast.error('Please upload a BEFORE photo of the location first.');
      return;
    }
    setGpsStatus((s) => ({ ...s, [id]: 'locating' }));
    try {
      const gps = await getGPS();
      await api.patch(`/complaints/${id}/status`, {
        status: 'in-progress',
        lat: gps.lat, lng: gps.lng,
        beforeImage: beforeImages[id],
      });
      toast.success('Work started. GPS location and before photo recorded.');

      const interval = setInterval(async () => {
        try { const pos = await getGPS(); await api.patch(`/complaints/${id}/gps`, { lat: pos.lat, lng: pos.lng }); } catch (e) { /* silent */ }
      }, 30000);
      gpsInterval.current = interval;

      setGpsStatus((s) => ({ ...s, [id]: 'tracking' }));
      setExpandedMaps((s) => ({ ...s, [id]: true }));
      fetchComplaints();
    } catch (err) {
      toast.error('GPS access required. Please enable location.');
      setGpsStatus((s) => ({ ...s, [id]: null }));
    }
  };

  const resolveWork = async (id) => {
    if (!afterImages[id]) {
      toast.error('Please upload an AFTER photo of the completed work.');
      return;
    }
    setGpsStatus((s) => ({ ...s, [id]: 'resolving' }));
    try {
      const gps = await getGPS();
      await api.patch(`/complaints/${id}/status`, {
        status: 'resolved',
        lat: gps.lat, lng: gps.lng,
        afterImage: afterImages[id],
      });
      toast.success('Complaint resolved! Area residents will be notified.');
      if (gpsInterval.current) { clearInterval(gpsInterval.current); gpsInterval.current = null; }
      setGpsStatus((s) => ({ ...s, [id]: null }));
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to resolve.');
      setGpsStatus((s) => ({ ...s, [id]: null }));
    }
  };

  const stats = {
    total: complaints.length,
    assigned: complaints.filter((c) => c.status === 'assigned').length,
    inProgress: complaints.filter((c) => c.status === 'in-progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  const typeData = Object.entries(TYPE_COLORS)
    .map(([type, color]) => ({ name: type.charAt(0).toUpperCase() + type.slice(1), value: complaints.filter(c => c.type === type).length, color }))
    .filter(d => d.value > 0);

  if (loading) {
    return (
      <Layout title="Worker Dashboard">
        <div className="loading"><div className="spinner"></div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Worker Dashboard">
      <div className="page-header">
        <h2>Worker Dashboard</h2>
        <p>Your assigned tasks and performance overview</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="card-icon accent"><ClipboardList size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.total}</div>
            <div className="stat-card-label">Total Assigned</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon warning"><Clock size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.assigned}</div>
            <div className="stat-card-label">New</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon info"><AlertCircle size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.inProgress}</div>
            <div className="stat-card-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon success"><CheckCircle2 size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.resolved}</div>
            <div className="stat-card-label">Resolved</div>
          </div>
        </div>
      </div>

      {typeData.length > 0 && (
        <div className="chart-card" style={{ marginBottom: '28px', maxWidth: '400px' }}>
          <div className="chart-card-title"><PieIcon size={16} /> Task Type Breakdown</div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {typeData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="page-header"><h2>Assigned Complaints</h2></div>

      <div className="complaint-list">
        {complaints.map((c) => (
          <div key={c._id} className="complaint-item" style={c.proxyFlagged ? { borderColor: 'var(--danger)' } : {}}>
            <div className="complaint-item-header">
              <span className="complaint-item-title">
                {c.title}
                {c.proxyFlagged && (
                  <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '9px' }}>
                    <AlertTriangle size={10} /> PROXY DETECTED
                  </span>
                )}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`badge badge-${c.type}`}>{c.type}</span>
                <span className={`badge badge-${c.status}`}>{c.status}</span>
              </div>
            </div>
            <div className="complaint-item-description">{c.description}</div>
            <div className="complaint-item-meta">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {c.location?.area}{c.location?.landmark ? ` — ${c.location.landmark}` : ''}
              </span>
              <span>By: {c.filedBy?.name || 'Unknown'}</span>
              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Interactive Map Toggle */}
            <div style={{ marginTop: '12px' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => toggleMap(c._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              >
                <Map size={14} />
                {expandedMaps[c._id] ? 'Hide Map' : 'View on Map'}
              </button>
            </div>

            {expandedMaps[c._id] && (
              <div style={{ marginTop: '10px' }}>
                <GPSMap
                  workerGps={c.workerGps}
                  complaintArea={c.location?.area}
                  title={c.title}
                  gpsHistory={c.gpsHistory}
                  showProximityZone={true}
                  proxyFlagged={c.proxyFlagged}
                  style={{ height: '250px' }}
                />
              </div>
            )}

            {/* LIVE TIMER — shown when work is in progress */}
            {c.status === 'in-progress' && c.startedAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                <LiveTimer startedAt={c.startedAt} />
                {gpsStatus[c._id] === 'tracking' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--success)' }}>
                    <Navigation size={14} style={{ animation: 'pulse 2s infinite' }} /> Live GPS active
                  </div>
                )}
              </div>
            )}

            {/* Before / After Photos */}
            {(c.beforeImage || c.afterImage) && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                {c.beforeImage && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Before</div>
                    <img src={c.beforeImage} alt="Before" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                )}
                {c.afterImage && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>After</div>
                    <img src={c.afterImage} alt="After" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                )}
              </div>
            )}

            {/* Work Duration — shown for resolved */}
            {c.status === 'resolved' && c.startedAt && c.resolvedAt && (() => {
              const dur = formatDuration(c.startedAt, c.resolvedAt);
              return dur ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  marginTop: '10px', padding: '6px 12px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))',
                  border: '1px solid rgba(34,197,94,0.15)',
                  fontSize: '12px', fontWeight: '600', color: 'var(--success)',
                }}>
                  <Timer size={13} /> Completed in {dur}
                </div>
              ) : null;
            })()}

            {/* Worker Actions */}
            {c.status === 'assigned' && (
              <div style={{ marginTop: '14px' }}>
                {/* Before image upload */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', border: '1px dashed var(--border)', color: beforeImages[c._id] ? 'var(--success)' : 'var(--text-muted)', fontSize: '13px', transition: 'all 0.2s' }}>
                    <Camera size={16} />
                    {beforeImages[c._id] ? '✓ Before photo ready' : 'Upload BEFORE photo *'}
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, c._id, 'before')} />
                  </label>
                  {beforeImages[c._id] && (
                    <img src={beforeImages[c._id]} alt="Before preview" style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px' }} />
                  )}
                </div>
                <button className="btn btn-primary" onClick={() => startWork(c._id)} disabled={gpsStatus[c._id] === 'locating'}>
                  {gpsStatus[c._id] === 'locating' ? (
                    <><div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div> Getting GPS...</>
                  ) : (
                    <><Navigation size={14} /> Start Work (GPS + Photo)</>
                  )}
                </button>
              </div>
            )}

            {c.status === 'in-progress' && (
              <div style={{ marginTop: '14px' }}>
                {/* Add Expense */}
                <button className="btn btn-sm btn-secondary" style={{ marginBottom: '12px' }} onClick={() => setExpenseModal(c._id)}>
                  <Plus size={14} /> Add Expense / Receipt
                </button>
                {/* Expenses list */}
                {c.expenses && c.expenses.length > 0 && (
                  <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Receipt size={12} /> Expenses ({c.expenses.length})
                    </div>
                    {c.expenses.map((exp, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', borderBottom: i < c.expenses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{exp.description}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: '700' }}>₹{exp.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border)', fontSize: '13px', fontWeight: '700' }}>
                      <span>Total</span><span style={{ color: 'var(--accent)' }}>₹{c.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {/* After image upload */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', border: '1px dashed var(--border)', color: afterImages[c._id] ? 'var(--success)' : 'var(--text-muted)', fontSize: '13px', transition: 'all 0.2s' }}>
                    <ImageIcon size={16} />
                    {afterImages[c._id] ? '✓ After photo ready' : 'Upload AFTER photo *'}
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, c._id, 'after')} />
                  </label>
                  {afterImages[c._id] && (
                    <img src={afterImages[c._id]} alt="After preview" style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px' }} />
                  )}
                </div>
                <button className="btn btn-primary" style={{ background: 'var(--success)' }} onClick={() => resolveWork(c._id)} disabled={gpsStatus[c._id] === 'resolving'}>
                  <CheckCircle2 size={14} /> {gpsStatus[c._id] === 'resolving' ? 'Resolving...' : 'Mark Resolved (GPS + Photo)'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {complaints.length === 0 && (
        <div className="empty-state">
          <ClipboardList />
          <h3>No assigned complaints</h3>
          <p>Complaints appear here once auto-assigned based on your area.</p>
        </div>
      )}

      {/* Expense Modal */}
      {expenseModal && (
        <div className="modal-overlay" onClick={() => setExpenseModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Expense</h3>
              <button className="modal-close" onClick={() => setExpenseModal(null)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', padding: '6px', borderRadius: '8px', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" className="form-input" placeholder="e.g. Cement, Labor..." value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input type="number" className="form-input" placeholder="Enter amount" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Receipt Photo (optional)</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', border: '1px dashed var(--border)', color: expenseReceipt ? 'var(--success)' : 'var(--text-muted)', fontSize: '13px' }}>
                <Camera size={16} /> {expenseReceipt ? '✓ Receipt attached' : 'Upload receipt'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleReceiptUpload} />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setExpenseModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitExpense} disabled={submittingExpense}>
                <IndianRupee size={14} /> {submittingExpense ? 'Adding...' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
