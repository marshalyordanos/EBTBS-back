const express = require("express");
const router = express.Router();

const {
  authMiddleware,
  roleMiddleware,
} = require("../middlewares/authMiddleware");
const { getSetting, createSetting } = require("../controllers/settingController");

router.post("/", authMiddleware, roleMiddleware(["admin"]), createSetting);
router.get("/", authMiddleware, roleMiddleware(["admin"]), getSetting);


module.exports = router;
