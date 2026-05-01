const https = require('https');

/** Calendar day for Mongo UTC dates (India). */
const GEOFENCE_TZ = process.env.GEOFENCE_TZ || 'Asia/Kolkata';
/** Wall-clock → instant; India has no DST. */
const GEOFENCE_TZ_OFFSET = process.env.GEOFENCE_TZ_OFFSET || '+05:30';

/**
 * Parse clock time for event geofencing (organiser-entered strings).
 * - Detects am/pm anywhere in the string (not only right after HH:MM).
 * - If hour is 1–11 and there is no am/pm, treats as PM (typical cleanup drives).
 * - Plain 24h (e.g. 18:45): hour ≥ 13 or hour 0 kept as-is; 12 unchanged when no am/pm.
 */
function parseTimeToHm(timeStr) {
  if (!timeStr) return { h: 0, m: 0 };
  const s = String(timeStr).trim().replace(/\u00a0/g, ' ');
  const m = s.match(/^(\d{1,2})\s*:\s*(\d{2})(?:\s*:\s*(\d{2}))?/);
  if (!m) return { h: 0, m: 0 };
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (min > 59 || h > 23) return { h: 0, m: 0 };

  const low = s.toLowerCase().replace(/\./g, '');
  const hasPm = /\bpm\b|^pm|pm$|pm\s|p\s*m/.test(low) || low.includes('p.m');
  const hasAm = (/\bam\b|^am|am$|am\s|a\s*m/.test(low) || low.includes('a.m')) && !hasPm;

  if (hasPm && h !== 12) h += 12;
  else if (hasAm && h === 12) h = 0;
  else if (!hasPm && !hasAm) {
    if (h >= 13) { /* explicit 24h */ }
    else if (h >= 1 && h <= 11) h += 12;
    else if (h === 12) { /* noon, no suffix */ }
  }

  return { h, m: min };
}

function combineDateAndTime(dateInput, timeStr) {
  let ds;
  if (typeof dateInput === 'string') ds = dateInput.slice(0, 10);
  else if (dateInput instanceof Date) {
    const d = dateInput;
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    ds = `${y}-${mo}-${da}`;
  } else ds = String(dateInput).slice(0, 10);
  const { h, m } = parseTimeToHm(timeStr);
  const [yy, mm, dd] = ds.split('-').map(Number);
  return new Date(yy, mm - 1, dd, h, m, 0, 0);
}

function combineYmdTimeInFenceTz(ymd, timeStr) {
  const { h, m } = parseTimeToHm(timeStr);
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return new Date(NaN);
  const iso = `${ymd}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00${GEOFENCE_TZ_OFFSET}`;
  return new Date(iso);
}

exports.combineDateAndTime = combineDateAndTime;
exports.combineYmdTimeInFenceTz = combineYmdTimeInFenceTz;
exports.parseTimeToHm = parseTimeToHm;

function resolveGeofenceDateYmd(event) {
  if (event.geofenceDateYmd && /^\d{4}-\d{2}-\d{2}$/.test(event.geofenceDateYmd)) {
    return event.geofenceDateYmd;
  }
  const raw = event.date;
  if (raw == null) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleDateString('en-CA', { timeZone: GEOFENCE_TZ });
  } catch {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }
}

function getGeofenceWindow(event) {
  const ymd = resolveGeofenceDateYmd(event);
  if (!ymd || !event.time || !event.endTime) return { start: null, end: null };
  const start = combineYmdTimeInFenceTz(ymd, event.time);
  const end = combineYmdTimeInFenceTz(ymd, event.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { start: null, end: null };
  return { start, end };
}

exports.resolveGeofenceDateYmd = resolveGeofenceDateYmd;
exports.getGeofenceWindow = getGeofenceWindow;

/** GeoJSON-style ring: [[lng,lat], ...] (closed or open). */
function polygonRingCentroid(ring) {
  if (!ring || !ring.length) return null;
  let n = ring.length;
  if (
    n > 1 &&
    ring[0][0] === ring[n - 1][0] &&
    ring[0][1] === ring[n - 1][1]
  ) {
    n -= 1;
  }
  if (n < 1) return null;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += ring[i][0];
    sy += ring[i][1];
  }
  return { lon: sx / n, lat: sy / n };
}

exports.polygonRingCentroid = polygonRingCentroid;

function geocodeNominatim(query) {
  return new Promise((resolve, reject) => {
    const path = `/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const req = https.request(
      {
        hostname: 'nominatim.openstreetmap.org',
        path,
        method: 'GET',
        headers: { 'User-Agent': 'SwachhMitra/1.0 (contact: local)' },
      },
      res => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            if (!j?.length) return resolve(null);
            resolve({ lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) });
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

exports.geocodeNominatim = geocodeNominatim;

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isInsidePolygon(lat, lng, polygonDoc) {
  const rings = polygonDoc.coordinates;
  if (!rings || !rings.length) return false;
  const poly = rings[0];
  let x = lng;
  let y = lat;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeofence(event, lat, lng) {
  const coords = event.geofenceCoordinates;
  if (coords && coords.length && coords[0]?.length >= 3) {
    return isInsidePolygon(lat, lng, { coordinates: coords });
  }
  if (event.geofenceLat != null && event.geofenceLng != null) {
    const r = event.geofenceRadiusM != null ? event.geofenceRadiusM : 200;
    return distanceMeters(lat, lng, event.geofenceLat, event.geofenceLng) <= r;
  }
  return false;
}

exports.pointInGeofence = pointInGeofence;
exports.distanceMeters = distanceMeters;
