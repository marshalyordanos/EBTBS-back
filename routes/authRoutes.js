const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// Register route
router.post("/register", register);

//verify email
router.get("/verify-email", verifyEmail);
// Login route
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
