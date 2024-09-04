const express = require("express");
const router = express.Router();
const {
  saveForm,
  createForm,
  updateForm,
  getForms,
  getFormById,
  getHomeDashboard,
  getIndicatorReport,
} = require("../controllers/formController");
const {
  roleMiddleware,
  authMiddleware,
} = require("../middlewares/authMiddleware");

router.post(
  "/save",
  authMiddleware,
  //   roleMiddleware(["admin", "site_coordinator"]),
  saveForm
);
router.get(
  "/home",
  authMiddleware,
  // roleMiddleware(["admin"]),
  getHomeDashboard
);
router.get("/report", authMiddleware, getIndicatorReport);

router.get(
  "/",authMiddleware,
  //   roleMiddleware(["admin", "site_coordinator"]),
  getForms
);
router.get(
  "/:id",
  //   roleMiddleware(["admin", "site_coordinator"]),
  getFormById
);

router.patch("/:id", updateForm);
router.post(
  "/",
  // roleMiddleware(["admin"]),
  createForm
);

module.exports = router;
