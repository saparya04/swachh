const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  date:               { type: Date,   required: true },
  time:               { type: String, required: true },
  endTime:            { type: String, required: true },
  volunteersRequired: { type: Number, required: true, min: 1 },
  location:           { type: String, required: true },
  description:        { type: String, default: '' },
  imageUrl:           { type: String, default: '' },

  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Array of Firebase UIDs — keeps .includes() / .indexOf() working in frontend
  participants: [{ type: String }],

  // Completed participants (Firebase UIDs) — marked after event ends
  attended:     [{ type: String }],

  // Per-event waste totals (updated when organiser marks event complete)
  totalKgCollected: { type: Number, default: 0 },
  rating:           { type: Number, default: 0 },
  ratingCount:      { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },

  // Geofencing (auto-filled on create from date/time/endTime + geocoded location)
  geofenceDateYmd:    { type: String },
  geofenceStartAt:    { type: Date },
  geofenceEndAt:      { type: Date },
  geofenceLat:        { type: Number },
  geofenceLng:        { type: Number },
  geofenceRadiusM:    { type: Number, default: 200 },
  // Optional GeoJSON-style rings: [ [[lng,lat], ...] ] — overrides circle when set
  geofenceCoordinates: { type: mongoose.Schema.Types.Mixed },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', EventSchema);