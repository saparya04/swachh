const mongoose = require('mongoose');

const GeofencePingSchema = new mongoose.Schema({
  eventId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  firebaseUid: { type: String, required: true, index: true },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  inside:      { type: Boolean, required: true },
  ts:          { type: Date, default: Date.now },
});

module.exports = mongoose.model('GeofencePing', GeofencePingSchema);
