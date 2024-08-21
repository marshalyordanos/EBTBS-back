const { User } = require("../models/models");
const bcrypt = require("bcryptjs");

exports.createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      firstName,
      lastName,
      phoneNumber,
      role,
    } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      username,
      password: passwordHash,
      email,
      firstName,
      lastName,
      phoneNumber,
      role,
    });
    await user.save();

    res.status(200).json({ msg: "User created successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id, username, email, firstName, lastName, phoneNumber, role } =
      req.body;

    await User.findByIdAndUpdate(id, {
      $set: {
        username,
        email,
        firstName,
        lastName,
        phoneNumber,
        role,
      },
    });

    res.status(200).json({ msg: "User updated Successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { password, id } = req.body;
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    await User.findByIdAndUpdate(id, {
      password: passwordHash,
    });
    res.status(200).json({ msg: "Password changed successfully" });
  } catch (error) {}
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    return res
      .status(200)
      .json({ msg: "User fetched successfully", data: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error occured" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -__v");
    return res
      .status(200)
      .json({ msg: "Users fetched successfully", data: users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error occured" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ msg: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error occured" });
  }
};
