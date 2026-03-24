import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import GPSMap from '../../components/GPSMap';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  Star, CheckCircle2, MapPin, Map, Camera, Image as ImageIcon,
  MessageSquare, Send, ThumbsUp, Timer,
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

function StarRating({ value, onChange, readonly }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '4px', cursor: readonly ? 'default' : 'pointer' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={readonly ? 16 : 28}
          fill={(hover || value) >= star ? '#f59e0b' : 'transparent'}
          stroke={(hover || value) >= star ? '#f59e0b' : 'var(--text-muted)'}
          style={{ transition: 'all 0.15s ease' }}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange && onChange(star)}
        />
      ))}
    </div>
  );
}

export default function ReviewComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMaps, setExpandedMaps] = useState({});
  const [ratings, setRatings] = useState({});
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    fetchResolved();
  }, []);

  const fetchResolved = async () => {
    try {
      const res = await api.get('/complaints/area-resolved');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to fetch resolved complaints');
    } finally {
      setLoading(false);
    }
  };

  const toggleMap = (id) => {
    setExpandedMaps((s) => ({ ...s, [id]: !s[id] }));
  };

  const submitReview = async (id) => {
    if (!ratings[id]) {
      toast.error('Please select a star rating.');
      return;
    }
    setSubmitting((s) => ({ ...s, [id]: true }));
    try {
      await api.post(`/complaints/${id}/review`, {
        rating: ratings[id],
        review: reviews[id] || '',
      });
      toast.success('Review submitted! Thank you for your feedback.');
      fetchResolved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting((s) => ({ ...s, [id]: false }));
    }
  };

  if (loading) {
    return (
      <Layout title="Review Work">
        <div className="loading"><div className="spinner"></div>Loading resolved complaints...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Review Work">
      <div className="page-header">
        <h2>Review Completed Work</h2>
        <p>Rate the quality of resolved complaints in {user?.area || 'your area'}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="card-icon success"><CheckCircle2 size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{complaints.length}</div>
            <div className="stat-card-label">Resolved in Area</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon warning"><Star size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{complaints.filter(c => c.rating).length}</div>
            <div className="stat-card-label">Already Reviewed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon accent"><MessageSquare size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{complaints.filter(c => !c.rating).length}</div>
            <div className="stat-card-label">Awaiting Review</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon info"><ThumbsUp size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">
              {complaints.filter(c => c.rating).length > 0
                ? (complaints.filter(c => c.rating).reduce((sum, c) => sum + c.rating, 0) / complaints.filter(c => c.rating).length).toFixed(1)
                : '—'}
            </div>
            <div className="stat-card-label">Avg Rating</div>
          </div>
        </div>
      </div>

      <div className="complaint-list">
        {complaints.map((c) => (
          <div key={c._id} className="complaint-item" style={c.rating ? { borderLeft: '3px solid var(--success)' } : { borderLeft: '3px solid var(--accent)' }}>
            <div className="complaint-item-header">
              <span className="complaint-item-title">
                {c.title}
                {c.rating && (
                  <span className="badge badge-resolved" style={{ marginLeft: '8px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={10} fill="#f59e0b" stroke="#f59e0b" /> Reviewed
                  </span>
                )}
              </span>
              <span className={`badge badge-${c.type}`}>{c.type}</span>
            </div>
            <div className="complaint-item-description">{c.description}</div>
            <div className="complaint-item-meta">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {c.location?.area}{c.location?.landmark ? ` — ${c.location.landmark}` : ''}
              </span>
              <span>Filed by: {c.filedBy?.name || 'Unknown'}</span>
              {c.assignedTo && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Worker: {c.assignedTo.name}
                  {c.assignedTo.rating > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#f59e0b' }}>
                      <Star size={10} fill="#f59e0b" /> {c.assignedTo.rating}
                    </span>
                  )}
                </span>
              )}
              {c.resolvedAt && <span>Resolved: {new Date(c.resolvedAt).toLocaleDateString()}</span>}
            </div>

            {/* Work Duration */}
            {c.startedAt && c.resolvedAt && (() => {
              const dur = formatDuration(c.startedAt, c.resolvedAt);
              return dur ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  marginTop: '10px', padding: '6px 12px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))',
                  border: '1px solid rgba(34,197,94,0.15)',
                  fontSize: '12px', fontWeight: '600', color: 'var(--success)',
                }}>
                  <Timer size={13} /> Work Duration: {dur}
                </div>
              ) : null;
            })()}

            {/* Map Toggle */}
            <div style={{ marginTop: '10px' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => toggleMap(c._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              >
                <Map size={14} />
                {expandedMaps[c._id] ? 'Hide Map' : 'View Location'}
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
                  style={{ height: '220px' }}
                />
              </div>
            )}

            {/* Before / After Photo Comparison */}
            {(c.beforeImage || c.afterImage) && (
              <div style={{
                display: 'flex', gap: '12px', marginTop: '14px',
                padding: '12px', borderRadius: '10px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              }}>
                {c.beforeImage && (
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '10px', color: 'var(--danger)', marginBottom: '6px',
                      textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700',
                    }}>Before</div>
                    <img src={c.beforeImage} alt="Before" style={{
                      width: '100%', maxHeight: '180px', objectFit: 'cover',
                      borderRadius: '8px', border: '1px solid var(--border)',
                    }} />
                  </div>
                )}
                {c.afterImage && (
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '10px', color: 'var(--success)', marginBottom: '6px',
                      textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700',
                    }}>After</div>
                    <img src={c.afterImage} alt="After" style={{
                      width: '100%', maxHeight: '180px', objectFit: 'cover',
                      borderRadius: '8px', border: '1px solid var(--border)',
                    }} />
                  </div>
                )}
              </div>
            )}

            {/* Review Section */}
            {c.rating ? (
              /* Already reviewed */
              <div style={{
                marginTop: '14px', padding: '14px', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))',
                border: '1px solid rgba(34,197,94,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <StarRating value={c.rating} readonly />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>{c.rating}/5</span>
                </div>
                {c.review && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                    "{c.review}"
                  </p>
                )}
                {c.reviewedBy && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                    Reviewed by: {c.reviewedBy.name}
                  </p>
                )}
              </div>
            ) : (
              /* Review form */
              <div style={{
                marginTop: '14px', padding: '16px', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
                border: '1px solid rgba(99,102,241,0.15)',
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '10px' }}>
                  Rate this work
                </div>
                <StarRating
                  value={ratings[c._id] || 0}
                  onChange={(val) => setRatings((s) => ({ ...s, [c._id]: val }))}
                />
                <textarea
                  placeholder="Share your feedback (optional)..."
                  value={reviews[c._id] || ''}
                  onChange={(e) => setReviews((s) => ({ ...s, [c._id]: e.target.value }))}
                  style={{
                    width: '100%', marginTop: '10px', padding: '10px 12px',
                    borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'var(--bg-card)', color: 'var(--text)',
                    fontSize: '13px', resize: 'vertical', minHeight: '60px',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '10px' }}
                  onClick={() => submitReview(c._id)}
                  disabled={submitting[c._id]}
                >
                  <Send size={14} /> {submitting[c._id] ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {complaints.length === 0 && (
        <div className="empty-state">
          <Star />
          <h3>No resolved complaints</h3>
          <p>Resolved complaints in {user?.area || 'your area'} will appear here for review.</p>
        </div>
      )}
    </Layout>
  );
}
