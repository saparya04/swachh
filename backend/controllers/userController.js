    const User = require('../models/User.js');

    /**
     * Endpoint to save user profile data (name, role, location, etc.) to MongoDB 
     * after the user is successfully created in Firebase.
     */
    exports.saveUserData = async (req, res) => {
        const { firebaseUid, name, email, role, location } = req.body;

        // Basic validation
        if (!firebaseUid || !name || !email || !role || !location) {
            return res.status(400).json({ message: 'Missing required user registration fields.' });
        }

        try {
            // Create a new user document in MongoDB
            const newUser = new User({
                firebaseUid,
                name,
                email,
                role,
                location
            });

            await newUser.save();

            // Respond with success and the saved user data
            return res.status(201).json({ 
                message: 'User data saved successfully to MongoDB.',
                user: { firebaseUid, name, email, role, location }
            });

        } catch (error) {
            // Handle MongoDB errors (e.g., duplicate UID or email)
            if (error.code === 11000) {
                return res.status(409).json({ message: 'User already exists with this email or Firebase UID.' });
            }
            console.error('Error saving user data to MongoDB:', error);
            return res.status(500).json({ message: 'Internal server error while saving data.' });
        }
    };

    /**
     * Optional: Endpoint to get user role upon login (by Firebase UID)
     */
    exports.getUserRole = async (req, res) => {
        const { firebaseUid } = req.params;

        try {
            const user = await User.findOne({ firebaseUid: firebaseUid }, 'role name'); // Fetch only role and name

            if (!user) {
                return res.status(404).json({ message: 'User not found in database.' });
            }

            return res.status(200).json({ role: user.role, name: user.name });

        } catch (error) {
            console.error('Error fetching user role:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    };

    exports.updateUserSettings = async (req, res) => {
    try {
        const { firebaseUid, isDark } = req.body;
        const user = await User.findOneAndUpdate(
            { firebaseUid },
            { $set: { isDark: isDark } },
            { new: true }
        );
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error updating settings" });
    }
};


