// const Event = require('../models/Event');
// const User = require('../models/User'); // to get organiser _id from firebaseUid

// exports.createEvent = async (req, res) => {
//     try {
//         const { name, date, time, volunteersRequired, location, organiserUid } = req.body;

//         // Find organiser user by firebaseUid
//         const organiser = await User.findOne({ firebaseUid: organiserUid });
//         if (!organiser) return res.status(404).json({ message: 'Organiser not found' });

//         const newEvent = new Event({
//             name,
//             date,
//             time,
//             volunteersRequired,
//             location,
//             createdBy: organiser._id, // attach organiser reference
//         });

//         await newEvent.save();
//         res.status(201).json({ message: 'Event created successfully', event: newEvent });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

const Event = require('../models/Event');
const User = require('../models/User');
const { spawn } = require('child_process');
const path = require('path');

// ────────────────────────────────────────────────
// Existing functions (unchanged)
// ────────────────────────────────────────────────

exports.createEvent = async (req, res) => {
    try {
        const { name, date, time, volunteersRequired, location, organiserUid } = req.body;
        const organiser = await User.findOne({ firebaseUid: organiserUid });
        if (!organiser) return res.status(404).json({ message: 'Organiser not found' });

        const newEvent = new Event({
            name, date, time, volunteersRequired, location,
            createdBy: organiser._id,
        });

        await newEvent.save();
        res.status(201).json({ message: 'Event created successfully', event: newEvent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('createdBy', 'name');
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.joinEvent = async (req, res) => {
    try {
        const { eventId, firebaseUid } = req.body;
        const user = await User.findOne({ firebaseUid });
        const event = await Event.findById(eventId);

        if (!event.participants.includes(user._id)) {
            event.participants.push(user._id);
            await event.save();
        }
        res.status(200).json({ message: 'Joined successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrganiserDashboard = async (req, res) => {
    try {
        const { organiserUid } = req.params;
        const organiser = await User.findOne({ firebaseUid: organiserUid });
        const events = await Event.find({ createdBy: organiser._id }).populate('participants', 'name email');
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ────────────────────────────────────────────────
// UPDATED: Generate Poster function
// ────────────────────────────────────────────────

// ... top of file remains the same ...

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
  const baseUrl = 'http://192.168.0.196:5000';

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