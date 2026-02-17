// const express = require('express');
// const router = express.Router();
// const eventController = require('../controllers/eventController');

// // Create a new event
// router.post('/create', eventController.createEvent);
// // router.post("/create", async (req, res) => {
// //   try {
// //     const newEvent = new Event(req.body);
// //     await newEvent.save();

// //     // Broadcast to all connected clients in real time
// //     const io = req.app.get("io");
// //     io.emit("newEventCreated", newEvent);

// //     res.status(201).json(newEvent);
// //   } catch (error) {
// //     console.error("Error creating event:", error);
// //     res.status(500).json({ message: error.message });
// //   }
// // });


// module.exports = router;

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// ────────────────────────────────────────────────
// Existing routes (unchanged)
router.post('/create', eventController.createEvent);
router.get('/all', eventController.getAllEvents);
router.post('/join', eventController.joinEvent);
router.get('/organiser-stats/:organiserUid', eventController.getOrganiserDashboard);

// ────────────────────────────────────────────────
// NEW ROUTE: Generate poster for a specific event
router.post('/:eventId/generate-poster', eventController.generateEventPoster);

module.exports = router;