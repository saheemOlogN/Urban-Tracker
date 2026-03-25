import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import {
  Stethoscope, Search, MapPin, Star, Clock, Calendar,
  Filter, ChevronRight, CheckCircle2, X, AlertCircle,
  Building2, GraduationCap, Loader2, XCircle, MessageSquare,
} from 'lucide-react';

const SPECIALIZATION_COLORS = {
  'General Medicine': '#6366f1', 'Surgery': '#ef4444', 'Pediatrics': '#f59e0b',
  'Orthopedics': '#3b82f6', 'Gynecology': '#ec4899', 'Maternity': '#ec4899',
  'Dental': '#14b8a6', 'Eye Care': '#8b5cf6', 'ENT': '#f97316',
  'Dermatology': '#84cc16', 'First Aid': '#22d3ee', 'Emergency': '#e11d48',
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('browse'); // browse | my-appointments

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpec, setFilterSpec] = useState('all');
  const [filterArea, setFilterArea] = useState('all');

  // Booking flow
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Rating
  const [ratingAppointment, setRatingAppointment] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [dRes, aRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/appointments'),
      ]);
      setDoctors(dRes.data);
      setAppointments(aRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally { setLoading(false); }
  };

  const specializations = useMemo(() =>
    [...new Set(doctors.map(d => d.specialization))].sort(),
  [doctors]);

  const areas = useMemo(() =>
    [...new Set(doctors.map(d => d.area))].sort(),
  [doctors]);

  const filteredDoctors = useMemo(() => {
    let data = [...doctors];
    if (filterSpec !== 'all') data = data.filter(d => d.specialization === filterSpec);
    if (filterArea !== 'all') data = data.filter(d => d.area === filterArea);
    if (searchTerm) data = data.filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return data;
  }, [doctors, filterSpec, filterArea, searchTerm]);

  const fetchSlots = async (doctorId, date) => {
    setLoadingSlots(true);
    setSlots(null);
    try {
      const res = await api.get(`/doctors/${doctorId}/slots?date=${date}`);
      setSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch slots');
    } finally { setLoadingSlots(false); }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedDoctor && date) {
      fetchSlots(selectedDoctor._id, date);
    }
  };

  const handleBook = async (timeSlot) => {
    if (!selectedDoctor || !selectedDate) return;
    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        timeSlot,
      });
      setBookingSuccess(res.data.message);
      fetchData();
      setTimeout(() => {
        setBookingSuccess(null);
        setSelectedDoctor(null);
        setSlots(null);
        setSelectedDate('');
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    } finally { setBooking(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleRate = async () => {
    if (!ratingAppointment || !ratingValue) return;
    setRatingLoading(true);
    try {
      await api.post(`/appointments/${ratingAppointment._id}/rate`, {
        rating: ratingValue,
        review: reviewText,
      });
      setRatingAppointment(null);
      setRatingValue(0);
      setReviewText('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Rating failed');
    } finally { setRatingLoading(false); }
  };

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <Layout title="Book Appointment">
        <div className="loading"><div className="spinner"></div>Loading doctors...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Book Appointment">
      <div className="page-header">
        <h2>Doctor Appointments</h2>
        <p>Browse doctors, check availability, and book appointments at municipal hospitals</p>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-card)',
        padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)', width: 'fit-content',
      }}>
        {[
          { id: 'browse', label: 'Browse Doctors', icon: Stethoscope },
          { id: 'my-appointments', label: 'My Appointments', icon: Calendar },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            <t.icon size={14} /> {t.label}
            {t.id === 'my-appointments' && appointments.length > 0 && (
              <span style={{
                background: tab === t.id ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.15)',
                color: tab === t.id ? '#fff' : 'var(--accent)',
                fontSize: '10px', padding: '1px 6px', borderRadius: '8px', fontWeight: '700',
              }}>{appointments.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Booking Success Banner */}
      {bookingSuccess && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', marginBottom: '20px',
          borderRadius: '10px', background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))',
          border: '1px solid rgba(34,197,94,0.2)', fontSize: '13px', color: 'var(--success)', fontWeight: '600',
        }}>
          <CheckCircle2 size={18} /> {bookingSuccess}
        </div>
      )}

      {/* Browse Doctors Tab */}
      {tab === 'browse' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)',
              border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', flex: '1', minWidth: '200px',
            }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search doctors, specializations..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }}
              />
            </div>
            <select value={filterSpec} onChange={(e) => setFilterSpec(e.target.value)}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}>
              <option value="all">All Specializations</option>
              {specializations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px' }}>
              <option value="all">All Areas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Doctor Cards */}
          <div className="grid-2">
            {filteredDoctors.map(doc => (
              <div key={doc._id} className="card" style={{
                cursor: 'pointer', transition: 'all 0.2s',
                border: selectedDoctor?._id === doc._id ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                background: selectedDoctor?._id === doc._id ? 'rgba(99,102,241,0.04)' : 'var(--bg-card)',
              }} onClick={() => {
                setSelectedDoctor(doc);
                setSlots(null);
                setSelectedDate('');
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${SPECIALIZATION_COLORS[doc.specialization] || '#6366f1'}15`,
                      color: SPECIALIZATION_COLORS[doc.specialization] || '#6366f1', fontWeight: '700', fontSize: '18px',
                    }}>
                      {doc.name.split('.')[1]?.[1] || doc.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{doc.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{doc.qualification}</div>
                    </div>
                  </div>
                  <span className={`badge ${doc.status === 'active' ? 'badge-resolved' : 'badge-warning'}`}>
                    {doc.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                    background: `${SPECIALIZATION_COLORS[doc.specialization] || '#6366f1'}15`,
                    color: SPECIALIZATION_COLORS[doc.specialization] || '#6366f1',
                  }}>
                    {doc.specialization}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                    background: 'rgba(99,102,241,0.08)', color: 'var(--text-muted)',
                  }}>
                    {doc.experience} yrs exp
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={12} /> {doc.hospital?.name || 'Unknown'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {doc.area}
                  </span>
                </div>

                {doc.totalReviews > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '12px' }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={13} fill={s <= Math.round(doc.rating) ? '#f59e0b' : 'transparent'}
                        stroke={s <= Math.round(doc.rating) ? '#f59e0b' : 'var(--text-muted)'} />
                    ))}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                      {doc.rating} ({doc.totalReviews} reviews)
                    </span>
                  </div>
                )}

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px',
                  color: 'var(--accent)', fontSize: '13px', fontWeight: '600',
                }}>
                  Select to Book <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="empty-state">
              <Stethoscope />
              <h3>No doctors found</h3>
              <p>Try adjusting your filters or search term.</p>
            </div>
          )}

          {/* Booking Slot Selector — shown when doctor selected */}
          {selectedDoctor && (
            <div style={{
              position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh',
              background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.3)', zIndex: 1000, overflowY: 'auto',
              padding: '24px', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Book Appointment</h3>
                <button onClick={() => { setSelectedDoctor(null); setSlots(null); setSelectedDate(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Doctor Info */}
              <div style={{
                padding: '16px', borderRadius: '10px', marginBottom: '20px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))',
                border: '1px solid rgba(99,102,241,0.1)',
              }}>
                <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{selectedDoctor.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {selectedDoctor.specialization} · {selectedDoctor.qualification}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={12} /> {selectedDoctor.hospital?.name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {selectedDoctor.area}
                  </span>
                </div>
              </div>

              {/* Date Picker */}
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Select Date
              </label>
              <input type="date" min={today} value={selectedDate} onChange={(e) => handleDateChange(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '20px',
                  outline: 'none',
                }}
              />

              {/* Slots */}
              {loadingSlots && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', color: 'var(--accent)', fontSize: '13px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading available slots...
                </div>
              )}

              {slots && !loadingSlots && (
                <>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} />
                    Available Slots — {slots.day}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>
                      ({slots.slotDuration}min each)
                    </span>
                  </div>

                  {slots.slots.length === 0 ? (
                    <div style={{
                      padding: '20px', textAlign: 'center', borderRadius: '8px',
                      background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)',
                      color: 'var(--danger)', fontSize: '13px',
                    }}>
                      <AlertCircle size={18} style={{ marginBottom: '6px' }} /><br />
                      Doctor is not available on this day. Please choose another date.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {slots.slots.map(slot => (
                        <button key={slot.time} disabled={!slot.available || booking}
                          onClick={() => handleBook(slot.time)}
                          style={{
                            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                            cursor: slot.available ? 'pointer' : 'not-allowed',
                            border: slot.available ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                            background: slot.available ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                            color: slot.available ? 'var(--accent)' : 'var(--text-muted)',
                            opacity: slot.available ? 1 : 0.5,
                            transition: 'all 0.15s',
                          }}
                        >
                          {slot.time}
                          {!slot.available && <span style={{ fontSize: '10px', display: 'block', color: 'var(--danger)' }}>Booked</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {!selectedDate && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Select a date to see available time slots
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* My Appointments Tab */}
      {tab === 'my-appointments' && (
        <>
          {appointments.length === 0 ? (
            <div className="empty-state">
              <Calendar />
              <h3>No appointments yet</h3>
              <p>Browse doctors and book your first appointment.</p>
            </div>
          ) : (
            <div className="complaint-list">
              {appointments.map(apt => {
                const statusColor = {
                  pending: 'warning',
                  accepted: 'resolved',
                  booked: 'assigned',
                  completed: 'resolved',
                  cancelled: 'inactive',
                }[apt.status] || 'warning';

                return (
                  <div key={apt._id} className="complaint-item">
                    <div className="complaint-item-header">
                      <span className="complaint-item-title">{apt.doctor?.name || 'Doctor'}</span>
                      <span className={`badge badge-${statusColor}`}>{apt.status}</span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {apt.doctor?.specialization} · {apt.doctor?.qualification}
                    </div>

                    {/* Accepted notification banner */}
                    {apt.status === 'accepted' && apt.notificationMessage && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px',
                        marginBottom: '10px', borderRadius: '8px', fontSize: '12px',
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))',
                        border: '1px solid rgba(34,197,94,0.2)', color: 'var(--success)',
                      }}>
                        <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                        {apt.notificationMessage}
                      </div>
                    )}

                    {/* Still pending notice */}
                    {apt.status === 'pending' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                        marginBottom: '10px', borderRadius: '8px', fontSize: '12px',
                        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                        color: '#d97706',
                      }}>
                        <Clock size={13} /> Awaiting confirmation from the hospital. You will be notified once accepted.
                      </div>
                    )}

                    <div className="complaint-item-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {formatDate(apt.date)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {apt.timeSlot}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={12} /> {apt.hospital?.name || 'Hospital'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {apt.hospital?.area}
                      </span>
                    </div>

                    {/* Rating display */}
                    {apt.rating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '12px' }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={13} fill={s <= apt.rating ? '#f59e0b' : 'transparent'}
                            stroke={s <= apt.rating ? '#f59e0b' : 'var(--text-muted)'} />
                        ))}
                        <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>Your rating</span>
                        {apt.review && <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>— "{apt.review}"</span>}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {['pending', 'accepted', 'booked'].includes(apt.status) && (
                        <button className="btn btn-sm btn-secondary" onClick={() => handleCancel(apt._id)}
                          style={{ fontSize: '12px' }}>
                          <XCircle size={13} /> Cancel
                        </button>
                      )}
                      {apt.status === 'completed' && !apt.rating && (
                        <button className="btn btn-sm btn-primary" onClick={() => {
                          setRatingAppointment(apt);
                          setRatingValue(0);
                          setReviewText('');
                        }} style={{ fontSize: '12px' }}>
                          <Star size={13} /> Rate Doctor
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Rating Modal */}
      {ratingAppointment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000,
        }} onClick={() => setRatingAppointment(null)}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '14px', padding: '28px', width: '400px', maxWidth: '90vw',
            border: '1px solid var(--border-color)', boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>Rate Doctor</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Rate your visit with {ratingAppointment.doctor?.name}
            </p>

            {/* Stars */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', justifyContent: 'center' }}>
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={32} style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                  fill={s <= ratingValue ? '#f59e0b' : 'transparent'}
                  stroke={s <= ratingValue ? '#f59e0b' : 'var(--text-muted)'}
                  onClick={() => setRatingValue(s)}
                />
              ))}
            </div>

            {/* Review text */}
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
              placeholder="Write a review (optional)..."
              rows={3} style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px', resize: 'vertical',
                outline: 'none', marginBottom: '18px', fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setRatingAppointment(null)}>Cancel</button>
              <button className="btn btn-sm btn-primary" disabled={!ratingValue || ratingLoading}
                onClick={handleRate}>
                {ratingLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Star size={14} />}
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
