const mongoose= require("mongoose");
const { Form, Site, Region } = require("../models/models");
const { checkMonth } = require("../utils/helper");
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && (new mongoose.Types.ObjectId(id)).toString() === id;
}

exports.createForm = async (req, res) => {
  try {
    const { siteId, dueDate, date } = req.body;
    // let form = await Form.find({ siteId, date });

    // Extract month and year from the incoming date
    const submittedDate = new Date(date);
    const submittedMonth = submittedDate.getMonth();
    const submittedYear = submittedDate.getFullYear();

    // Query for documents with the same siteId, month, and year
    const existingForm = await Form.findOne({
      siteId,
      date: {
        $gte: new Date(submittedYear, submittedMonth, 1),
        $lt: new Date(submittedYear, submittedMonth + 1, 1),
      },
    });

    if (existingForm) {
      return res
        .status(400)
        .json({ message: "Form already exists for this month and year" });
    }

    const isThisMonth = checkMonth(date);
    if (!isThisMonth) {
      return res.status(500).json({
        message: "Submission month must be the same as the current month",
      });
    }

    const form = new Form({ siteId, date, dueDate, indicators: {} });
    await form.save();
    res.status(201).json({ message: "Form created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json("Failed to create form");
  }
};

exports.updateForm = async (req, res) => {
  try {
    const {  dueDate, date, siteId, isPublished } = req.body;
    const { id } = req.params;
    await Form.findByIdAndUpdate(id, {
      $set: {
        dueDate,
        date,
        siteId,
        isPublished,
      },
    });

    res.status(200).json({ message: "Form updated Successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Save or update the form in increments
exports.saveForm = async (req, res) => {
  try {
    const { siteId, dueDate, date, indicators,next } = req.body;
    const submittedDate = new Date(date);

    const month = submittedDate.getMonth();
    const year = submittedDate.getFullYear();

    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    // Start of the next month (1st of August, 2024 at midnight)
    const endDate = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
    // console.log(submittedDate);
    // console.log(`Start Date: ${startDate.toISOString()}`);
    // console.log(`End Date: ${endDate.toISOString()}`, siteId);

    const form = await Form.findOne({
      siteId: siteId,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });
    // console.log(form);
    if (!form) {
      return res.status(404).json({ message: "form not found" });
    }

    const isThisMonth = checkMonth(form.date);
    if (!isThisMonth) {
      return res.status(500).json({
        message: "Submission month must be the same as the current month",
      });
    }

    if (!form.isPublished) {
      return res.status(400).json({ message: "Form not published yet" });
    }
    const site = await Site.findById(form.siteId);
    if (!site) {
      return res.status(404).json({ message: "no site found" });
    }

    const formattedDueDate = new Date(form.dueDate).getTime();
    const currentDate = Date.now();
    if (formattedDueDate < currentDate) {
      return res.status(500).json({ message: "form is overdue" });
    }

// validate
  const total_work_doners =indicators.student_donors+indicators.government_employee_donors+indicators.private_employee_donors+indicators.self_employed_donors+indicators.unemployed_donors+indicators.other_donors

const total_age_donors = indicators.under18_donors+indicators.age18to24_donors+indicators.age25to34_donors+indicators.age35to44_donors+indicators.age45to54_donors+indicators.age55to64_donors+indicators.over65_donors
  // console.log("next",next)
 if(next==0){
  if(indicators.total_blood_donations != (indicators.first_time_donors+indicators.repeat_donors)){
    return res.status(400).json({ message: "total blood donations must be equal to the Summation of first time donors and repeat donors!" });
  }
  if(indicators.total_blood_donations != total_work_doners){
    return res.status(400).json({ message: "total blood donations must be equal to the Summation of each work group donors!" });
  }
 }

 else if(next ==1){
  if(form.indicators.total_blood_donations != indicators.male_donors+indicators.female_donors){
    return res.status(400).json({ message: "total blood donations must be equal to the Summation male and female donors!" });
  }
  if(form.indicators.total_blood_donations != total_age_donors){
    return res.status(400).json({ message: "total blood donations must be equal to the Summation with all age group" });
  }
 }else if(next ==2){
  if(form.indicators.total_blood_donations != indicators.donations_from_mobile+indicators.donations_fromCenter){
    return res.status(400).json({ message: "total blood donations must be equal to the Summation mobile and center donors!" });
  }
 }

    // Update the form data with the new indicators
    Object.assign(form.indicators, indicators);

    await form.save();
    res.status(200).json({ message: "Successfully form saved", form });
  } catch (error) {
    res.status(500).json({ message: "Failed to save form", error: error.message });
  }
};

exports.getForms = async (req, res) => {
  try {
    const {  month, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    let siteId

    const query = {};
    // if (siteId) {
    //   query.siteId = siteId;
    // }

    // if (month) {
    //   const [year, monthIndex] = month.split("-").map(Number);
    //   query.date = {
    //     $gte: new Date(year, monthIndex - 1, 1),
    //     $lt: new Date(year, monthIndex, 1),
    //   };

    // }
    if(req.user.role=="site_coordiantor"){
     
      r = await Site.findOne({coordinatorId:req.user._id})
      siteId = r._id
      query.siteId = siteId
    }
    if(req.user.role == 'regional_manager'){
      r = await Region.findOne({managerId:req.user._id})
      const regionId = r._id
      const sites = await Site.find({ regionId }).select('_id');
      const siteIds = sites.map(site => site._id);
      console.log("siteIds",siteIds)
      query.siteId =  { $in: siteIds }
    }

    
    const forms = await Form.find(query)
      .populate("siteId")
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const totalForms = await Form.countDocuments(query).exec();

    res.status(200).json({
      totalForms,
      totalPages: Math.ceil(totalForms / limit),
      currentPage: parseInt(page),
      forms: forms.map((form) => ({
        id: form._id,
        siteId: form.siteId,
        coordinatorId: form.coordinatorId,
        date: form.date,
        region: form.region,
        dueDate: form.dueDate,
        isPublished: form.isPublished,
        indicators: form.indicators,
        __v: form.__v,
      })),
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getIndicatorReport = async (req, res) => {
  const { fromDate, toDate, regionId } = req.query;

  try {
    // Get the site IDs that belong to the specified region
    const sites = await Site.find({ regionId }).select('_id');
    const siteIds = sites.map(site => site._id);

    // Perform the aggregation
    const result = await Form.aggregate([
      {
        $match: {
          siteId: { $in: siteIds },
          date: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        },
      },
      {
        $group: {
          _id: "$siteId", // Group by siteId
          total_blood_donations: { $sum: "$indicators.total_blood_donations" },
          first_time_donors: { $sum: "$indicators.first_time_donors" },
          repeat_donors: { $sum: "$indicators.repeat_donors" },
          student_donors: { $sum: "$indicators.student_donors" },
          government_employee_donors: { $sum: "$indicators.government_employee_donors" },
          private_employee_donors: { $sum: "$indicators.private_employee_donors" },
          self_employed_donors: { $sum: "$indicators.self_employed_donors" },
          unemployed_donors: { $sum: "$indicators.unemployed_donors" },
          other_donors: { $sum: "$indicators.other_donors" },
          male_donors: { $sum: "$indicators.male_donors" },
          female_donors: { $sum: "$indicators.female_donors" },


        },
      },
      {
        $lookup: {
          from: 'sites',
          localField: '_id',
          foreignField: '_id',
          as: 'site',
        },
      },
      {
        $unwind: '$site',
      },
      {
        $project: {
          _id: 0,
          siteId: '$_id',
          siteName: '$site.name',
          total_blood_donations: 1, // Include the total blood donations sum in the result
          first_time_donors: 1, // Include the total blood donations sum in the result
          repeat_donors: 1, // Include the total blood donations sum in the result
          student_donors: 1, // Include the total blood donations sum in the result
          government_employee_donors: 1, // Include the total blood donations sum in the result
          private_employee_donors: 1, // Include the total blood donations sum in the result
          self_employed_donors: 1, // Include the total blood donations sum in the result
          unemployed_donors: 1, // Include the total blood donations sum in the result
          other_donors: 1, // Include the total blood donations sum in the result
          male_donors: 1, // Include the total blood donations sum in the result
          female_donors: 1, // Include the total blood donations sum in the result

        },
      },
    ]);

    // Send the result back to the client
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getIndicatorReport:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
exports.getHomeDashboard = async (req, res) => {
  let { regionId, siteId, type } = req.query;
  if(req.user.role=="regional_manager"){
    type="region"
    r = await Region.findOne({managerId:req.user._id})
    regionId = r._id
  }
  if(req.user.role=="site_coordiantor"){
    type="site"
    r = await Site.findOne({coordinatorId:req.user._id})
console.log("+====================",r)
    siteId = r._id
  }
  try {
    let matchStage = {}; // No date filtering
    let groupStage = {
      _id: null,
      total_blood_donations: { $sum: "$indicators.total_blood_donations" },
      first_time_donors: { $sum: "$indicators.first_time_donors" },
      repeat_donors: { $sum: "$indicators.repeat_donors" },
      student_donors: { $sum: "$indicators.student_donors" },
      government_employee_donors: { $sum: "$indicators.government_employee_donors" },
      private_employee_donors: { $sum: "$indicators.private_employee_donors" },
      self_employed_donors: { $sum: "$indicators.self_employed_donors" },
      unemployed_donors: { $sum: "$indicators.unemployed_donors" },
      other_donors: { $sum: "$indicators.other_donors" },
      male_donors: { $sum: "$indicators.male_donors" },
      female_donors: { $sum: "$indicators.female_donors" },
      under18_donors: { $sum: "$indicators.under18_donors" },


    };
    let projectStage = {
      _id: 0,
      total_blood_donations: 1,
      first_time_donors: 1,
      repeat_donors: 1,
      student_donors: 1,
      government_employee_donors: 1,
      private_employee_donors: 1,
      self_employed_donors: 1,
      unemployed_donors: 1,
      other_donors: 1,
      male_donors: 1,
      female_donors: 1,
      under18_donors: 1,

    };

    // Construct the aggregation pipeline based on the type
    if (type === 'all') {
      // No additional match or group stages needed for 'all'
    } else if (type === 'site') {
      if (!siteId) {
        return res.status(400).json({ message: 'siteId is required for type "site"' });
      }
      console.log("siteId",siteId)
      // if (!siteId || !isValidObjectId(siteId)) {
      //   return res.status(400).json({ message: 'Invalid siteId for type "site"' });
      // }
      matchStage.siteId = siteId;
      // groupStage._id = "$siteId";
      // projectStage.siteId = "$_id";
      // projectStage.siteName = "$siteName";
    } else if (type === 'region') {
      if (!regionId) {
        return res.status(400).json({ message: 'regionId is required for type "region"' });
      }
      const sites = await Site.find({ regionId }).select('_id');
      const siteIds = sites.map(site => site._id);
      matchStage.siteId = { $in: siteIds };
      // groupStage._id = "$siteId";
      // projectStage.siteId = "$_id";
      // projectStage.siteName = "$siteName";
    } else {
      return res.status(400).json({ message: 'Invalid type parameter' });
    }

    // Execute the aggregation pipeline
    const result = await Form.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      {
        $lookup: {
          from: 'sites',
          localField: '_id',
          foreignField: '_id',
          as: 'site',
        },
      },
      { $unwind: { path: '$site', preserveNullAndEmptyArrays: true } },
      { $project: projectStage },
    ]);

    // Send the result back to the client
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getIndicatorReport:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.getFormById = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findById(id).populate("siteId");

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.status(200).json(form);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};
