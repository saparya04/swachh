const express = require("express");
const userController = require("../controllers/userController");
const router = express.Router();

// Route to save the user's details to MongoDB after successful Firebase registration
router.post("/register-data", userController.saveUserData);

// Route to fetch the user's role from MongoDB after Firebase login
router.get("/role/:firebaseUid", userController.getUserRole);
router.put("/settings", userController.updateUserSettings);

module.exports = router;
