import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import {
  Trophy, Star, Building2, MapPin, Stethoscope, Wrench,
  Award, Medal, Crown, TrendingUp,
} from 'lucide-react';

const RANK_ICONS = [Crown, Medal, Award];
const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32'];

function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size}
          fill={s <= Math.round(rating) ? '#f59e0b' : 'transparent'}
          stroke={s <= Math.round(rating) ? '#f59e0b' : 'var(--text-muted)'}
        />
      ))}
    </div>
  );
}

export default function TopServants() {
  const [data, setData] = useState({ topDoctors: [], topWorkers: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, doctors, workers

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/appointments/top-servants');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch top servants');
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <Layout title="Top Municipal Servants">
        <div className="loading"><div className="spinner"></div>Loading leaderboard...</div>
      </Layout>
    );
  }

  const { topDoctors, topWorkers } = data;

  return (
    <Layout title="Top Municipal Servants">
      <div className="page-header">
        <h2>Top Municipal Servants</h2>
        <p>Recognizing excellence in public service — doctors and workers ranked by citizen ratings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="card-icon warning"><Trophy size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{topDoctors.length + topWorkers.length}</div>
            <div className="stat-card-label">Ranked Servants</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #6366f1' }}>
          <div className="card-icon accent"><Stethoscope size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{topDoctors.length}</div>
            <div className="stat-card-label">Doctors Listed</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #3b82f6' }}>
          <div className="card-icon info"><Wrench size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">{topWorkers.length}</div>
            <div className="stat-card-label">Workers Listed</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #22c55e' }}>
          <div className="card-icon success"><TrendingUp size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-card-value">
              {topDoctors.length > 0 ? topDoctors[0].rating?.toFixed(1) : '—'}
            </div>
            <div className="stat-card-label">Highest Rating</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-card)',
        padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)', width: 'fit-content',
      }}>
        {[
          { id: 'all', label: 'All', icon: Trophy },
          { id: 'doctors', label: 'Doctors', icon: Stethoscope },
          { id: 'workers', label: 'Workers', icon: Wrench },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              background: activeTab === t.id ? 'var(--accent)' : 'transparent',
              color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Top Doctors */}
      {(activeTab === 'all' || activeTab === 'doctors') && (
        <>
          <div className="page-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={20} style={{ color: 'var(--accent)' }} /> Top Doctors
            </h2>
            <p>Municipal hospital doctors ranked by patient satisfaction</p>
          </div>

          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px',
            overflow: 'hidden', marginBottom: '32px',
          }}>
            {topDoctors.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No rated doctors yet. Ratings will appear here after patients review their appointments.
              </div>
            ) : (
              topDoctors.map((doc, i) => {
                const RankIcon = RANK_ICONS[i] || Award;
                return (
                  <div key={doc._id} style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                    borderBottom: i < topDoctors.length - 1 ? '1px solid var(--border-color)' : 'none',
                    background: i === 0 ? 'linear-gradient(135deg, rgba(245,158,11,0.04), rgba(245,158,11,0.01))' :
                               i === 1 ? 'linear-gradient(135deg, rgba(148,163,184,0.04), rgba(148,163,184,0.01))' :
                               i === 2 ? 'linear-gradient(135deg, rgba(205,127,50,0.04), rgba(205,127,50,0.01))' : 'transparent',
                    transition: 'background 0.2s',
                  }}>
                    {/* Rank */}
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px',
                      background: i < 3 ? `${RANK_COLORS[i]}15` : 'var(--bg-elevated)',
                      color: i < 3 ? RANK_COLORS[i] : 'var(--text-muted)',
                    }}>
                      {i < 3 ? <RankIcon size={22} /> : `#${i + 1}`}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>{doc.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>{doc.specialization}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Building2 size={11} /> {doc.hospital?.name}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} /> {doc.area || doc.hospital?.area}
                        </span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '2px' }}>
                        <StarRating rating={doc.rating} />
                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#f59e0b' }}>{doc.rating?.toFixed(1)}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {doc.totalReviews} review{doc.totalReviews !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Top Workers */}
      {(activeTab === 'all' || activeTab === 'workers') && (
        <>
          <div className="page-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={20} style={{ color: 'var(--info)' }} /> Top Workers
            </h2>
            <p>Municipal field workers ranked by citizen satisfaction on complaint resolution</p>
          </div>

          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px',
            overflow: 'hidden', marginBottom: '32px',
          }}>
            {topWorkers.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No rated workers yet. Ratings will appear here after citizens review resolved complaints.
              </div>
            ) : (
              topWorkers.map((worker, i) => {
                const RankIcon = RANK_ICONS[i] || Award;
                return (
                  <div key={worker._id} style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                    borderBottom: i < topWorkers.length - 1 ? '1px solid var(--border-color)' : 'none',
                    background: i === 0 ? 'linear-gradient(135deg, rgba(245,158,11,0.04), rgba(245,158,11,0.01))' :
                               i === 1 ? 'linear-gradient(135deg, rgba(148,163,184,0.04), rgba(148,163,184,0.01))' :
                               i === 2 ? 'linear-gradient(135deg, rgba(205,127,50,0.04), rgba(205,127,50,0.01))' : 'transparent',
                  }}>
                    {/* Rank */}
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px',
                      background: i < 3 ? `${RANK_COLORS[i]}15` : 'var(--bg-elevated)',
                      color: i < 3 ? RANK_COLORS[i] : 'var(--text-muted)',
                    }}>
                      {i < 3 ? <RankIcon size={22} /> : `#${i + 1}`}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>{worker.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} /> {worker.area}
                        </span>
                        <span>{worker.email}</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '2px' }}>
                        <StarRating rating={worker.rating} />
                        <span style={{ fontWeight: '700', fontSize: '16px', color: '#f59e0b' }}>{worker.rating?.toFixed(1)}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {worker.totalReviews} review{worker.totalReviews !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
