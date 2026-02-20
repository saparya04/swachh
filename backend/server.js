const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const userRoutes = require('./routes/userRoutes.js');
const eventRoutes = require('./routes/eventRoute');     //NEW

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const path = require('path');

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/posters', express.static(path.join(__dirname, 'posters'))); 

// --- Database Connection ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connection successful!'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process if connection fails
  });

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('SwachhMitra Backend is running!');
});

app.get('/test-poster-route', (req, res) => {
  res.json({ message: "Poster route is reachable (GET test)" });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
});