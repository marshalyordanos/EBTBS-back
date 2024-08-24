const express = require("express");
const router = express.Router();
const {
  saveForm,
  createForm,
  updateForm,
  getForms,
  getFormById,
} = require("../controllers/formController");
const { roleMiddleware } = require("../middlewares/authMiddleware");

router.post(
  "/save",
  //   roleMiddleware(["admin", "site_coordinator"]),
  saveForm
);

router.get(
  "/",
  //   roleMiddleware(["admin", "site_coordinator"]),
  getForms
);
router.get(
  "/form/:id",
  //   roleMiddleware(["admin", "site_coordinator"]),
  getFormById
);

router.post("/update", updateForm);
router.post(
  "/",
  // roleMiddleware(["admin"]),
  createForm
);

module.exports = router;
