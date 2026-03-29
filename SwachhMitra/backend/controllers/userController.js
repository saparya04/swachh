const User = require('../models/User.js');
const { awardXP, checkCertificates, updateMonthlyActivity, XP } = require('../helpers/progressHelper');

// ── Register ──────────────────────────────────────────────────────────────────
exports.saveUserData = async (req, res) => {
  const { firebaseUid, name, email, role, location } = req.body;
  if (!firebaseUid || !name || !email || !role || !location)
    return res.status(400).json({ message: 'Missing required fields.' });

  try {
    const newUser = new User({ firebaseUid, name, email, role, location });
    await newUser.save();
    return res.status(201).json({
      message: 'User registered.',
      user: { firebaseUid, name, email, role, location },
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'User already exists.' });
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── Get user role + basic info on login ──────────────────────────────────────
exports.getUserRole = async (req, res) => {
  const { firebaseUid } = req.params;
  try {
    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── Full profile (used by Settings & Reports screens) ─────────────────────────
exports.getProfile = async (req, res) => {
  const { firebaseUid } = req.params;
  try {
    const user = await User.findOne({ firebaseUid })
      .populate('registeredEvents', 'name date location status');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── Leaderboard (volunteers ranked by XP) ────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const top = await User.find({ role: 'volunteer' })
      .sort({ xp: -1 })
      .limit(20)
      .select('firebaseUid name location xp level badges');

    // Attach rank numbers
    const ranked = top.map((u, i) => ({
      rank:    i + 1,
      firebaseUid: u.firebaseUid,
      name:    u.name,
      location:u.location,
      xp:      u.xp,
      level:   u.level,
      badges:  u.badges.length,
      avatar:  u.name.charAt(0).toUpperCase(),
    }));

    return res.status(200).json(ranked);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch leaderboard.' });
  }
};

// ── Certificate progress for a volunteer ─────────────────────────────────────
exports.getCertProgress = async (req, res) => {
  const { firebaseUid } = req.params;
  try {
    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Recompute cert progress to ensure it's fresh
    checkCertificates(user);
    await user.save();

    return res.status(200).json(user.certProgress);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch cert progress.' });
  }
};

// ── Log a waste scan + award XP ──────────────────────────────────────────────
exports.logScan = async (req, res) => {
  const { firebaseUid, itemName, category } = req.body;
  if (!firebaseUid) return res.status(400).json({ message: 'firebaseUid required.' });
  try {
    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Update counters
    user.totalScans += 1;
    user.scanLog.push({ itemName: itemName || 'Unknown', category: category || 'Unknown' });
    updateMonthlyActivity(user, { scans: 1 });

    // Award XP
    awardXP(user, XP.SCAN_ITEM, 'SCAN_ITEM');

    // Update streak
    _updateStreak(user);

    // Check certificate unlocks
    const newCerts = checkCertificates(user);

    await user.save();
    return res.status(200).json({
      message: 'Scan logged.',
      xpAwarded: XP.SCAN_ITEM,
      totalXP: user.xp,
      newCertsUnlocked: newCerts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to log scan.' });
  }
};

// ── Update settings ───────────────────────────────────────────────────────────
exports.updateUserSettings = async (req, res) => {
  try {
    const { firebaseUid, isDark, notifications } = req.body;
    const update = {};
    if (isDark !== undefined)       update.isDark       = isDark;
    if (notifications !== undefined) update.notifications = notifications;

    const user = await User.findOneAndUpdate({ firebaseUid }, { $set: update }, { new: true });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating settings.' });
  }
};

// ── List users by role (for chat) ─────────────────────────────────────────────
exports.listByRole = async (req, res) => {
  try {
    const role = req.params.role.toLowerCase();
    const users = await User.find({ role }).select('firebaseUid name role location');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ── CSR: Sponsor an event ─────────────────────────────────────────────────────
exports.sponsorEvent = async (req, res) => {
  const { firebaseUid, eventId, amount } = req.body;
  if (!firebaseUid || !eventId || !amount)
    return res.status(400).json({ message: 'firebaseUid, eventId and amount required.' });
  try {
    const user = await User.findOne({ firebaseUid, role: 'csr' });
    if (!user) return res.status(404).json({ message: 'CSR user not found.' });

    user.eventsSponsored.push({ eventId, amount });
    user.totalFunded = (user.totalFunded || 0) + Number(amount);
    await user.save();

    res.status(200).json({ message: 'Event sponsored.', totalFunded: user.totalFunded });
  } catch (err) {
    res.status(500).json({ message: 'Failed to sponsor event.' });
  }
};

// ── CSR dashboard stats ───────────────────────────────────────────────────────
exports.getCSRStats = async (req, res) => {
  const { firebaseUid } = req.params;
  try {
    const user = await User.findOne({ firebaseUid, role: 'csr' })
      .populate('eventsSponsored.eventId', 'name date location participants');
    if (!user) return res.status(404).json({ message: 'CSR user not found.' });

    return res.status(200).json({
      totalFunded:      user.totalFunded,
      eventsSponsored:  user.eventsSponsored,
      treesPlanted:     user.treesPlanted,
      co2OffsetTons:    user.co2OffsetTons,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch CSR stats.' });
  }
};

// ── Organiser analytics ───────────────────────────────────────────────────────
exports.getOrganiserStats = async (req, res) => {
  const { firebaseUid } = req.params;
  try {
    const user = await User.findOne({ firebaseUid, role: 'organiser' });
    if (!user) return res.status(404).json({ message: 'Organiser not found.' });

    const Event = require('../models/Event');
    const events = await Event.find({ createdBy: user._id })
      .select('name date location participants volunteersRequired status totalKgCollected rating');

    const totalVolunteers = events.reduce((s, e) => s + (e.participants?.length || 0), 0);
    const avgRating       = events.filter(e => e.ratingCount > 0)
      .reduce((s, e, _, a) => s + e.rating / a.length, 0);

    return res.status(200).json({
      eventsCreated:         events.length,
      totalVolunteersManaged:totalVolunteers,
      avgEventRating:        Math.round(avgRating * 10) / 10 || 0,
      events,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch organiser stats.' });
  }
};

// ── Internal: streak updater ──────────────────────────────────────────────────
function _updateStreak(user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!user.lastActiveDate) {
    user.streak = 1;
  } else {
    const last = new Date(user.lastActiveDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - last) / 86400000);
    if (diffDays === 0) return;           // same day, no change
    if (diffDays === 1) user.streak += 1; // consecutive day
    else                user.streak = 1;  // streak broken
  }
  user.lastActiveDate = new Date();
}