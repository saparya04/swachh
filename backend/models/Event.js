// const mongoose = require('mongoose');

// // Define the schema for an event document in MongoDB.
// const EventSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//     },
//     date: {
//         type: Date,
//         required: true,
//     },
//     time: {
//         type: String,
//         required: true,
//     },
//     volunteersRequired: {
//         type: Number,
//         required: true,
//         min: 1,
//     },
//     location: {
//         type: String,
//         required: true,
//     },
//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     }
// });

// const Event = mongoose.model('Event', EventSchema);
// module.exports = Event;

// models/Event.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    volunteersRequired: { type: Number, required: true, min: 1 },
    location: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // NEW: Array of user references
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);