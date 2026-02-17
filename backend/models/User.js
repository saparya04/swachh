const mongoose = require('mongoose');

// Define the schema for a user document in MongoDB.
// This data is saved AFTER Firebase successfully authenticates the user.
const UserSchema = new mongoose.Schema({
    // Store the unique ID provided by Firebase for linking
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true // Indexing for fast lookups
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['volunteer', 'csr', 'organiser'], // Restrict roles
        required: true
    },
    location: {
        type: String,
        required: true
    },
    // Optional: add a creation timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;