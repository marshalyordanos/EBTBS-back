const express = require("express");
const router = express.Router();

const {
  createRegion,
  updateRegion,
  getRegion,
  getRegions,
  deleteRegion,
} = require("../controllers/regionController");

const {
  authMiddleware,
  roleMiddleware,
} = require("../middlewares/authMiddleware");

// Region Routes
router.post("/create", authMiddleware, roleMiddleware(["admin"]), createRegion);
router.get("/", authMiddleware, roleMiddleware(["admin"]), getRegions);
router.get("/:id", authMiddleware, getRegion);
router.post("/update", authMiddleware, roleMiddleware(["admin"]), updateRegion);
router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteRegion
);

module.exports = router;
