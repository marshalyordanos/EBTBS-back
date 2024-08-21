const express = require("express");
const router = express.Router();
const {
  createSite,
  updateSite,
  getSite,
  getSites,
  deleteSite,
} = require("../controllers/siteController");

const {
  authMiddleware,
  roleMiddleware,
} = require("../middlewares/authMiddleware");

// Site Routes
router.post("/create", authMiddleware, roleMiddleware(["admin"]), createSite);
router.get("/", authMiddleware, roleMiddleware(["admin"]), getSites);
router.get("/:id", authMiddleware, getSite);
router.post("/update", authMiddleware, roleMiddleware(["admin"]), updateSite);
router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteSite
);

module.exports = router;
