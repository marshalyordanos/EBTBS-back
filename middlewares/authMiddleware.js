const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppErorr = require("../utils/appError");
const { User } = require("../models/models");

const authMiddleware = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization ||
    req.headers.authorization?.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(new AppErorr("yor are not logged in", 401));
  }

  const decoded = jwt.verify(token, "some_secrete");
  console.log("dec", decoded);
  const freshUser = await User.findOne({ _id: decoded.userId });
  if (!freshUser) {
    return next(new AppErorr("the user is does not exist", 401));
  }

  req.user = freshUser;
  next();
});

const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

module.exports = { authMiddleware, roleMiddleware };
