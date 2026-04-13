const Event = require('../models/Event');
const User = require('../models/User');

exports.getEventReport = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId).populate('participants', 'name');

        if (!event) return res.status(404).json({ message: "Event not found" });

        // Logic: Real data from DB
        const totalRegistered = event.participants ? event.participants.length : 0;
        
        // Simulating attendance verification logic based on your Geofencing status
        // In a live system, you would query the Attendance collection
        const verifiedAttendees = Math.floor(totalRegistered * 0.85); 

        const reportData = {
            eventTitle: event.name,
            date: new Date(event.date).toDateString(),
            region: event.location || "Mumbai Metro",
            organizer: "SwachhMitra Partner NGO",
            metrics: {
                totalRegistered: totalRegistered,
                verifiedAttendance: `${verifiedAttendees} Volunteers`,
                attendanceRate: `${((verifiedAttendees/totalRegistered)*100).toFixed(1)}%`,
                totalWasteCollected: "412 kg", // Stubbed
                segregationEfficiency: "92%"   // Stubbed
            },
            financials: {
                totalFundAllocated: "₹75,000", // Stubbed
                fundUsed: "₹68,400",          // Stubbed
                costPerVolunteer: "₹550"      // Stubbed
            },
            esgImpact: "Successfully mitigated plastic flow into local water bodies, aligning with SDG 14."
        };

        res.status(200).json(reportData);
    } catch (error) {
        res.status(500).json({ message: "Error generating report", error: error.message });
    }
};