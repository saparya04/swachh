const Event        = require('../models/Event');
const GeofencePing = require('../models/GeofencePing');
const User         = require('../models/User');
const { awardXP, checkCertificates, updateMonthlyActivity, XP } = require('../helpers/progressHelper');
const {
  combineYmdTimeInFenceTz,
  geocodeNominatim,
  pointInGeofence,
  getGeofenceWindow,
  polygonRingCentroid,
} = require('../helpers/geofenceHelper');
const { rateLimitGeo } = require('../helpers/redisClient');

// ── Create Event ──────────────────────────────────────────────────────────────
exports.createEvent = async (req, res) => {
  try {
    const {
      name, date, time, endTime, volunteersRequired, location, description, organiserUid,
      geofenceCoordinates,
    } = req.body;
    const organiser = await User.findOne({ firebaseUid: organiserUid });
    if (!organiser) return res.status(404).json({ message: 'Organiser not found.' });

    const tz = process.env.GEOFENCE_TZ || 'Asia/Kolkata';
    let geofenceDateYmd;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim().slice(0, 10))) {
      geofenceDateYmd = date.trim().slice(0, 10);
    } else if (date != null) {
      const d = new Date(date);
      if (!Number.isNaN(d.getTime())) {
        try {
          geofenceDateYmd = d.toLocaleDateString('en-CA', { timeZone: tz });
        } catch {
          geofenceDateYmd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
    }
    const geofenceStartAt = geofenceDateYmd ? combineYmdTimeInFenceTz(geofenceDateYmd, time) : null;
    const geofenceEndAt   = geofenceDateYmd ? combineYmdTimeInFenceTz(geofenceDateYmd, endTime) : null;
    let geofenceLat;
    let geofenceLng;
    let coordsToSave;

    const ring =
      Array.isArray(geofenceCoordinates) &&
      Array.isArray(geofenceCoordinates[0]) &&
      geofenceCoordinates[0].length >= 4
        ? geofenceCoordinates[0]
        : null;

    if (ring) {
      coordsToSave = geofenceCoordinates;
      const c = polygonRingCentroid(ring);
      if (c) {
        geofenceLat = c.lat;
        geofenceLng = c.lon;
      }
    } else {
      try {
        const g = await geocodeNominatim(location);
        if (g) {
          geofenceLat = g.lat;
          geofenceLng = g.lon;
        }
      } catch { /* keep event without coords */ }
    }

    const newEvent = new Event({
      name, date, time, endTime, volunteersRequired, location,
      description: description || '',
      createdBy: organiser._id,
      geofenceDateYmd,
      geofenceStartAt,
      geofenceEndAt,
      geofenceLat,
      geofenceLng,
      geofenceRadiusM: 200,
      ...(coordsToSave ? { geofenceCoordinates: coordsToSave } : {}),
    });
    await newEvent.save();

    // Track on organiser
    organiser.eventsCreated = (organiser.eventsCreated || 0) + 1;
    await organiser.save();

    res.status(201).json({ message: 'Event created.', event: newEvent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get All Events (Volunteer view) ──────────────────────────────────────────
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: { $ne: 'cancelled' } })
      .populate('createdBy', 'name')
      .sort({ date: 1 });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Volunteer joins an event ──────────────────────────────────────────────────
exports.joinEvent = async (req, res) => {
  try {
    const { eventId, firebaseUid } = req.body;
    const user  = await User.findOne({ firebaseUid });
    const event = await Event.findById(eventId);
    if (!user || !event)
      return res.status(404).json({ message: 'User or event not found.' });

    if (event.participants.includes(firebaseUid))
      return res.status(400).json({ message: 'Already registered.' });

    // Add to participants (Firebase UID array)
    event.participants.push(firebaseUid);
    await event.save();

    // Update volunteer stats
    user.totalEventsJoined = (user.totalEventsJoined || 0) + 1;
    if (!user.registeredEvents.includes(event._id)) {
      user.registeredEvents.push(event._id);
    }
    updateMonthlyActivity(user, { eventsJoined: 1 });
    awardXP(user, XP.JOIN_EVENT, 'JOIN_EVENT');
    _updateStreak(user);
    checkCertificates(user);

    await user.save();
    res.status(200).json({ message: 'Joined successfully.', xpAwarded: XP.JOIN_EVENT });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Volunteer leaves an event ─────────────────────────────────────────────────
exports.leaveEvent = async (req, res) => {
  try {
    const { eventId, firebaseUid } = req.body;
    const event = await Event.findById(eventId);
    const user  = await User.findOne({ firebaseUid });
    if (!event || !user)
      return res.status(404).json({ message: 'User or event not found.' });

    event.participants = event.participants.filter(uid => uid !== firebaseUid);
    await event.save();

    // Remove from registered events list
    user.registeredEvents = user.registeredEvents.filter(id => !id.equals(event._id));
    user.totalEventsJoined = Math.max(0, (user.totalEventsJoined || 1) - 1);
    await user.save();

    res.status(200).json({ message: 'Left event successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Organiser: get their events with participant list ─────────────────────────
exports.getOrganiserDashboard = async (req, res) => {
  try {
    const { organiserUid } = req.params;
    const organiser = await User.findOne({ firebaseUid: organiserUid });
    if (!organiser) return res.status(404).json({ message: 'Organiser not found.' });

    const events = await Event.find({ createdBy: organiser._id })
      .populate('participants', 'name email xp')
      .sort({ date: -1 });

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Organiser: mark event as completed + record attendance + award XP ─────────
exports.completeEvent = async (req, res) => {
  try {
    const { eventId, organiserUid, attendedUids = [], kgCollected = 0 } = req.body;

    const organiser = await User.findOne({ firebaseUid: organiserUid });
    const event     = await Event.findById(eventId);
    if (!organiser || !event)
      return res.status(404).json({ message: 'Organiser or event not found.' });
    if (!event.createdBy.equals(organiser._id))
      return res.status(403).json({ message: 'Not your event.' });

    event.status           = 'completed';
    event.attended         = attendedUids;
    event.totalKgCollected = kgCollected;
    await event.save();

    // Award bonus XP to each attended volunteer
    const perVolunteerKg = attendedUids.length > 0
      ? kgCollected / attendedUids.length
      : 0;

    for (const uid of attendedUids) {
      const vol = await User.findOne({ firebaseUid: uid });
      if (!vol) continue;
      vol.totalKgCollected   = (vol.totalKgCollected   || 0) + perVolunteerKg;
      vol.totalHoursVolunteered = (vol.totalHoursVolunteered || 0) + 3; // assume 3h per event
      vol.co2SavedTons       = (vol.co2SavedTons       || 0) + (perVolunteerKg * 0.0021); // rough CO₂ factor
      updateMonthlyActivity(vol, { kgCollected: perVolunteerKg });
      awardXP(vol, XP.ATTEND_EVENT, 'ATTEND_EVENT');
      _updateStreak(vol);
      checkCertificates(vol);
      await vol.save();
    }

    // Update organiser stats
    organiser.totalVolunteersManaged =
      (organiser.totalVolunteersManaged || 0) + attendedUids.length;
    await organiser.save();

    res.status(200).json({ message: 'Event marked complete. XP awarded.', attendedCount: attendedUids.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Rate an event (volunteer rates after attending) ───────────────────────────
exports.rateEvent = async (req, res) => {
  try {
    const { eventId, firebaseUid, rating } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const newCount  = event.ratingCount + 1;
    event.rating    = ((event.rating * event.ratingCount) + rating) / newCount;
    event.ratingCount = newCount;
    await event.save();

    res.status(200).json({ message: 'Rated.', avgRating: Math.round(event.rating * 10) / 10 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Volunteer's impact report ─────────────────────────────────────────────────
exports.getVolunteerReport = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const user = await User.findOne({ firebaseUid })
      .select('name xp level totalEventsJoined totalScans totalKgCollected totalHoursVolunteered co2SavedTons monthlyActivity certProgress badges streak');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Geofence: volunteer location ping ─────────────────────────────────────────
exports.postGeofenceLocation = async (req, res) => {
  try {
    const { eventId, firebaseUid, lat, long, lng, timestamp } = req.body;
    const lon = lng != null ? lng : long;
    if (!eventId || !firebaseUid || lat == null || lon == null) {
      return res.status(400).json({ message: 'eventId, firebaseUid, lat, lng required.' });
    }

    const okRate = await rateLimitGeo(`rate:geofence:${firebaseUid}:${eventId}`, 20, 60);
    if (!okRate) return res.status(429).json({ message: 'Too Many Requests', error: 'Too Many Requests' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (!event.participants.includes(firebaseUid)) {
      return res.status(403).json({ message: 'Not registered for this event.' });
    }

    const hasFence =
      (event.geofenceLat != null && event.geofenceLng != null) ||
      (event.geofenceCoordinates && event.geofenceCoordinates.length);
    if (!hasFence) {
      return res.status(400).json({ message: 'Geofence not configured for this event.', active: false });
    }

    const now = new Date();
    const { start, end } = getGeofenceWindow(event);
    if (!start || !end) {
      return res.status(400).json({ message: 'Event times missing for geofence.', active: false });
    }
    if (now < start) {
      return res.json({ status: 'inactive', inside: false, reason: 'before_start', active: false });
    }
    if (now > end) {
      return res.json({ status: 'inactive', inside: false, reason: 'after_end', active: false });
    }

    const inside = pointInGeofence(event, Number(lat), Number(lon));
    const ts = timestamp ? new Date(typeof timestamp === 'number' && timestamp < 1e12 ? timestamp * 1000 : timestamp) : now;
    await GeofencePing.create({
      eventId: event._id,
      firebaseUid,
      lat: Number(lat),
      lng: Number(lon),
      inside,
      ts,
    });

    res.json({ status: inside ? 'inside' : 'outside', inside, active: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Geofence: organiser attendance table ──────────────────────────────────────
exports.getGeofenceAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { organiserUid } = req.query;
    if (!organiserUid) return res.status(400).json({ message: 'organiserUid required.' });

    const organiser = await User.findOne({ firebaseUid: organiserUid });
    const event     = await Event.findById(eventId);
    if (!organiser || !event) return res.status(404).json({ message: 'Not found.' });
    if (!event.createdBy.equals(organiser._id)) {
      return res.status(403).json({ message: 'Not your event.' });
    }

    const participants = event.participants || [];
    const win = getGeofenceWindow(event);
    const start = win.start || new Date(0);
    const end   = win.end || new Date(8640000000000000);

    const presentRows = await GeofencePing.distinct('firebaseUid', {
      eventId: event._id,
      inside: true,
      ts: { $gte: start, $lte: end },
    });
    const presentSet = new Set(presentRows);

    const users = await User.find({ firebaseUid: { $in: participants } }).select('firebaseUid name');
    const nameByUid = new Map(users.map(u => [u.firebaseUid, u.name]));

    const rows = participants.map(uid => ({
      firebaseUid: uid,
      name: nameByUid.get(uid) || uid.slice(0, 8),
      status: presentSet.has(uid) ? 'present' : 'absent',
    }));

    res.json({ eventId: event._id, eventName: event.name, rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Internal: streak helper ───────────────────────────────────────────────────
function _updateStreak(user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!user.lastActiveDate) {
    user.streak = 1;
  } else {
    const last = new Date(user.lastActiveDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - last) / 86400000);
    if (diffDays === 0) return;
    user.streak = diffDays === 1 ? user.streak + 1 : 1;
  }
  user.lastActiveDate = new Date();
}