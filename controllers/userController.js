const { User, Site, Region } = require("../models/models");
const bcrypt = require("bcryptjs");
const APIFeature = require("../utils/apiFeature");

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
    console.log("body", req.body);

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

    res.status(200).json({ message: "User created successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, email, firstName, lastName, phoneNumber, role } =
      req.body;
    const { id } = req.params;

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

    res.status(200).json({ message: "User updated Successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { newPassword, oldPassword, id } = req.body;
    const user = await User.findById(id).select("+password");

    if (req.user._id != id) {
      return res.status(403).json({ message: "You have not permission" });
    }
    // Hash password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "You are not correct the password" });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(id, {
      password: passwordHash,
    });
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {}
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    return res
      .status(200)
      .json({ message: "User fetched successfully", data: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error occured" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    // const users = await User.find().select("-password -__v");

    if (req.query.searchText) {
      req.query = {
        ...req.query,
        ...{
          $or: [
            { username: { $regex: req.query.searchText, $options: "i" } },
            { email: { $regex: req.query.searchText, $options: "i" } },
          ],
        },
      };
    }

    const feature = new APIFeature(User.find(), req.query)
      .filter()
      .sort()
      .fields()
      .paging();
    const users = await feature.query.select("-password -__v");
    const count = await User.countDocuments({});
    return res
      .status(200)
      .json({ message: "Users fetched successfully", data: users, total: count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error occured" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
    if(!user){
   return res.status(404).json({ message: "User not found" });

    }
    console.log(user.role)
    if(user.role == "site_coordiantor"){
      const site = await Site.find({coordinatorId:user._id})
      console.log("site: " ,site.length)
      if(site.length>0){
    return res.status(404).json({ message: "signed site cordianator can be deleted!" });

      }

    }
    if(user.role == "regional_manager"){
      const region = await Region.find({managerId:user._id})
      if(region.length>0){
    return res.status(404).json({ message: "signed site cordianator can be deleted!" });

      }

    }
    console.log(user._id.equals(req.user._id))
    if (user._id.equals(req.user._id)){
    return res.status(404).json({ message: "can't delete your self!" });

    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("error:  ",error);
   return res.status(500).json({ message: "Error occured" });
  }
};
