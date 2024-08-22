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
router.post("/", authMiddleware, roleMiddleware(["admin"]), createSite);
router.get("/", authMiddleware, roleMiddleware(["admin"]), getSites);
router.get("/:id", authMiddleware, getSite);
router.patch("/:id", authMiddleware, roleMiddleware(["admin"]), updateSite);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteSite
);

module.exports = router;
