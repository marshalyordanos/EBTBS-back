const express = require("express");
const router = express.Router();
const {
  authMiddleware,
  roleMiddleware,
} = require("../middlewares/authMiddleware");
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
  ResetPassword,
  deleteUser2,
} = require("../controllers/userController");

// User Routes
router.post("/create", createUser);
router.post("/change-password", authMiddleware, changePassword);
router.post("/reset-password", authMiddleware, ResetPassword);

router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, roleMiddleware(["admin"]), getUser);
router.patch(
  "/update/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateUser
);
router.patch(
  "/delete2/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteUser2
);
router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteUser
);

module.exports = router;
