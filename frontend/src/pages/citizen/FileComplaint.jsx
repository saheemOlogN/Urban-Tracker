import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { AREAS } from '../../utils/areas';
import toast from 'react-hot-toast';
import { Send, Construction, Trash2, Droplets, ShowerHead } from 'lucide-react';

export default function FileComplaint() {
  const [searchParams] = useSearchParams();
  const presetType = searchParams.get('type') || '';

  const [type, setType] = useState(presetType || 'road');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !title || !description || !area) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/complaints', { type, title, description, location: { area, landmark: landmark || undefined } });
      toast.success('Complaint filed successfully.');
      navigate('/citizen');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to file complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="File Complaint">
      <div className="page-header">
        <h2>File a Complaint</h2>
        <p>Report an issue in your area of Ratnagiri</p>
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Complaint Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { value: 'road', icon: Construction, label: 'Road' },
                { value: 'garbage', icon: Trash2, label: 'Garbage' },
                { value: 'water', icon: Droplets, label: 'Water' },
                { value: 'sanitation', icon: ShowerHead, label: 'Sanitation' },
              ].map((opt) => (
                <div
                  key={opt.value}
                  className={`role-option ${type === opt.value ? 'selected' : ''}`}
                  onClick={() => setType(opt.value)}
                  style={{ padding: '14px' }}
                >
                  <div className="role-option-icon"><opt.icon size={20} /></div>
                  <div className="role-option-label">{opt.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for your complaint"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Area in Ratnagiri *</label>
              <select
                className="form-select"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="">Select area</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Landmark (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Nearby landmark"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            <Send size={16} />
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
