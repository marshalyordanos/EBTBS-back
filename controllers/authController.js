const { User, Token } = require("../models/models");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const filterObj = require("../utils/pick");

// Configure transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register a new user
exports.register = async (req, res) => {
  const { username, email, password, firstName, lastName, phoneNumber, role } =
    req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role,
      isVerified: false, // Set to false fist
    });

    await newUser.save();

    // Create email verification token
    const token = crypto.randomBytes(32).toString("hex");
    await Token.create({
      userId: newUser._id.toString(), // Convert ObjectId to string
      token: token,
      expireAt: Date.now() + 3600000, // 1 hour expiration
    });

    // Send verification email
    const verificationLink = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;
    await transporter.sendMail({
      to: email,
      subject: "Email Verification",
      html: `<p>Thank you for registering. Please verify your email by clicking the following link: <a href="${verificationLink}">${verificationLink}</a></p>`,
    });

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification instructions.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const tokenDoc = await Token.findOne({
      token: token,
      expireAt: { $gt: Date.now() }, // Check if token is still valid
    });

    if (!tokenDoc)
      return res.status(400).json({
        message: "Email verification token is invalid or has expired",
      });

    const user = await User.findById(tokenDoc.userId);
    if (!user)
      return res
        .status(400)
        .json({ message: "User associated with this token does not exist" });

    if (user.isVerified)
      return res.status(400).json({ message: "Email is already verified" });

    user.isVerified = true;
    await user.save();

    await Token.deleteMany({ userId: user._id.toString() }); // Remove all tokens for the user

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// User login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const resUser = filterObj(
      user["_doc"],
      "firstName",
      "lastName",
      "username",
      "email",
      "phone",
      "role",
      "phoneNumber",
      "_id"
    );

    return res.json({ token, user: resUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Request password reset
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Email not verified" });

    const token = crypto.randomBytes(32).toString("hex");
    await Token.create({
      userId: user._id.toString(),
      token: token,
      expireAt: Date.now() + 3600000, // 1 hour expiration
    });

    const resetLink = `${process.env.BASE_URL}/api/auth/reset-password?token=${token}`;

    await transporter.sendMail({
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    });

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const tokenDoc = await Token.findOne({
      token: token,
      expireAt: { $gt: Date.now() }, // Check if token is still valid
    });

    if (!tokenDoc)
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired" });

    const user = await User.findById(tokenDoc.userId);
    if (!user)
      return res
        .status(400)
        .json({ message: "User associated with this token does not exist" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    await Token.deleteMany({ userId: user._id.toString() }); // Remove all tokens for the user

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
