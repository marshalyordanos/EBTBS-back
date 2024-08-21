const express = require("express");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middlewares/authMiddleware");
const router = express.Router();

// Protected route just to demonstrate
router.get("/admin", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  res.json({ message: "This is an admin protected route", user: req.user });
});

router.get(
  "/coordinator",
  authMiddleware,
  roleMiddleware(["site_coordinator"]),
  (req, res) => {
    res.json({
      message: "This is a site coordinator protected route",
      user: req.user,
    });
  }
);

module.exports = router;
