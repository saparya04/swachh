const mongoose = require('mongoose');

// ── Badge sub-schema ──────────────────────────────────────────────────────────
const BadgeSchema = new mongoose.Schema({
  id:       { type: String, required: true },   // e.g. 'eco_warrior'
  title:    { type: String, required: true },
  emoji:    { type: String, default: '🏅' },
  earnedAt: { type: Date, default: Date.now },
}, { _id: false });

// ── Waste-scan log sub-schema (per scan entry) ────────────────────────────────
const ScanLogSchema = new mongoose.Schema({
  itemName:  { type: String },
  category:  { type: String, enum: ['Dry', 'Wet', 'Hazardous', 'E-Waste', 'Unknown'], default: 'Unknown' },
  scannedAt: { type: Date, default: Date.now },
}, { _id: false });

// ── Monthly activity sub-schema ───────────────────────────────────────────────
const MonthlyActivitySchema = new mongoose.Schema({
  month:     { type: String },  // e.g. "2025-03"
  kgCollected: { type: Number, default: 0 },
  eventsJoined: { type: Number, default: 0 },
  scans:     { type: Number, default: 0 },
}, { _id: false });

// ── Certificate progress sub-schema ──────────────────────────────────────────
const CertProgressSchema = new mongoose.Schema({
  certId:    { type: String, required: true },  // e.g. 'zero_waste_hero'
  current:   { type: Number, default: 0 },
  max:       { type: Number, required: true },
  earned:    { type: Boolean, default: false },
  earnedAt:  { type: Date },
}, { _id: false });

// ── CSR sponsorship sub-schema ────────────────────────────────────────────────
const SponsorshipSchema = new mongoose.Schema({
  eventId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  amount:     { type: Number, default: 0 },
  sponsoredAt:{ type: Date, default: Date.now },
}, { _id: false });

// ── Main User Schema ──────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  role:        { type: String, enum: ['volunteer', 'csr', 'organiser'], required: true },
  location:    { type: String, required: true },

  // ── Volunteer fields ────────────────────────────────────────────────────────
  xp:                { type: Number, default: 0 },
  level:             { type: Number, default: 1 },
  rank:              { type: Number, default: 0 },           // computed & cached
  totalEventsJoined: { type: Number, default: 0 },
  totalScans:        { type: Number, default: 0 },
  totalKgCollected:  { type: Number, default: 0 },
  totalHoursVolunteered: { type: Number, default: 0 },
  co2SavedTons:      { type: Number, default: 0 },
  streak:            { type: Number, default: 0 },           // consecutive active days
  lastActiveDate:    { type: Date },

  badges:            { type: [BadgeSchema], default: [] },
  scanLog:           { type: [ScanLogSchema], default: [] },
  monthlyActivity:   { type: [MonthlyActivitySchema], default: [] },
  certProgress:      { type: [CertProgressSchema], default: [] },

  registeredEvents:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  referrals:         { type: Number, default: 0 },

  // ── Organiser fields ────────────────────────────────────────────────────────
  eventsCreated:     { type: Number, default: 0 },
  totalVolunteersManaged: { type: Number, default: 0 },
  avgEventRating:    { type: Number, default: 0 },

  // ── CSR fields ─────────────────────────────────────────────────────────────
  totalFunded:       { type: Number, default: 0 },           // in INR
  eventsSponsored:   { type: [SponsorshipSchema], default: [] },
  treesPlanted:      { type: Number, default: 0 },
  co2OffsetTons:     { type: Number, default: 0 },

  // ── Shared settings ─────────────────────────────────────────────────────────
  isDark:       { type: Boolean, default: false },
  notifications:{ type: Boolean, default: true },

  // ── Rewards bonuses (volunteer) ────────────────────────────────────────────
  rewardsGeofenceBonusDayIST: { type: String, default: '' },
  finalAiBagBonusEligible:     { type: Boolean, default: false },

  // ── Final AI bag classifier (impact report) ────────────────────────────────
  finalAiBagSamples: [{
    bagPercent: { type: Number },
    recordedAt: { type: Date, default: Date.now },
  }],
  /** Each logged Final AI reading counts as one item → CO₂ = count × 0.02 t */
  finalAiItemCount: { type: Number, default: 0 },

  createdAt:    { type: Date, default: Date.now },
});

// ── Indexes ───────────────────────────────────────────────────────────────────
UserSchema.index({ xp: -1, role: 1 });   // fast leaderboard queries

module.exports = mongoose.model('User', UserSchema);