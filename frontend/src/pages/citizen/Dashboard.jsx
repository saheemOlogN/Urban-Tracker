import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { getNearestFacilities } from '../../utils/areas';
import {
  Construction, Trash2, Building2, GraduationCap,
  FileText, Clock, CheckCircle2, AlertCircle,
  MapPin, ArrowRight, Receipt, Bell, Star,
  Timer, Camera, UserCheck, PlayCircle, X,
  Stethoscope, Trophy,
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

function generateNotifications(complaints) {
  const notifications = [];

  complaints.forEach((c) => {
    // Filed
    notifications.push({
      id: `${c._id}-filed`,
      icon: FileText,
      color: 'accent',
      title: 'Complaint Filed',
      message: `"${c.title}" has been submitted successfully.`,
      time: c.createdAt,
      type: 'filed',
    });

    // Assigned
    if (c.assignedTo && c.status !== 'pending') {
      notifications.push({
        id: `${c._id}-assigned`,
        icon: UserCheck,
        color: 'info',
        title: 'Worker Assigned',
        message: `${c.assignedTo.name || 'A worker'} has been assigned to "${c.title}".`,
        time: c.updatedAt,
        type: 'assigned',
      });
    }

    // Work Started
    if (c.startedAt) {
      notifications.push({
        id: `${c._id}-started`,
        icon: PlayCircle,
        color: 'warning',
        title: 'Work Started',
        message: `Work on "${c.title}" has begun. Worker is on-site with GPS tracking active.`,
        time: c.startedAt,
        type: 'started',
      });
    }

    // Resolved
    if (c.resolvedAt) {
      const duration = formatDuration(c.startedAt, c.resolvedAt);
      notifications.push({
        id: `${c._id}-resolved`,
        icon: CheckCircle2,
        color: 'success',
        title: 'Work Completed',
        message: `"${c.title}" has been resolved${duration ? ` in ${duration}` : ''}. You can now review the work.`,
        time: c.resolvedAt,
        type: 'resolved',
      });
    }

    // Reviewed
    if (c.rating) {
      notifications.push({
        id: `${c._id}-reviewed`,
        icon: Star,
        color: 'warning',
        title: 'Review Submitted',
        message: `You rated "${c.title}" ${c.rating}/5 stars.`,
        time: c.updatedAt,
        type: 'reviewed',
      });
    }
  });

  // Sort newest first
  notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
  return notifications;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CitizenDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cRes, hRes, sRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/hospitals'),
        api.get('/schools'),
      ]);
      setComplaints(cRes.data);
      setHospitals(hRes.data);
      setSchools(sRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    inProgress: complaints.filter((c) => c.status === 'in-progress' || c.status === 'assigned').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  const notifications = generateNotifications(complaints);

  const actions = [
    {
      icon: Construction, color: 'warning',
      title: 'Report Road Issue',
      description: 'Potholes, road damage, or construction hazards in your area.',
      onClick: () => navigate('/citizen/file-complaint?type=road'),
    },
    {
      icon: Trash2, color: 'danger',
      title: 'Report Garbage Issue',
      description: 'Uncollected waste, illegal dumping, or sanitation problems.',
      onClick: () => navigate('/citizen/file-complaint?type=garbage'),
    },
    {
      icon: Building2, color: 'info',
      title: 'Hospital Status',
      description: 'Check bed availability, doctors, and hospital data.',
      onClick: () => navigate('/citizen/hospitals'),
    },
    {
      icon: GraduationCap, color: 'accent',
      title: 'School Status',
      description: 'School details, teacher distribution, and facilities.',
      onClick: () => navigate('/citizen/schools'),
    },
    {
      icon: Receipt, color: 'accent',
      title: 'View Quotations',
      description: 'Track municipal spending and expenditure tenders.',
      onClick: () => navigate('/citizen/quotations'),
    },
    {
      icon: Stethoscope, color: 'success',
      title: 'Book Doctor Appointment',
      description: 'Browse doctors, check availability, and book slots.',
      onClick: () => navigate('/citizen/appointments'),
    },
    {
      icon: Trophy, color: 'warning',
      title: 'Top Municipal Servants',
      description: 'View top-rated doctors and workers in your city.',
      onClick: () => navigate('/citizen/top-servants'),
    },
  ];

  if (loading) {
    return (
      <Layout title="Citizen Dashboard">
        <div className="loading"><div className="spinner"></div>Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Citizen Dashboard">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Welcome, {user?.name?.split(' ')[0] || 'Citizen'}</h2>
          <p>Ratnagiri Municipal Services Hub — File complaints and access municipal data</p>
        </div>
        {/* Notification Bell */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '10px', cursor: 'pointer', color: 'var(--text)',
            transition: 'all 0.2s',
          }}
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: 'var(--danger)', color: '#fff',
              fontSize: '10px', fontWeight: '700', borderRadius: '50%',
              width: '18px', height: '18px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div style={{
          marginBottom: '24px', borderRadius: '12px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '15px' }}>
              <Bell size={16} /> Notifications
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                background: 'rgba(99,102,241,0.15)', color: 'var(--accent)',
              }}>
                {notifications.length}
              </span>
            </div>
            <button onClick={() => setShowNotifications(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              padding: '4px',
            }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div key={n.id} style={{
                  display: 'flex', gap: '12px', padding: '12px 18px',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}>
                  <div className={`card-icon ${n.color}`} style={{
                    width: '32px', height: '32px', minWidth: '32px',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <n.icon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {n.message}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: '2px' }}>
                    {timeAgo(n.time)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="card-icon accent"><FileText size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.total}</div>
            <div className="stat-card-label">My Complaints</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="card-icon warning"><Clock size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.pending}</div>
            <div className="stat-card-label">Pending</div>
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

      {/* Quick Actions */}
      <div className="page-header">
        <h2>Quick Actions</h2>
        <p>Select a service to get started</p>
      </div>
      <div className="action-grid" style={{ marginBottom: '32px' }}>
        {actions.map((action) => (
          <div key={action.title} className="action-card" onClick={action.onClick}>
            <div className={`card-icon ${action.color}`}>
              <action.icon size={20} />
            </div>
            <div className="action-card-content">
              <h3>{action.title}</h3>
              <p>{action.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Facilities Near You */}
      {(hospitals.length > 0 || schools.length > 0) && (
        <>
          <div className="page-header">
            <h2>Facilities Near You</h2>
            <p>Closest municipal facilities from {user?.area || 'your area'}</p>
          </div>
          <div className="grid-2" style={{ marginBottom: '28px' }}>
            {hospitals.length > 0 && (() => {
              const nearest = getNearestFacilities(hospitals, user?.area)[0];
              return (
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/citizen/hospitals')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div className="card-icon info"><Building2 size={20} /></div>
                    <span className="badge badge-accent">Nearest Hospital</span>
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>{nearest?.name}</h3>
                  <p style={{ margin: '0 0 14px', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {nearest?.area}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
                    View Details <ArrowRight size={14} />
                  </div>
                </div>
              );
            })()}
            {schools.length > 0 && (() => {
              const nearest = getNearestFacilities(schools, user?.area)[0];
              return (
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/citizen/schools')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div className="card-icon accent"><GraduationCap size={20} /></div>
                    <span className="badge badge-accent">Nearest School</span>
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>{nearest?.name}</h3>
                  <p style={{ margin: '0 0 14px', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {nearest?.area}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>
                    View Details <ArrowRight size={14} />
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* Recent Complaints — Enhanced with photos + duration */}
      {complaints.length > 0 && (
        <>
          <div className="page-header">
            <h2>My Complaints</h2>
          </div>
          <div className="complaint-list">
            {complaints.slice(0, 10).map((c) => {
              const duration = formatDuration(c.startedAt, c.resolvedAt);
              return (
                <div key={c._id} className="complaint-item">
                  <div className="complaint-item-header">
                    <span className="complaint-item-title">{c.title}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className={`badge badge-${c.type}`}>{c.type}</span>
                      <span className={`badge badge-${c.status}`}>{c.status}</span>
                    </div>
                  </div>
                  <div className="complaint-item-description">{c.description}</div>
                  <div className="complaint-item-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />{c.location?.area}
                    </span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    {c.assignedTo && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck size={12} /> {c.assignedTo.name || 'Worker assigned'}
                      </span>
                    )}
                    {c.quotation?.amount > 0 && (
                      <span style={{ color: 'var(--accent)', fontWeight: '600' }}>
                        ₹{c.quotation.amount.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Work Duration */}
                  {duration && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      marginTop: '10px', padding: '6px 12px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))',
                      border: '1px solid rgba(34,197,94,0.15)',
                      fontSize: '12px', fontWeight: '600', color: 'var(--success)',
                    }}>
                      <Timer size={13} /> Work Duration: {duration}
                      {c.startedAt && (
                        <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '4px' }}>
                          ({new Date(c.startedAt).toLocaleString()} → {new Date(c.resolvedAt).toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Before / After Photo Evidence */}
                  {(c.beforeImage || c.afterImage) && (
                    <div style={{
                      display: 'flex', gap: '12px', marginTop: '12px',
                      padding: '12px', borderRadius: '10px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    }}>
                      {c.beforeImage && (
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '10px', color: 'var(--danger)', marginBottom: '6px',
                            textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            <Camera size={10} /> Before
                          </div>
                          <img src={c.beforeImage} alt="Before" style={{
                            width: '100%', maxHeight: '160px', objectFit: 'cover',
                            borderRadius: '8px', border: '1px solid var(--border)',
                          }} />
                        </div>
                      )}
                      {c.afterImage && (
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '10px', color: 'var(--success)', marginBottom: '6px',
                            textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            <Camera size={10} /> After
                          </div>
                          <img src={c.afterImage} alt="After" style={{
                            width: '100%', maxHeight: '160px', objectFit: 'cover',
                            borderRadius: '8px', border: '1px solid var(--border)',
                          }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rating display */}
                  {c.rating && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      marginTop: '10px', fontSize: '12px', color: '#f59e0b',
                    }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} fill={s <= c.rating ? '#f59e0b' : 'transparent'} stroke={s <= c.rating ? '#f59e0b' : 'var(--text-muted)'} />
                      ))}
                      <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>Your rating</span>
                    </div>
                  )}

                  {/* Review prompt for resolved + unreviewed */}
                  {c.status === 'resolved' && !c.rating && (
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ marginTop: '10px' }}
                      onClick={() => navigate('/citizen/reviews')}
                    >
                      <Star size={14} /> Rate this work
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
