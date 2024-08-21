const { Site, User } = require("../models/models");

exports.createSite = async (req, res) => {
  try {
    const { name, coordinatorId } = req.body;

    // Check if user exists
    const coordinator = await User.findById(coordinatorId);
    if (!coordinator) {
      return res.status(400).json({ message: "Coordinator not found" });
    }
    const site = new Site({
      name,
      coordinatorId,
    });
    await site.save();
    res.status(200).json({ msg: "Site created successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

exports.updateSite = async (req, res) => {
  try {
    const { id, coordinatorId, name } = req.body;

    const coordinator = await User.findById(coordinatorId);
    if (!coordinator) {
      return res.status(400).json({ message: "Coordinator not found" });
    }
    await Site.findByIdAndUpdate(id, {
      $set: {
        coordinatorId,
        name,
      },
    });

    res.status(200).json({ msg: "Site updated Successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

exports.getSite = async (req, res) => {
  try {
    const { id } = req.params;
    const site = await Site.findById(id).populate("coordinatorId");

    const isAllowed =
      region.managerId === req.user._id || req.user.role === "admin";

    if (!isAllowed) {
      return res.status(403).json({ msg: "Not allowed" });
    }
    if (!site) {
      return res.status(404).json({ msg: "Site not found" });
    }
    return res
      .status(200)
      .json({ msg: "Site fetched successfully", data: site });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error occured" });
  }
};

exports.getSites = async (req, res) => {
  try {
    const sites = await Site.find().populate("coordinatorId");
    if (!sites) {
      return res.status(404).json({ msg: "No site found" });
    }
    return res
      .status(200)
      .json({ msg: "Site fetched successfully", data: sites });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error occured" });
  }
};

exports.deleteSite = async (req, res) => {
  try {
    const { id } = req.params;
    await Site.findByIdAndDelete(id);
    res.status(200).json({ msg: "Site deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error occured" });
  }
};
