# UrbanTrack — Ratnagiri Municipal Accountability Platform

A full-stack MERN application for citizen complaint management, GPS-based worker tracking, hospital & school status, doctor appointment booking, ML predictions, and municipal analytics.

## Features

- **Citizen Portal** — File complaints, view quotations, rate workers, book doctor appointments, view top-ranked municipal servants
- **Worker Dashboard** — GPS-verified work tracking, before/after photo evidence, live task timer, expense reporting
- **Supervisor Dashboard** — Complaint oversight, worker assignment, hospital/school management, ML predictions
- **GPS Anti-Proxy System** — Real-time GPS tracking with Leaflet maps, 2km proximity zone enforcement
- **ML Predictions** — TensorFlow.js-powered complaint hotspot prediction and expenditure forecasting
- **Email Notifications** — Automated resident alerts on complaint resolution

## Tech Stack

**Frontend:** React 19, Vite 8, React Router 7, Leaflet/React-Leaflet, Recharts, TensorFlow.js, Lucide React  
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT Auth, Nodemailer  

## Getting Started

### Backend
```bash
cd backend
npm install
# Copy .env.example to .env and fill in your values
npm start
```

### Frontend
```bash
cd frontend
npm install
# Set VITE_API_BASE_URL in .env
npm run dev
```

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
```

### Frontend `.env`
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Deployment

- **Frontend:** Vercel (auto-deploy from GitHub, set `VITE_API_BASE_URL` env var)
- **Backend:** Railway or Render (set all backend env vars in dashboard)

## User Roles

| Role | Access |
|------|--------|
| `citizen` | File complaints, view status, rate workers, book appointments |
| `worker` | View assigned tasks, GPS check-in, upload photos, add expenses |
| `supervisor` | Full oversight, assign workers, manage facilities, view ML analytics |
