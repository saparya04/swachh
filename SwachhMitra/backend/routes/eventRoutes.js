const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/eventController');

router.post('/create',                        ctrl.createEvent);
router.get('/all',                            ctrl.getAllEvents);
router.post('/join',                          ctrl.joinEvent);
router.post('/leave',                         ctrl.leaveEvent);
router.get('/organiser-stats/:organiserUid',  ctrl.getOrganiserDashboard);
router.post('/complete',                      ctrl.completeEvent);
router.post('/rate',                          ctrl.rateEvent);
router.get('/volunteer-report/:firebaseUid',  ctrl.getVolunteerReport);

router.post('/geofence/location',              ctrl.postGeofenceLocation);
router.get('/:eventId/geofence-attendance',    ctrl.getGeofenceAttendance);

const reportController = require('../controllers/reportController');

// Existing routes...
router.get('/report/:eventId', reportController.getEventReport);

module.exports = router;