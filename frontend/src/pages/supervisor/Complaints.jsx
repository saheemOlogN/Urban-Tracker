import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import GPSMap from '../../components/GPSMap';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ClipboardList, UserPlus, IndianRupee, X, MapPin, AlertTriangle, Star, Map, Camera, Image as ImageIcon, Timer } from 'lucide-react';

function formatDuration(startedAt, resolvedAt) {
  if (!startedAt || !resolvedAt) return null;
  const ms = new Date(resolvedAt).getTime() - new Date(startedAt).getTime();
  const totalMins = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export default function SupervisorComplaints() {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [detailId, setDetailId] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [quotationModal, setQuotationModal] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [quotationAmount, setQuotationAmount] = useState('');
  const [quotationDesc, setQuotationDesc] = useState('');
  const [expandedMaps, setExpandedMaps] = useState({});
  const [expandedPhotos, setExpandedPhotos] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, wRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/complaints/workers/list'),
      ]);
      setComplaints(cRes.data);
      setWorkers(wRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedWorker) {
      toast.error('Please select a worker.');
      return;
    }
    try {
      await api.patch(`/complaints/${assignModal}/assign`, { workerId: selectedWorker });
      toast.success('Complaint assigned successfully.');
      setAssignModal(null);
      setSelectedWorker('');
      fetchData();
    } catch (err) {
      toast.error('Failed to assign complaint.');
    }
  };

  const handleQuotation = async () => {
    if (!quotationAmount) {
      toast.error('Please enter an amount.');
      return;
    }
    try {
      await api.patch(`/complaints/${quotationModal}/quotation`, {
        amount: Number(quotationAmount),
        description: quotationDesc,
      });
      toast.success('Quotation updated successfully.');
      setQuotationModal(null);
      setQuotationAmount('');
      setQuotationDesc('');
      fetchData();
    } catch (err) {
      toast.error('Failed to update quotation.');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status });
      toast.success(`Status updated to ${status}.`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const toggleMap = (id) => {
    setExpandedMaps((s) => ({ ...s, [id]: !s[id] }));
  };

  const togglePhotos = (id) => {
    setExpandedPhotos((s) => ({ ...s, [id]: !s[id] }));
  };

  const filtered = filter === 'all' ? complaints : complaints.filter((c) => c.status === filter);

  if (loading) {
    return (
      <Layout title="All Complaints">
        <div className="loading"><div className="spinner"></div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="All Complaints">
      <div className="page-header">
        <h2>All Complaints</h2>
        <p>Manage, assign, and update quotations for all complaints</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['all', 'pending', 'assigned', 'in-progress', 'resolved'].map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${complaints.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${complaints.filter((c) => c.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="complaint-list">
        {filtered.map((c) => (
          <div key={c._id} className="complaint-item" style={c.proxyFlagged ? { borderColor: 'var(--danger)' } : {}}>
            <div className="complaint-item-header">
              <span className="complaint-item-title">
                {c.title}
                {c.proxyFlagged && (
                  <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '9px' }}>
                    <AlertTriangle size={10} /> PROXY
                  </span>
                )}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
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
              {c.assignedTo && <span>Worker: {c.assignedTo.name} ({c.assignedTo.area})</span>}
              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              {c.quotation?.amount > 0 && (
                <span style={{ color: 'var(--accent)' }}>₹{c.quotation.amount.toLocaleString()}</span>
              )}
              {c.rating && (
                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={12} fill="#f59e0b" /> {c.rating}/5
                </span>
              )}
            </div>

            {/* Tracking info */}
            {(c.startedAt || c.resolvedAt || c.workerGps) && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                {c.startedAt && <span>Started: {new Date(c.startedAt).toLocaleString()}</span>}
                {c.resolvedAt && <span>Resolved: {new Date(c.resolvedAt).toLocaleString()}</span>}
                {c.startedAt && c.resolvedAt && (() => {
                  const dur = formatDuration(c.startedAt, c.resolvedAt);
                  return dur ? (
                    <span style={{ color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Timer size={12} /> Duration: {dur}
                    </span>
                  ) : null;
                })()}
                {c.workerGps?.lat && <span>GPS: {c.workerGps.lat.toFixed(4)}, {c.workerGps.lng.toFixed(4)}</span>}
                {c.gpsHistory?.length > 0 && <span>GPS Pings: {c.gpsHistory.length}</span>}
              </div>
            )}

            {/* Map & Photos Toggle Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => toggleMap(c._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              >
                <Map size={14} />
                {expandedMaps[c._id] ? 'Hide Map' : 'GPS Map'}
              </button>
              {(c.beforeImage || c.afterImage) && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => togglePhotos(c._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <Camera size={14} />
                  {expandedPhotos[c._id] ? 'Hide Photos' : 'Evidence Photos'}
                </button>
              )}
            </div>

            {/* Leaflet Map */}
            {expandedMaps[c._id] && (
              <div style={{ marginTop: '10px' }}>
                <GPSMap
                  workerGps={c.workerGps}
                  complaintArea={c.location?.area}
                  title={c.title}
                  gpsHistory={c.gpsHistory}
                  showProximityZone={true}
                  proxyFlagged={c.proxyFlagged}
                  style={{ height: '260px' }}
                />
              </div>
            )}

            {/* Before/After Photos */}
            {expandedPhotos[c._id] && (c.beforeImage || c.afterImage) && (
              <div style={{
                display: 'flex', gap: '12px', marginTop: '10px',
                padding: '12px', borderRadius: '10px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              }}>
                {c.beforeImage && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', color: 'var(--danger)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Before</div>
                    <img src={c.beforeImage} alt="Before" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                )}
                {c.afterImage && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '10px', color: 'var(--success)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>After</div>
                    <img src={c.afterImage} alt="After" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                )}
              </div>
            )}

            {/* Review info */}
            {c.review && (
              <div style={{
                marginTop: '10px', padding: '10px 12px', borderRadius: '8px',
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)',
                fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic',
              }}>
                "{c.review}"
              </div>
            )}

            <div className="complaint-item-actions">
              {c.status === 'pending' && (
                <button className="btn btn-sm btn-primary" onClick={() => setAssignModal(c._id)}>
                  <UserPlus size={14} /> Assign Worker
                </button>
              )}
              {(c.status === 'assigned' || c.status === 'in-progress') && (
                <button className="btn btn-sm btn-secondary" onClick={() => setAssignModal(c._id)}>
                  <UserPlus size={14} /> Reassign
                </button>
              )}
              <button className="btn btn-sm btn-secondary" onClick={() => {
                setQuotationModal(c._id);
                setQuotationAmount(c.quotation?.amount?.toString() || '');
                setQuotationDesc(c.quotation?.description || '');
              }}>
                <IndianRupee size={14} /> Update Quotation
              </button>
              {c.status === 'in-progress' && (
                <button className="btn btn-sm btn-secondary" style={{ color: 'var(--success)' }} onClick={() => updateStatus(c._id, 'resolved')}>
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <ClipboardList />
          <h3>No complaints found</h3>
          <p>No complaints match the selected filter.</p>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Worker</h3>
              <button className="modal-close" onClick={() => setAssignModal(null)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Select Worker</label>
              <select className="form-select" value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
                <option value="">Choose a worker</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>{w.name} - {w.area || 'No area'}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Modal */}
      {quotationModal && (
        <div className="modal-overlay" onClick={() => setQuotationModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Quotation</h3>
              <button className="modal-close" onClick={() => setQuotationModal(null)}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (Rs.)</label>
              <input
                type="number"
                className="form-input"
                value={quotationAmount}
                onChange={(e) => setQuotationAmount(e.target.value)}
                placeholder="Enter quotation amount"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={quotationDesc}
                onChange={(e) => setQuotationDesc(e.target.value)}
                placeholder="Describe the expenditure..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setQuotationModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleQuotation}>Update</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
