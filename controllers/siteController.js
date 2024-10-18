const { Site, User, Region } = require("../models/models");
const APIFeature = require("../utils/apiFeature");

exports.createSite = async (req, res) => {
  try {
    const { name, coordinatorId, regionId } = req.body;

    // Check if user exists
    const coordinator = await User.findById(coordinatorId);
    if (!coordinator) {
      return res.status(400).json({ message: "Coordinator not found" });
    }
    const site = new Site({
      name,
      coordinatorId,
      regionId,
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
    const { coordinatorId, name, regionId, target } = req.body;
    const { id } = req.params;

    if (coordinatorId) {
      const coordinator = await User.findById(coordinatorId);
      if (!coordinator) {
        return res.status(400).json({ message: "Coordinator not found" });
      }
    }
    console.log("=====", coordinatorId, name);
    await Site.findByIdAndUpdate(id, {
      $set: {
        target,
        coordinatorId,
        name,
        regionId,
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
    const site = await Site.findById(id)
      .populate("coordinatorId")
      .populate("regionId");

    // const isAllowed =
    //   region.managerId === req.user._id || req.user.role === "admin";

    // if (!isAllowed) {
    //   return res.status(403).json({ msg: "Not allowed" });
    // }
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
    // const sites = await Site.find().populate("coordinatorId");
    if (req.query.searchText) {
      req.query.name = { $regex: req.query.searchText, $options: "i" };
    }
    if (req.user.role == "regional_manager") {
      r = await Region.findOne({ managerId: req.user._id });
      regionId = r._id;
      req.query.regionId = regionId;
    }
    if (req.user.role == "site_coordiantor") {
      req.query.coordinatorId = req.user._id;
    }
    const feature = new APIFeature(Site.find(), req.query)
      .filter()
      .sort()
      .fields()
      .paging();
    const sites = await feature.query
      .populate("coordinatorId")
      .populate("regionId");
    let count = await Site.countDocuments({});
    if (req.user.role == "regional_manager") {
      count = await Site.countDocuments({ regionId: regionId });
    }
    if (req.user.role == "site_coordiantor") {
      count = await Site.countDocuments({ coordinatorId: coordinatorId });
    }

    if (!sites) {
      return res.status(404).json({ msg: "No site found" });
    }
    return res
      .status(200)
      .json({ msg: "Site fetched successfully", data: sites, total: count });
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
