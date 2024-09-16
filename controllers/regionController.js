const { Region, User, Site } = require("../models/models");
const APIFeature = require("../utils/apiFeature");

exports.createRegion = async (req, res) => {
  try {
    const { name, managerId } = req.body;

    // Check if user exists
    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(400).json({ message: "manager not found" });
    }
    const region = new Region({
      name,
      managerId,
    });
    await region.save();
    res.status(200).json({ msg: "Region created successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

exports.updateRegion = async (req, res) => {
  try {
    const {  managerId, name } = req.body;
    const {id} = req.params

    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(400).json({ message: "manager not found" });
    }
    await Region.findByIdAndUpdate(id, {
      $set: {
        managerId,
        name,
      },
    });

    res.status(200).json({ msg: "Region updated Successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

exports.getRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const region = await Region.findById(id).populate("managerId");
    const isAllowed = region.managerId === req.user._id || req.user.role === "admin"
    
    if(!isAllowed){
        return res.status(403).json({msg: "Not allowed"})
    }
    if (!region) {
      return res.status(404).json({ msg: "Region not found" });
    }
    return res
      .status(200)
      .json({ msg: "Region fetched successfully", data: region });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error occured" });
  }
};

exports.getRegions = async (req, res) => {
  try {
    if(req.query.searchText){
      req.query.name =  { $regex: req.query.searchText, $options: "i" } 
      }
      if(req.user.role=="regional_manager"){
        req.query.managerId = req.user._id
      }
      console.log("req.use",req.user)
      const feature = new APIFeature(Region.find(), req.query)
      .filter()
      .sort()
      .fields()
      .paging();
      const regions = await feature.query.populate("managerId");
    const count = await Region.countDocuments({});
      
    // const regions = await Region.find().populate("managerId");
    if (!regions) {
      return res.status.json({ msg: "No region found" });
    }
    return res
      .status(200)
      .json({ msg: "Region fetched successfully", data: regions,total:count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error occured" });
  }
};

exports.deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const region = await Region.findById(id)
    if(!region){
   return res.status(404).json({ message: "Region not found" });

    }
    const site = await Site.find({regionId:region._id})
    console.log("site: " ,site.length)
    if(site.length>0){
      return res.status(404).json({ message: "signed Region can be deleted !" });

    }
    await Region.findByIdAndDelete(id);
    res.status(200).json({ msg: "Region deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error occured" });
  }
};
