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
} = require("../controllers/userController");

// User Routes
router.post("/create", createUser);
router.post("/change-password", authMiddleware, changePassword);

router.get("/", authMiddleware, roleMiddleware(["admin"]), getUsers);
router.get("/:id", authMiddleware, roleMiddleware(["admin"]), getUser);
router.patch(
  "/update/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateUser
);
router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteUser
);  

module.exports = router;
