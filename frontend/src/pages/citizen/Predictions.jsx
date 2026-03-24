import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import * as tf from '@tensorflow/tfjs';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import {
  Brain, TrendingUp, MapPin, AlertTriangle, Loader2, RefreshCw,
  BarChart3, Target, Zap,
} from 'lucide-react';

const CHART_TOOLTIP = {
  backgroundColor: '#151c2c', border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: '10px', fontSize: '12px', color: '#f1f5f9',
};

const AREA_COLORS = [
  '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
  '#10b981', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
  '#84cc16', '#e11d48', '#a855f7', '#22d3ee',
];

function normalize(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return arr.map(() => 0);
  return arr.map(v => (v - min) / (max - min));
}
function denormalize(val, arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  return val * (max - min) + min;
}

async function trainLinearModel(xValues, yValues) {
  const normX = normalize(xValues);
  const normY = normalize(yValues);

  const xs = tf.tensor2d(normX, [normX.length, 1]);
  const ys = tf.tensor2d(normY, [normY.length, 1]);

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 8, inputShape: [1], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: tf.train.adam(0.05), loss: 'meanSquaredError' });

  await model.fit(xs, ys, { epochs: 100, verbose: 0 });

  // Predict next value
  const nextX = (xValues[xValues.length - 1] + 1 - Math.min(...xValues)) / (Math.max(...xValues) - Math.min(...xValues) || 1);
  const pred = model.predict(tf.tensor2d([nextX], [1, 1]));
  const predVal = denormalize(pred.dataSync()[0], yValues);

  xs.dispose(); ys.dispose(); pred.dispose(); model.dispose();
  return Math.max(0, Math.round(predVal));
}

export default function Predictions() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [quotationPrediction, setQuotationPrediction] = useState(null);
  const [areaPredictions, setAreaPredictions] = useState([]);
  const [typePredictions, setTypePredictions] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/complaints/analytics/predictions');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to fetch prediction data');
    } finally { setLoading(false); }
  };

  // Group by month
  const monthlyData = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { month: key, complaints: 0, expenditure: 0 };
      map[key].complaints++;
      map[key].expenditure += c.quotation?.amount || 0;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [complaints]);

  // Group by area per month
  const areaMonthly = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const area = c.location?.area || 'Unknown';
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[area]) map[area] = {};
      map[area][key] = (map[area][key] || 0) + 1;
    });
    return map;
  }, [complaints]);

  // Group by type per month
  const typeMonthly = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[c.type]) map[c.type] = {};
      map[c.type][key] = (map[c.type][key] || 0) + 1;
    });
    return map;
  }, [complaints]);

  const runPredictions = useCallback(async () => {
    if (monthlyData.length < 2) return;
    setPredicting(true);

    try {
      // 1. Predict next month's total expenditure
      const xVals = monthlyData.map((_, i) => i);
      const yVals = monthlyData.map(m => m.expenditure);
      const predExp = await trainLinearModel(xVals, yVals);
      
      // Predict next month's total complaints
      const yComplaints = monthlyData.map(m => m.complaints);
      const predComplaints = await trainLinearModel(xVals, yComplaints);

      const lastMonth = monthlyData[monthlyData.length - 1].month;
      const [year, month] = lastMonth.split('-').map(Number);
      const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;

      setQuotationPrediction({
        month: nextMonth,
        predictedExpenditure: predExp,
        predictedComplaints: predComplaints,
        lastExpenditure: yVals[yVals.length - 1],
        lastComplaints: yComplaints[yComplaints.length - 1],
      });

      // 2. Predict complaints per area
      const months = monthlyData.map(m => m.month);
      const areaResults = [];
      for (const [area, monthMap] of Object.entries(areaMonthly)) {
        const areaCounts = months.map(m => monthMap[m] || 0);
        if (areaCounts.length < 2) continue;
        const pred = await trainLinearModel(areaCounts.map((_, i) => i), areaCounts);
        const lastCount = areaCounts[areaCounts.length - 1];
        areaResults.push({
          area,
          predicted: pred,
          lastMonth: lastCount,
          change: lastCount > 0 ? Math.round(((pred - lastCount) / lastCount) * 100) : 100,
        });
      }
      setAreaPredictions(areaResults.sort((a, b) => b.predicted - a.predicted));

      // 3. Predict complaints per type
      const typeResults = [];
      for (const [type, monthMap] of Object.entries(typeMonthly)) {
        const typeCounts = months.map(m => monthMap[m] || 0);
        if (typeCounts.length < 2) continue;
        const pred = await trainLinearModel(typeCounts.map((_, i) => i), typeCounts);
        typeResults.push({ type, predicted: pred, lastMonth: typeCounts[typeCounts.length - 1] });
      }
      setTypePredictions(typeResults.sort((a, b) => b.predicted - a.predicted));

    } catch (err) {
      console.error('Prediction error:', err);
    } finally { setPredicting(false); }
  }, [monthlyData, areaMonthly, typeMonthly]);

  // Auto-run predictions when data loads
  useEffect(() => {
    if (monthlyData.length >= 2 && !quotationPrediction && !predicting) {
      runPredictions();
    }
  }, [monthlyData, quotationPrediction, predicting, runPredictions]);

  // Build chart data with prediction
  const chartData = useMemo(() => {
    const data = monthlyData.map(m => ({ ...m, predicted: null }));
    if (quotationPrediction) {
      data.push({
        month: quotationPrediction.month,
        complaints: null,
        expenditure: null,
        predicted: quotationPrediction.predictedExpenditure,
        predictedComplaints: quotationPrediction.predictedComplaints,
      });
    }
    return data;
  }, [monthlyData, quotationPrediction]);

  if (loading) {
    return (
      <Layout title="ML Predictions">
        <div className="loading"><div className="spinner"></div>Loading prediction data...</div>
      </Layout>
    );
  }

  if (monthlyData.length < 2) {
    return (
      <Layout title="ML Predictions">
        <div className="page-header">
          <h2>ML Predictions</h2>
          <p>Insufficient data for predictions. At least 2 months of complaint data required.</p>
        </div>
        <div className="empty-state">
          <Brain />
          <h3>Not Enough Data</h3>
          <p>Predictions will become available once there are complaints across at least 2 different months.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="ML Predictions">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>ML Predictions</h2>
          <p>TensorFlow.js powered predictions for next month's quotations and problem areas</p>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={runPredictions} disabled={predicting}>
          <RefreshCw size={14} style={predicting ? { animation: 'spin 1s linear infinite' } : {}} />
          {predicting ? 'Training...' : 'Retrain Model'}
        </button>
      </div>

      {predicting && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', marginBottom: '20px',
          borderRadius: '10px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
          border: '1px solid rgba(99,102,241,0.15)', fontSize: '13px', color: 'var(--accent)',
        }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Training TensorFlow.js neural network models... This may take a few seconds.
        </div>
      )}

      {/* Prediction Summary Cards */}
      {quotationPrediction && (
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <div className="stat-card" style={{ borderTop: '3px solid var(--accent)' }}>
            <div className="card-icon accent"><TrendingUp size={20} /></div>
            <div className="stat-card-content">
              <div className="stat-card-value">₹{quotationPrediction.predictedExpenditure.toLocaleString()}</div>
              <div className="stat-card-label">Predicted Expenditure ({quotationPrediction.month})</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--info)' }}>
            <div className="card-icon info"><BarChart3 size={20} /></div>
            <div className="stat-card-content">
              <div className="stat-card-value">{quotationPrediction.predictedComplaints}</div>
              <div className="stat-card-label">Predicted Complaints ({quotationPrediction.month})</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="card-icon warning"><Target size={20} /></div>
            <div className="stat-card-content">
              <div className="stat-card-value">₹{quotationPrediction.lastExpenditure.toLocaleString()}</div>
              <div className="stat-card-label">Last Month Expenditure</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="card-icon success"><Zap size={20} /></div>
            <div className="stat-card-content">
              <div className="stat-card-value">{monthlyData.length}</div>
              <div className="stat-card-label">Months of Training Data</div>
            </div>
          </div>
        </div>
      )}

      {/* Expenditure Prediction Chart */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header"><div className="card-title">Expenditure: Historical vs Predicted</div></div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => v !== null ? [`₹${v.toLocaleString()}`, ''] : ['-', '']} />
            <Legend />
            <Line type="monotone" dataKey="expenditure" name="Actual" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} connectNulls={false} />
            <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="8 4" dot={{ fill: '#f59e0b', r: 6, stroke: '#f59e0b', strokeWidth: 2 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Area Prediction — Top Problem Areas */}
      {areaPredictions.length > 0 && (
        <>
          <div className="page-header">
            <h2>Predicted Problem Areas</h2>
            <p>Areas predicted to have the most complaints next month</p>
          </div>
          <div className="card" style={{ marginBottom: '28px' }}>
            <ResponsiveContainer width="100%" height={Math.max(200, areaPredictions.length * 40)}>
              <BarChart data={areaPredictions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="area" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={CHART_TOOLTIP} />
                <Bar dataKey="predicted" name="Predicted Complaints" fill="#6366f1" radius={[0, 6, 6, 0]} />
                <Bar dataKey="lastMonth" name="Last Month" fill="rgba(99,102,241,0.3)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Area table with change % */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', marginBottom: '28px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th style={thStyle}>Area</th>
                  <th style={thStyle}>Last Month</th>
                  <th style={thStyle}>Predicted Next Month</th>
                  <th style={thStyle}>Change</th>
                  <th style={thStyle}>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {areaPredictions.map((a, i) => (
                  <tr key={a.area} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={tdStyle}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                        <MapPin size={13} style={{ color: AREA_COLORS[i % AREA_COLORS.length] }} /> {a.area}
                      </span>
                    </td>
                    <td style={tdStyle}>{a.lastMonth}</td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: 'var(--accent)' }}>{a.predicted}</td>
                    <td style={tdStyle}>
                      <span style={{ color: a.change > 0 ? 'var(--danger)' : a.change < 0 ? 'var(--success)' : 'var(--text-muted)', fontWeight: '600' }}>
                        {a.change > 0 ? '+' : ''}{a.change}%
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span className={`badge ${a.predicted >= 5 ? 'badge-warning' : a.predicted >= 3 ? 'badge-in-progress' : 'badge-resolved'}`}>
                        {a.predicted >= 5 ? 'HIGH' : a.predicted >= 3 ? 'MEDIUM' : 'LOW'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Type Predictions */}
      {typePredictions.length > 0 && (
        <>
          <div className="page-header">
            <h2>Predictions by Type</h2>
            <p>Complaint type forecast for next month</p>
          </div>
          <div className="grid-4" style={{ marginBottom: '28px' }}>
            {typePredictions.map(t => (
              <div key={t.type} className="stat-card">
                <div className={`card-icon ${t.type === 'road' ? 'warning' : t.type === 'garbage' ? 'danger' : t.type === 'water' ? 'info' : 'accent'}`}>
                  <AlertTriangle size={18} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{t.predicted}</div>
                  <div className="stat-card-label">{t.type} (was {t.lastMonth})</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Model Info */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header"><div className="card-title">Model Information</div></div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <p><strong>Engine:</strong> TensorFlow.js (browser-based ML)</p>
          <p><strong>Architecture:</strong> Dense Neural Network (3 layers: 8→4→1 neurons, ReLU activation)</p>
          <p><strong>Training:</strong> 100 epochs with Adam optimizer, MSE loss</p>
          <p><strong>Data:</strong> Historical monthly complaint counts, expenditure, area distribution, and complaint types</p>
          <p><strong>Note:</strong> Predictions are based on {monthlyData.length} months of data. Accuracy improves with more historical data.</p>
        </div>
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
