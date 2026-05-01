const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/userController');

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

// Chat – list users by role
router.get('/list-by-role/:role', ctrl.listByRole);

// CSR
router.post('/sponsor-event',       ctrl.sponsorEvent);
router.get('/csr-stats/:firebaseUid', ctrl.getCSRStats);

// Organiser stats
router.get('/organiser-stats/:firebaseUid', ctrl.getOrganiserStats);

module.exports = router;