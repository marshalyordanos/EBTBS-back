const { Site, User } = require("../models/models");
const APIFeature = require("../utils/apiFeature");

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
    const {  coordinatorId, name } = req.body;
    const {id} = req.params

    const coordinator = await User.findById(coordinatorId);
    if (!coordinator) {
      return res.status(400).json({ message: "Coordinator not found" });
    }
    console.log("=====",coordinatorId,name)
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
    if(req.query.searchText){
    req.query.name =  { $regex: req.query.searchText, $options: "i" } 
    }
    const feature = new APIFeature(Site.find(), req.query)
    .filter()
    .sort()
    .fields()
    .paging();
    const sites = await feature.query.populate("coordinatorId");
  const count = await Site.countDocuments({});
    

    if (!sites) {
      return res.status(404).json({ msg: "No site found" });
    }
    return res
      .status(200)
      .json({ msg: "Site fetched successfully", data: sites ,total:count});
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
