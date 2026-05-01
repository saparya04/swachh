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
const { spawn } = require('child_process');
const path = require('path');


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



exports.generateEventPoster = async (req, res) => {
  const eventId = req.params.eventId;

  console.log(`[generateEventPoster] Started for event: ${eventId}`);

  try {
    // 1. Fetch event
    const event = await Event.findById(eventId);
    if (!event) {
      console.log(`[generateEventPoster] Event not found: ${eventId}`);
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    console.log(`[generateEventPoster] Event found: ${event.name}`);

    // 2. Format date
    const niceDate = new Date(event.date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) || 'Date TBD';

    // 3. Python script path – relative + logging
    const pythonScriptPath = path.join(__dirname, '..', 'scripts', 'poscap.py');

    console.log(`[generateEventPoster] Looking for script at: ${pythonScriptPath}`);

    const fs = require('fs');
    if (!fs.existsSync(pythonScriptPath)) {
      console.error(`[generateEventPoster] Script file MISSING: ${pythonScriptPath}`);
      return res.status(500).json({
        success: false,
        message: 'Poster script file not found on server'
      });
    }

    // 4. Use correct python command for Windows
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    console.log(`[generateEventPoster] Using command: ${pythonCmd}`);

    // 5. Spawn with --event-id (your latest Python expects this)
    const python = spawn(pythonCmd, [
      pythonScriptPath,
      '--event-id', eventId.toString()
    ]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[Python OUT] ${data.toString().trim()}`);
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[Python ERR] ${data.toString().trim()}`);
    });

    python.on('error', (err) => {
      console.error(`[generateEventPoster] Spawn failed: ${err.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to start Python process',
        error: err.message
      });
    });

    // python.on('close', (code) => {
    //   console.log(`[generateEventPoster] Python exited with code ${code}`);

    //   if (code !== 0) {
    //     return res.status(500).json({
    //       success: false,
    //       message: 'Python script failed',
    //       pythonError: stderr.slice(0, 500) || 'No error output'
    //     });
    //   }

    //   // Find POSTER_PATH line
    //   // const posterPathMatch = stdout.match(/POSTER_PATH:(.+)/);
    //   const match = stdout.match(/POSTER_OUTPUT:(\{.*\})/);

    //   let htmlPath = null;
    //   let pngPath = null;

    //   if (match) {
    //     const parsed = JSON.parse(match[1]);
    //     htmlPath = parsed.html;
    //     pngPath = parsed.png;
    //   }

    //   const posterPath = posterPathMatch ? posterPathMatch[1].trim() : null;

    //   if (!posterPath || !fs.existsSync(posterPath)) {
    //     return res.status(500).json({
    //       success: false,
    //       message: 'Poster file not created'
    //     });
    //   }

    //   // const filename = path.basename(posterPath);
    //   // const baseUrl = process.env.BASE_URL || 'http://192.168.0.195:5000';
    //   // const posterUrl = `${baseUrl}/SwachhMitra/backend/posters/${filename}`;

    //   // console.log(`[generateEventPoster] Success - URL: ${posterUrl}`);

      
    //   // 1. Get just the filename (e.g., "poster_BEACH_CLEAN_UP_20260220_143733.png")
    //   const filename = path.basename(posterPath);
      
    //   // 2. Build the clean URL that matches server.js
    //   //const baseUrl = 'http://192.168.0.195:5000'; 
    //   const baseUrl = 'http://192.168.0.196:5000';        //chnage url for poster on ui
    //   const posterUrl = `${baseUrl}/posters/${filename}`;
    //   console.log(posterUrl); 

    //   console.log(`[generateEventPoster] Success - Clean URL: ${posterUrl}`);

    //   res.json({
    //     success: true,
    //     posterUrl:posterUrl,
    //     eventName: event.name
    //   });
    // });
    //NNEWWWWWWWWWWWWWWWWWWW
    python.on('close', (code) => {
  console.log(`[generateEventPoster] Python exited with code ${code}`);

  if (code !== 0) {
    return res.status(500).json({
      success: false,
      message: 'Python script failed',
      pythonError: stderr.slice(0, 500) || 'No error output'
    });
  }

  const fs = require('fs');

  // ✅ Read BOTH HTML + PNG from Python
  const match = stdout.match(/POSTER_OUTPUT:(\{.*\})/);

  let htmlPath = null;
  let pngPath = null;

  if (match) {
    const parsed = JSON.parse(match[1]);
    htmlPath = parsed.html;
    pngPath = parsed.png;
  }

  // ❌ If HTML missing → fail
  if (!htmlPath || !fs.existsSync(htmlPath)) {
    return res.status(500).json({
      success: false,
      message: 'HTML poster not created'
    });
  }

  // ✅ Build URLs
const baseUrl = 'http://192.168.0.102:5000';

  const htmlFilename = path.basename(htmlPath);
  const htmlUrl = `${baseUrl}/posters/${htmlFilename}`;

  let pngUrl = null;
  if (pngPath && fs.existsSync(pngPath)) {
    const pngFilename = path.basename(pngPath);
    pngUrl = `${baseUrl}/posters/${pngFilename}`;
  }

  console.log("HTML URL:", htmlUrl);
  console.log("PNG URL:", pngUrl);

  // ✅ FINAL RESPONSE
  res.json({
    success: true,
    htmlUrl,
    pngUrl,
    eventName: event.name
  });
});
  } catch (err) {
    console.error(`[generateEventPoster] Crash:`, err.stack);
    res.status(500).json({
      success: false,
      message: 'Internal error during poster generation',
      error: err.message
    });
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

function eventDurationHours(ev) {
  const win = getGeofenceWindow(ev);
  const start = win.start;
  const end = win.end;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  let ms = end.getTime() - start.getTime();
  if (ms < 0) ms += 86400000;
  return ms / 3600000;
}

// ── Volunteer's impact report ─────────────────────────────────────────────────
exports.getVolunteerReport = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const user = await User.findOne({ firebaseUid })
      .select('name xp level totalEventsJoined totalScans totalKgCollected totalHoursVolunteered co2SavedTons monthlyActivity certProgress badges streak finalAiBagSamples finalAiItemCount');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const eventsJoinedCount = await Event.countDocuments({ participants: firebaseUid });

    const now = new Date();
    const joinedEvents = await Event.find({ participants: firebaseUid });
    let volunteerHoursPastEvents = 0;
    for (const ev of joinedEvents) {
      const win = getGeofenceWindow(ev);
      if (!win.end || win.end >= now) continue;
      volunteerHoursPastEvents += eventDurationHours(ev);
    }

    const samples = user.finalAiBagSamples || [];
    let finalAiAvgBagPercent = 0;
    if (samples.length > 0) {
      finalAiAvgBagPercent =
        samples.reduce((s, x) => s + (Number(x.bagPercent) || 0), 0) / samples.length;
    }
    const last = samples.length ? samples[samples.length - 1] : null;
    const finalAiLatestBagPercent = last ? Number(last.bagPercent) || 0 : 0;
    const finalAiItemCount = user.finalAiItemCount || 0;
    const CO2_PER_ITEM_TONS = 0.02;
    const co2SavedFromFinalAiTons = finalAiItemCount * CO2_PER_ITEM_TONS;

    const payload = user.toObject();
    delete payload.finalAiBagSamples;

    payload.eventsJoinedCount = eventsJoinedCount;
    payload.volunteerHoursPastEvents = Math.round(volunteerHoursPastEvents * 10) / 10;
    payload.finalAiAvgBagPercent = Math.round(finalAiAvgBagPercent * 10) / 10;
    payload.finalAiLatestBagPercent = Math.round(finalAiLatestBagPercent * 10) / 10;
    payload.finalAiSampleCount = samples.length;
    payload.finalAiItemCount = finalAiItemCount;
    payload.co2SavedFromFinalAiTons = Math.round(co2SavedFromFinalAiTons * 100) / 100;

    res.status(200).json(payload);
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