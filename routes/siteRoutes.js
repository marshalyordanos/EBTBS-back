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
router.post("/", authMiddleware, roleMiddleware(["admin","regional_manager"]), createSite);
router.get("/", authMiddleware, roleMiddleware(["admin","regional_manager"]), getSites);
router.get("/:id", authMiddleware, getSite);
router.patch("/:id", authMiddleware, roleMiddleware(["admin","regional_manager"]), updateSite);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin","regional_manager"]),
  deleteSite
);

module.exports = router;
