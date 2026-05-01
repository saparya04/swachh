const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/userController');
const User = require('../models/User');

// Auth / registration
router.post('/register-data',    ctrl.saveUserData);
router.get('/role/:firebaseUid', ctrl.getUserRole);

// Profile
router.get('/profile/:firebaseUid', ctrl.getProfile);

// Leaderboard
router.get('/leaderboard', ctrl.getLeaderboard);

// Certificate progress
router.get('/cert-progress/:firebaseUid', ctrl.getCertProgress);

// Waste scan logging
router.post('/log-scan', ctrl.logScan);

// Rewards bonuses (cleanup zone + Final AI bag)
router.post('/report-final-ai-bag', ctrl.reportFinalAiBag);
router.post('/claim-rewards-bonuses', ctrl.claimRewardsBonuses);

// Settings
router.post('/update-settings', ctrl.updateUserSettings);

// // Chat – list users by role
// router.get('/list-by-role/:role', ctrl.listByRole);
router.get('/list-by-role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    // Use .lean() for faster performance and .select() to get only what we need
    const users = await User.find({ role: role.toLowerCase() })
      .select('name firebaseUid role')
      .lean();

    // If no users found, return an empty array instead of crashing
    res.status(200).json(users || []);
  } catch (err) {
    // This console log will show the EXACT error in your Terminal/Command Prompt
    console.error("CRASH in list-by-role:", err); 
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// CSR
router.post('/sponsor-event',       ctrl.sponsorEvent);
router.get('/csr-stats/:firebaseUid', ctrl.getCSRStats);

// Organiser stats
router.get('/organiser-stats/:firebaseUid', ctrl.getOrganiserStats);

module.exports = router;