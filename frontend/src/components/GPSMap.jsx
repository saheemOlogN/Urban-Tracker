import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const workerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const complaintIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Area center coordinates (Ratnagiri)
const AREA_COORDS = {
  'Rajiwada': [16.9925, 73.3120],
  'Mirjole': [16.9880, 73.3078],
  'Kothawade': [16.9850, 73.3050],
  'Mandvi': [16.9960, 73.3140],
  'Nachane': [16.9800, 73.2980],
  'Bhatye': [16.9700, 73.2900],
  'Maruti Mandir': [16.9940, 73.3100],
  'Udyam Nagar': [16.9860, 73.3060],
  'Zaver Baug': [16.9910, 73.3090],
  'Teli Aali': [16.9930, 73.3110],
  'Karbude': [16.9780, 73.3000],
  'Shirke Nagar': [16.9820, 73.3040],
  'Fishtail': [16.9950, 73.3150],
  'Bhagoji Keer': [16.9870, 73.3070],
};

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

export default function GPSMap({ workerGps, complaintArea, title, style, gpsHistory, showProximityZone, proxyFlagged }) {
  const areaCoords = AREA_COORDS[complaintArea] || [16.9900, 73.3100];
  const center = workerGps?.lat ? [workerGps.lat, workerGps.lng] : areaCoords;

  // Build polyline segments color-coded by proximity
  const polylineSegments = [];
  if (gpsHistory && gpsHistory.length > 1) {
    for (let i = 0; i < gpsHistory.length - 1; i++) {
      const p1 = gpsHistory[i];
      const p2 = gpsHistory[i + 1];
      const dist = getDistanceKm(p2.lat, p2.lng, areaCoords[0], areaCoords[1]);
      const color = dist > 2 ? '#ef4444' : '#22c55e'; // red if outside zone, green if inside
      polylineSegments.push({
        positions: [[p1.lat, p1.lng], [p2.lat, p2.lng]],
        color,
      });
    }
  }

  return (
    <div style={{
      borderRadius: '10px',
      overflow: 'hidden',
      border: `1px solid ${proxyFlagged ? 'var(--danger)' : 'var(--border)'}`,
      height: '220px',
      ...style,
    }}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap lat={center[0]} lng={center[1]} />

        {/* Proximity zone circle (2km radius) */}
        {showProximityZone && (
          <Circle
            center={areaCoords}
            radius={2000}
            pathOptions={{
              color: proxyFlagged ? '#ef4444' : '#6366f1',
              fillColor: proxyFlagged ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)',
              fillOpacity: 0.3,
              weight: 1.5,
              dashArray: '6 4',
            }}
          />
        )}

        {/* GPS history polyline trail */}
        {polylineSegments.map((seg, i) => (
          <Polyline
            key={i}
            positions={seg.positions}
            pathOptions={{ color: seg.color, weight: 3, opacity: 0.7 }}
          />
        ))}

        {/* Complaint area marker */}
        <Marker position={areaCoords} icon={complaintIcon}>
          <Popup>
            <strong style={{ color: '#ef4444' }}>📍 {complaintArea}</strong><br />
            {title || 'Complaint Location'}
          </Popup>
        </Marker>

        {/* Worker GPS marker */}
        {workerGps?.lat && (
          <Marker position={[workerGps.lat, workerGps.lng]} icon={workerIcon}>
            <Popup>
              <strong style={{ color: '#3b82f6' }}>👷 Worker Location</strong><br />
              {workerGps.lat.toFixed(5)}, {workerGps.lng.toFixed(5)}<br />
              {workerGps.updatedAt && (
                <small>Updated: {new Date(workerGps.updatedAt).toLocaleTimeString()}</small>
              )}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export { AREA_COORDS };
