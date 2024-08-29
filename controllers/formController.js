const { Form, Site } = require("../models/models");
const { checkMonth } = require("../utils/helper");

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
        .json({ msg: "Form already exists for this month and year" });
    }

    const isThisMonth = checkMonth(date);
    if (!isThisMonth) {
      return res.status(500).json({
        msg: "Submission month must be the same as the current month",
      });
    }

    const form = new Form({ siteId, date, dueDate, indicators: {} });
    await form.save();
    res.status(201).json({ msg: "Form created successfully" });
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

    res.status(200).json({ msg: "Form updated Successfully" });
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
      return res.status(404).json({ msg: "form not found" });
    }

    const isThisMonth = checkMonth(form.date);
    if (!isThisMonth) {
      return res.status(500).json({
        msg: "Submission month must be the same as the current month",
      });
    }

    if (!form.isPublished) {
      return res.status(400).json({ msg: "Form not published yet" });
    }
    const site = await Site.findById(form.siteId);
    if (!site) {
      return res.status(404).json({ msg: "no site found" });
    }

    const formattedDueDate = new Date(form.dueDate).getTime();
    const currentDate = Date.now();
    if (formattedDueDate < currentDate) {
      return res.status(500).json({ msg: "form is overdue" });
    }

// validate
  const total_work_doners =indicators.student_donors+indicators.government_employee_donors+indicators.private_employee_donors+indicators.self_employed_donors+indicators.unemployed_donors+indicators.other_donors

const total_age_donors = indicators.under18_donors+indicators.age18to24_donors+indicators.age25to34_donors+indicators.age35to44_donors+indicators.age45to54_donors+indicators.age55to64_donors+indicators.over65_donors
  console.log("next",next)
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
    res.status(200).json({ msg: "Successfully form saved", form });
  } catch (error) {
    res.status(500).json({ msg: "Failed to save form", error: error.message });
  }
};

exports.getForms = async (req, res) => {
  try {
    const { siteId, month, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (siteId) {
      query.siteId = siteId;
    }

    if (month) {
      const [year, monthIndex] = month.split("-").map(Number);
      query.date = {
        $gte: new Date(year, monthIndex - 1, 1),
        $lt: new Date(year, monthIndex, 1),
      };
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
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getFormById = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findById(id).populate("siteId");

    if (!form) {
      return res.status(404).json({ msg: "Form not found" });
    }

    res.status(200).json(form);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Server error" });
  }
};
