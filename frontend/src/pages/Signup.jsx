import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { AREAS } from '../utils/areas';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !aadhar) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (aadhar.length !== 12) {
      toast.error('Aadhar number must be 12 digits.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/signup', {
        name,
        email,
        password,
        aadhar,
        phone,
        area: area || undefined,
      });

      toast.success('Account created successfully!');
      login(res.data.user, res.data.token);
      navigate('/citizen');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        <div className="auth-header">
          <h1>Citizen Registration</h1>
          <p>Join Urban Tracker — Ratnagiri Municipal Hub</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required />
            </div>
            <div className="form-group">
              <label className="form-label">Aadhar Number *</label>
              <input type="text" className="form-input" value={aadhar} onChange={(e) => setAadhar(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit Aadhar number" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
            </div>
            <div className="form-group">
              <label className="form-label">Area in Ratnagiri</label>
              <select className="form-select" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Select area</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            <UserPlus size={16} />
            {submitting ? 'Creating Account...' : 'Create Citizen Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
