const mongoose = require("mongoose");
const { Form, Site, Region } = require("../models/models");
const { checkMonth } = require("../utils/helper");
function isValidObjectId(id) {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    new mongoose.Types.ObjectId(id).toString() === id
  );
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
    const { dueDate, date, siteId, isPublished } = req.body;
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
    const { siteId, dueDate, date, indicators, next } = req.body;
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
    const total_work_doners =
      indicators.student_donors +
      indicators.government_employee_donors +
      indicators.private_employee_donors +
      indicators.self_employed_donors +
      indicators.unemployed_donors +
      indicators.other_donors;

    const total_age_donors =
      indicators.under18_donors +
      indicators.age18to24_donors +
      indicators.age25to34_donors +
      indicators.age35to44_donors +
      indicators.age45to54_donors +
      indicators.age55to64_donors +
      indicators.over65_donors;
    // console.log("next",next)
    if (next == 0) {
      if (
        indicators.total_blood_donations !=
        indicators.first_time_donors + indicators.repeat_donors
      ) {
        return res
          .status(400)
          .json({
            message:
              "total blood donations must be equal to the Summation of first time donors and repeat donors!",
          });
      }
      if (indicators.total_blood_donations != total_work_doners) {
        return res
          .status(400)
          .json({
            message:
              "total blood donations must be equal to the Summation of each work group donors!",
          });
      }
    } else if (next == 1) {
      if (
        form.indicators.total_blood_donations !=
        indicators.male_donors + indicators.female_donors
      ) {
        return res
          .status(400)
          .json({
            message:
              "total blood donations must be equal to the Summation male and female donors!",
          });
      }
      if (form.indicators.total_blood_donations != total_age_donors) {
        return res
          .status(400)
          .json({
            message:
              "total blood donations must be equal to the Summation with all age group",
          });
      }
    } else if (next == 2) {
      if (
        form.indicators.total_blood_donations !=
        indicators.donations_from_mobile + indicators.donations_fromCenter
      ) {
        return res
          .status(400)
          .json({
            message:
              "total blood donations must be equal to the Summation mobile and center donors!",
          });
      }
    }

    // Update the form data with the new indicators
    Object.assign(form.indicators, indicators);

    await form.save();
    res.status(200).json({ message: "Successfully form saved", form });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to save form", error: error.message });
  }
};

exports.getForms = async (req, res) => {
  try {
    const { month, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    let siteId;

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
    if (req.user.role == "site_coordiantor") {
      r = await Site.findOne({ coordinatorId: req.user._id });
      siteId = r._id;
      query.siteId = siteId;
    }
    if (req.user.role == "regional_manager") {
      r = await Region.findOne({ managerId: req.user._id });
      const regionId = r._id;
      const sites = await Site.find({ regionId }).select("_id");
      const siteIds = sites.map((site) => site._id);
      console.log("siteIds", siteIds);
      query.siteId = { $in: siteIds };
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
    const sites = await Site.find({ regionId }).select("_id");
    const siteIds = sites.map((site) => site._id);

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
          familyr_eplacement_donations: { $sum: "$indicators.familyr_eplacement_donations" },

          first_time_donors: { $sum: "$indicators.first_time_donors" },
          repeat_donors: { $sum: "$indicators.repeat_donors" },
          student_donors: { $sum: "$indicators.student_donors" },
          government_employee_donors: {
            $sum: "$indicators.government_employee_donors",
          },
          private_employee_donors: {
            $sum: "$indicators.private_employee_donors",
          },
          self_employed_donors: { $sum: "$indicators.self_employed_donors" },
          unemployed_donors: { $sum: "$indicators.unemployed_donors" },
          other_donors: { $sum: "$indicators.other_donors" },
          male_donors: { $sum: "$indicators.male_donors" },
          female_donors: { $sum: "$indicators.female_donors" },

          under18_donors: { $sum: "$indicators.under18_donors" },
          age18to24_donors: { $sum: "$indicators.age18to24_donors" },
          age25to34_donors: { $sum: "$indicators.age25to34_donors" },
          age35to44_donors: { $sum: "$indicators.age35to44_donors" },
          age45to54_donors: { $sum: "$indicators.age45to54_donors" },
          age55to64_donors: { $sum: "$indicators.age55to64_donors" },
          over65_donors: { $sum: "$indicators.over65_donors" },
          apheresis_donations: { $sum: "$indicators.apheresis_donations" },
          donations_fromCenter: { $sum: "$indicators.donations_fromCenter" },
          donations_from_mobile: { $sum: "$indicators.donations_from_mobile" },
          mobile_sessions_conducted: { $sum: "$indicators.mobile_sessions_conducted" },
          active_blood_donor_clubs: { $sum: "$indicators.active_blood_donor_clubs" },
          adr_fainting: { $sum: "$indicators.adr_fainting" },
          adr_fainting_withLoss_of_consciousness: { $sum: "$indicators.adr_fainting_withLoss_of_consciousness" },
          adr_seizure: { $sum: "$indicators.adr_seizure" },
          adr_technical_problem: { $sum: "$indicators.adr_technical_problem" },
          donor_refusals: { $sum: "$indicators.donor_refusals" },
          other_adrs: { $sum: "$indicators.other_adrs" },
          permanent_deferrals_dueToTtis: { $sum: "$indicators.permanent_deferrals_dueToTtis" },
          deferrals_by_low_weight: { $sum: "$indicators.deferrals_by_low_weight" },
          deferrals_by_age: { $sum: "$indicators.deferrals_by_age" },
          deferrals_by_pregnancy_lactation: { $sum: "$indicators.deferrals_by_pregnancy_lactation" },


          deferrals_by_blood_pressure: { $sum: "$indicators.deferrals_by_blood_pressure" },
          deferrals_by_low_hemoglobin: { $sum: "$indicators.deferrals_by_low_hemoglobin" },
          deferrals_by_other_medical_conditions: { $sum: "$indicators.deferrals_by_other_medical_conditions" },
          deferrals_by_high_risk_behavior: { $sum: "$indicators.deferrals_by_high_risk_behavior" },
          deferrals_by_travel_history: { $sum: "$indicators.deferrals_by_travel_history" },
          deferrals_by_other_reasons: { $sum: "$indicators.deferrals_by_other_reasons" },
          post_donation_counselling_system: { $sum: "$indicators.post_donation_counselling_system" },
          referral_for_positive_ttis_donors: { $sum: "$indicators.referral_for_positive_ttis_donors" },
          pre_donation_information_given: { $sum: "$indicators.pre_donation_information_given" },
          pre_donation_counselling: { $sum: "$indicators.pre_donation_counselling" },
          post_donation_counselling_service: { $sum: "$indicators.post_donation_counselling_service" },
          post_donation_counselling_from_mobile: { $sum: "$indicators.post_donation_counselling_from_mobile" },
          post_donation_counselling_from_center: { $sum: "$indicators.post_donation_counselling_from_center" },
          non_reactive_donors_receiving_pdc: { $sum: "$indicators.non_reactive_donors_receiving_pdc" },
          reactive_donors_receiving_pdc: { $sum: "$indicators.reactive_donors_receiving_pdc" },
          referred_reactive_donors_receiving_pdc: { $sum: "$indicators.referred_reactive_donors_receiving_pdc" },
          donations_screened_for_ttis: { $sum: "$indicators.donations_screened_for_ttis" },
          samples_screened_for_ttis: { $sum: "$indicators.samples_screened_for_ttis" },
          samples_screened_for_blood_group: { $sum: "$indicators.samples_screened_for_blood_group" },
          samples_screened_for_blood_group_quality_assured: { $sum: "$indicators.samples_screened_for_blood_group_quality_assured" },
          ttis_positive: { $sum: "$indicators.ttis_positive" },
          hiv_positive: { $sum: "$indicators.hiv_positive" },
          hepatitis_b_positive: { $sum: "$indicators.hepatitis_b_positive" },

          hepatitis_c_positive: { $sum: "$indicators.hepatitis_c_positive" },
          
          syphilis_positive: { $sum: "$indicators.syphilis_positive" },
          donors_positive_for_ttis: { $sum: "$indicators.donors_positive_for_ttis" },
          component_processing_system: { $sum: "$indicators.component_processing_system" },
          whole_blood_separated_into_components: { $sum: "$indicators.whole_blood_separated_into_components" },
          crc_units_repared: { $sum: "$indicators.crc_units_repared" },
          platelets_prepared: { $sum: "$indicators.platelets_prepared" },
          ffp_prepared: { $sum: "$indicators.ffp_prepared" },
          cryoprecipitate_prepared: { $sum: "$indicators.cryoprecipitate_prepared" },
          discarded_units_overweight_crc: { $sum: "$indicators.discarded_units_overweight_crc" },
          discarded_units_overweight_platelets: { $sum: "$indicators.discarded_units_overweight_platelets" },
          discarded_units_overweight_ffp: { $sum: "$indicators.discarded_units_overweight_ffp" },
          discarded_units_overweight_cryoprecipitate: { $sum: "$indicators.discarded_units_overweight_cryoprecipitate" },
          discarded_units_collection_problem: { $sum: "$indicators.discarded_units_collection_problem" },
          discarded_units_expired: { $sum: "$indicators.discarded_units_expired" },
          discarded_pnits_processing_problems: { $sum: "$indicators.discarded_pnits_processing_problems" },
          discarded_units_reactive_ttis: { $sum: "$indicators.discarded_units_reactive_ttis" },
          discarded_units_hemolyzed: { $sum: "$indicators.discarded_units_hemolyzed" },
          discarded_units_clotted: { $sum: "$indicators.discarded_units_clotted" },
          discarded_units_storage_problems: { $sum: "$indicators.discarded_units_storage_problems" },
          discarded_units_transportation_problems: { $sum: "$indicators.discarded_units_transportation_problems" },
          discarded_units_highod: { $sum: "$indicators.discarded_units_highod" },
          discarded_units_others: { $sum: "$indicators.discarded_units_others" },
          requested_aplus_wb_crc: { $sum: "$indicators.requested_aplus_wb_crc" },
          requested_bplus_wbCrc: { $sum: "$indicators.requested_bplus_wbCrc" },
          requested_abplus_wb_crc: { $sum: "$indicators.requested_abplus_wb_crc" },
          requested_oplus_wb_crc: { $sum: "$indicators.requested_oplus_wb_crc" },
          requested_aminus_wb_crc: { $sum: "$indicators.requested_aminus_wb_crc" },
          requested_bminus_wb_crc: { $sum: "$indicators.requested_bminus_wb_crc" },
          requested_abminus_wb_crc: { $sum: "$indicators.requested_abminus_wb_crc" },
          requested_ominus_wb_crc: { $sum: "$indicators.requested_ominus_wb_crc" },
          requested_ffp_units: { $sum: "$indicators.requested_ffp_units" },
          requested_platelets_units: { $sum: "$indicators.requested_platelets_units" },
          distributed_aplus_wb_crc: { $sum: "$indicators.distributed_aplus_wb_crc" },
          distributed_bplus_wb_crc: { $sum: "$indicators.distributed_bplus_wb_crc" },
          distributed_abplus_wb_crc: { $sum: "$indicators.distributed_abplus_wb_crc" },
          distributed_oplus_wb_crc: { $sum: "$indicators.distributed_oplus_wb_crc" },
          distributed_aminus_wb_crc: { $sum: "$indicators.distributed_aminus_wb_crc" },
          distributed_bminus_wb_crc: { $sum: "$indicators.distributed_bminus_wb_crc" },
          distributed_abminus_wb_crc: { $sum: "$indicators.distributed_abminus_wb_crc" },
          distributed_ominus_wb_crc: { $sum: "$indicators.distributed_ominus_wb_crc" },
          distributed_ffp_units: { $sum: "$indicators.distributed_ffp_units" },
          distributed_platelets_units: { $sum: "$indicators.distributed_platelets_units" },
          transferred_aplus_wb_crc: { $sum: "$indicators.transferred_aplus_wb_crc" },
          transferred_bplus_wb_crc: { $sum: "$indicators.transferred_bplus_wb_crc" },
          transferred_abplus_wb_crc: { $sum: "$indicators.transferred_abplus_wb_crc" },
          transferred_oplus_wb_crc: { $sum: "$indicators.transferred_oplus_wb_crc" },
          transferred_aminus_wb_crc: { $sum: "$indicators.transferred_aminus_wb_crc" },
          transferred_bminus_wb_crc: { $sum: "$indicators.transferred_bminus_wb_crc" },
          transferred_abminus_wb_crc: { $sum: "$indicators.transferred_abminus_wb_crc" },
          transferred_ominus_wb_crc: { $sum: "$indicators.transferred_ominus_wb_crc" },
          transferred_ffp_units: { $sum: "$indicators.transferred_ffp_units" },
          transferred_platelets_units: { $sum: "$indicators.transferred_platelets_units" },
          health_facilities_performing_transfusion: { $sum: "$indicators.health_facilities_performing_transfusion" },
          health_facilities_with_htc: { $sum: "$indicators.health_facilities_with_htc" },
          health_facilities_performing_clinical_audit: { $sum: "$indicators.health_facilities_performing_clinical_audit" },
          male_patients_transfused: { $sum: "$indicators.male_patients_transfused" },
          female_patients_transfused: { $sum: "$indicators.female_patients_transfused" },
          patients_under5_transfused: { $sum: "$indicators.patients_under5_transfused" },
          patients5_to14_transfused: { $sum: "$indicators.male_donors" },
          patients15_to44_transfused: { $sum: "$indicators.patients15_to44_transfused" },
          patients45_to59_transfused: { $sum: "$indicators.patients45_to59_transfused" },
          patients60_or_older_transfused: { $sum: "$indicators.patients60_or_older_transfused" },
          whole_blood_transfused: { $sum: "$indicators.whole_blood_transfused" },
          whole_blood_transfused: { $sum: "$indicators.whole_blood_transfused" },
          redCells_transfused: { $sum: "$indicators.redCells_transfused" },
          platelets_transfused: { $sum: "$indicators.platelets_transfused" },
          ffp_transfused: { $sum: "$indicators.ffp_transfused" },
          cryoprecipitate_transfused: { $sum: "$indicators.cryoprecipitate_transfused" },
          immunological_hemolysis_abo_tncompatibility: { $sum: "$indicators.immunological_hemolysis_abo_tncompatibility" },
          suspected_hemolysis_other_allo_antibody: { $sum: "$indicators.suspected_hemolysis_other_allo_antibody" },
          nonImmunological_hemolysis: { $sum: "$indicators.nonImmunological_hemolysis" },
          post_transfusion_purpura: { $sum: "$indicators.post_transfusion_purpura" },
          anaph_ylaxis_hypersensitivity: { $sum: "$indicators.anaph_ylaxis_hypersensitivity" },
          transfusion_related_lung_injury: { $sum: "$indicators.transfusion_related_lung_injury" },
          graft_versusHost_disease: { $sum: "$indicators.graft_versusHost_disease" },
          suspected_transfusion_associated_hiv: { $sum: "$indicators.suspected_transfusion_associated_hiv" },
          suspected_transfusion_associated_hbv: { $sum: "$indicators.suspected_transfusion_associated_hbv" },
          suspected_transfusion_associated_hcv: { $sum: "$indicators.suspected_transfusion_associated_hcv" },
          suspected_sepsis_donor_unit: { $sum: "$indicators.suspected_sepsis_donor_unit" },
          suspected_transfusion_associated_malaria: { $sum: "$indicators.suspected_transfusion_associated_malaria" },
          suspected_other_parasiticinfection: { $sum: "$indicators.suspected_other_parasiticinfection" },
          transfusion_associated_circulatory_overload: { $sum: "$indicators.transfusion_associated_circulatory_overload" },
          other_serious_atr: { $sum: "$indicators.other_serious_atr" },
          hiv_elisa_kits_stock: { $sum: "$indicators.hiv_elisa_kits_stock" },
          hbv_elisa_kits_stock: { $sum: "$indicators.hbv_elisa_kits_stock" },
          hcv_elisa_kits_stock: { $sum: "$indicators.hcv_elisa_kits_stock" },
          syphilis_elisa_kits_stock: { $sum: "$indicators.syphilis_elisa_kits_stock" },
          blood_bag350ml_stock: { $sum: "$indicators.blood_bag350ml_stock" },
          blood_bag450ml_single_stock: { $sum: "$indicators.blood_bag450ml_single_stock" },
          blood_bag450ml_triple_stock: { $sum: "$indicators.blood_bag450ml_triple_stock" },
          transfusion_set_stock: { $sum: "$indicators.transfusion_set_stock" },
          elisa_kits_stock_out_days: { $sum: "$indicators.elisa_kits_stock_out_days" },
          blood_bag_stock_out_days: { $sum: "$indicators.blood_bag_stock_out_days" },



          
          



        },
      },
      {
        $lookup: {
          from: "sites",
          localField: "_id",
          foreignField: "_id",
          as: "site",
        },
      },
      {
        $unwind: "$site",
      },
      {
        $project: {
          _id: 0,
          siteId: "$_id",
          siteName: "$site.name",
          total_blood_donations: 1,
          familyr_eplacement_donations: 1,
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
          age18to24_donors: 1,
          age25to34_donors: 1,
          age35to44_donors: 1,
          age45to54_donors: 1,
          age55to64_donors: 1,
          over65_donors: 1,
          apheresis_donations: 1,
          donations_fromCenter: 1,
          donations_from_mobile: 1,
          mobile_sessions_conducted: 1,
          active_blood_donor_clubs: 1,
          adr_fainting: 1,
          adr_fainting_withLoss_of_consciousness: 1,
          adr_seizure: 1,
          adr_technical_problem: 1,
          donor_refusals: 1,
          other_adrs: 1,
          permanent_deferrals_dueToTtis: 1,
          deferrals_by_low_weight: 1,
          deferrals_by_age: 1,
          deferrals_by_pregnancy_lactation: 1,
          deferrals_by_blood_pressure: 1,
          deferrals_by_low_hemoglobin: 1,
          deferrals_by_other_medical_conditions: 1,
          deferrals_by_high_risk_behavior: 1,
          deferrals_by_travel_history: 1,
          deferrals_by_other_reasons: 1,
          post_donation_counselling_system: 1,
          referral_for_positive_ttis_donors: 1,
          pre_donation_information_given: 1,
          pre_donation_counselling: 1,
          post_donation_counselling_service: 1,
          post_donation_counselling_from_mobile: 1,
          post_donation_counselling_from_center: 1,
          non_reactive_donors_receiving_pdc: 1,
          reactive_donors_receiving_pdc: 1,
          referred_reactive_donors_receiving_pdc: 1,
          donations_screened_for_ttis: 1,
          samples_screened_for_ttis: 1,
          samples_screened_for_blood_group: 1,
          samples_screened_for_blood_group_quality_assured: 1,
          ttis_positive: 1,
          hiv_positive:1,
          hepatitis_b_positive:1,
          hepatitis_c_positive: 1,
          syphilis_positive: 1,
          donors_positive_for_ttis: 1,
          component_processing_system: 1,
          whole_blood_separated_into_components: 1,
          crc_units_repared: 1,
          platelets_prepared: 1,
          ffp_prepared: 1,
          cryoprecipitate_prepared: 1,
          discarded_units_overweight_crc: 1,
          discarded_units_overweight_platelets: 1,
          discarded_units_overweight_ffp: 1,
          discarded_units_overweight_cryoprecipitate: 1,
          discarded_units_collection_problem: 1,
          discarded_units_expired: 1,
          discarded_pnits_processing_problems: 1,
          discarded_units_reactive_ttis: 1,
          discarded_units_hemolyzed: 1,
          discarded_units_clotted: 1,
          discarded_units_storage_problems: 1,
          discarded_units_transportation_problems: 1,
          discarded_units_highod: 1,
          discarded_units_others: 1,
          requested_aplus_wb_crc: 1,
          requested_bplus_wbCrc: 1,
          requested_abplus_wb_crc: 1,
          requested_oplus_wb_crc: 1,
          requested_aminus_wb_crc: 1,
          requested_bminus_wb_crc: 1,
          requested_abminus_wb_crc: 1,
          requested_ominus_wb_crc: 1,
          requested_ffp_units: 1,
          requested_platelets_units: 1,
          distributed_aplus_wb_crc: 1,
          distributed_bplus_wb_crc: 1,
          distributed_abplus_wb_crc: 1,
          distributed_oplus_wb_crc: 1,
          distributed_aminus_wb_crc: 1,
          distributed_bminus_wb_crc: 1,
          distributed_abminus_wb_crc: 1,
          distributed_ominus_wb_crc: 1,
          distributed_ffp_units: 1,
          distributed_platelets_units: 1,
          transferred_aplus_wb_crc: 1,
          transferred_bplus_wb_crc: 1,
          transferred_abplus_wb_crc: 1,
          transferred_oplus_wb_crc: 1,
          transferred_aminus_wb_crc: 1,
          transferred_bminus_wb_crc: 1,
          transferred_abminus_wb_crc: 1,
          transferred_ominus_wb_crc: 1,
          transferred_ffp_units: 1,
          transferred_platelets_units: 1,
          health_facilities_performing_transfusion: 1,
          health_facilities_with_htc: 1,
          health_facilities_performing_clinical_audit: 1,
          male_patients_transfused: 1,
          female_patients_transfused: 1,
          patients_under5_transfused: 1,
          patients5_to14_transfused: 1,
          patients15_to44_transfused: 1,
          patients45_to59_transfused: 1,
          patients60_or_older_transfused: 1,
          whole_blood_transfused: 1,
          redCells_transfused: 1,
          platelets_transfused: 1,
          ffp_transfused: 1,
          cryoprecipitate_transfused: 1,
          immunological_hemolysis_abo_tncompatibility: 1,
          suspected_hemolysis_other_allo_antibody: 1,
          nonImmunological_hemolysis: 1,
          post_transfusion_purpura: 1,
          anaph_ylaxis_hypersensitivity: 1,
          transfusion_related_lung_injury: 1,
          graft_versusHost_disease: 1,
          suspected_transfusion_associated_hiv: 1,
          suspected_transfusion_associated_hbv: 1,
          suspected_transfusion_associated_hcv: 1,
          suspected_sepsis_donor_unit: 1,
          suspected_transfusion_associated_malaria: 1,
          suspected_other_parasiticinfection: 1,
          transfusion_associated_circulatory_overload: 1,
          other_serious_atr: 1,
          hiv_elisa_kits_stock: 1,
          hbv_elisa_kits_stock: 1,
          hcv_elisa_kits_stock: 1,
          syphilis_elisa_kits_stock: 1,
          blood_bag350ml_stock: 1,
          blood_bag450ml_single_stock: 1,
          blood_bag450ml_triple_stock: 1,
          transfusion_set_stock: 1,
          elisa_kits_stock_out_days: 1,
          blood_bag_stock_out_days: 1 },
      },
    ]);

    // Send the result back to the client
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getIndicatorReport:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getDonationReport2 = async (req, res) => {
  const { fromDate, toDate, regionId } = req.query;

  try {
    // Get the site IDs that belong to the specified region
    // const sites = await Site.find({ regionId }).select("_id");
    // const siteIds = sites.map((site) => site._id);

   
    const result = await Form.aggregate([
      {
        $match: {
          date: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        },
      },
      {
        $lookup: {
          from: "sites",
          localField: "siteId",
          foreignField: "_id",
          as: "site",
        },
      },
      {
        $unwind: "$site",
      },
      {
        $lookup: {
          from: "regions",
          localField: "site.regionId",
          foreignField: "_id",
          as: "region",
        },
      },
      {
        $unwind: "$region",
      },
      {
        $group: {
          _id: "$region._id", // Group by regionId
          regionName: { $first: "$region.name" }, // Get the region name
          total_blood_donations: { $sum: "$indicators.total_blood_donations" },
          familyr_eplacement_donations: { $sum: "$indicators.familyr_eplacement_donations" },

          first_time_donors: { $sum: "$indicators.first_time_donors" },
          repeat_donors: { $sum: "$indicators.repeat_donors" },
          student_donors: { $sum: "$indicators.student_donors" },
          government_employee_donors: {
            $sum: "$indicators.government_employee_donors",
          },
          private_employee_donors: {
            $sum: "$indicators.private_employee_donors",
          },
          self_employed_donors: { $sum: "$indicators.self_employed_donors" },
          unemployed_donors: { $sum: "$indicators.unemployed_donors" },
          other_donors: { $sum: "$indicators.other_donors" },
          male_donors: { $sum: "$indicators.male_donors" },
          female_donors: { $sum: "$indicators.female_donors" },

          under18_donors: { $sum: "$indicators.under18_donors" },
          age18to24_donors: { $sum: "$indicators.age18to24_donors" },
          age25to34_donors: { $sum: "$indicators.age25to34_donors" },
          age35to44_donors: { $sum: "$indicators.age35to44_donors" },
          age45to54_donors: { $sum: "$indicators.age45to54_donors" },
          age55to64_donors: { $sum: "$indicators.age55to64_donors" },
          over65_donors: { $sum: "$indicators.over65_donors" },
          apheresis_donations: { $sum: "$indicators.apheresis_donations" },
          donations_fromCenter: { $sum: "$indicators.donations_fromCenter" },
          donations_from_mobile: { $sum: "$indicators.donations_from_mobile" },
          mobile_sessions_conducted: { $sum: "$indicators.mobile_sessions_conducted" },
          active_blood_donor_clubs: { $sum: "$indicators.active_blood_donor_clubs" },
          adr_fainting: { $sum: "$indicators.adr_fainting" },
          adr_fainting_withLoss_of_consciousness: { $sum: "$indicators.adr_fainting_withLoss_of_consciousness" },
          adr_seizure: { $sum: "$indicators.adr_seizure" },
          adr_technical_problem: { $sum: "$indicators.adr_technical_problem" },
          donor_refusals: { $sum: "$indicators.donor_refusals" },
          other_adrs: { $sum: "$indicators.other_adrs" },
          permanent_deferrals_dueToTtis: { $sum: "$indicators.permanent_deferrals_dueToTtis" },
          deferrals_by_low_weight: { $sum: "$indicators.deferrals_by_low_weight" },
          deferrals_by_age: { $sum: "$indicators.deferrals_by_age" },
          deferrals_by_pregnancy_lactation: { $sum: "$indicators.deferrals_by_pregnancy_lactation" },


          deferrals_by_blood_pressure: { $sum: "$indicators.deferrals_by_blood_pressure" },
          deferrals_by_low_hemoglobin: { $sum: "$indicators.deferrals_by_low_hemoglobin" },
          deferrals_by_other_medical_conditions: { $sum: "$indicators.deferrals_by_other_medical_conditions" },
          deferrals_by_high_risk_behavior: { $sum: "$indicators.deferrals_by_high_risk_behavior" },
          deferrals_by_travel_history: { $sum: "$indicators.deferrals_by_travel_history" },
          deferrals_by_other_reasons: { $sum: "$indicators.deferrals_by_other_reasons" },
          post_donation_counselling_system: { $sum: "$indicators.post_donation_counselling_system" },
          referral_for_positive_ttis_donors: { $sum: "$indicators.referral_for_positive_ttis_donors" },
          pre_donation_information_given: { $sum: "$indicators.pre_donation_information_given" },
          pre_donation_counselling: { $sum: "$indicators.pre_donation_counselling" },
          post_donation_counselling_service: { $sum: "$indicators.post_donation_counselling_service" },
          post_donation_counselling_from_mobile: { $sum: "$indicators.post_donation_counselling_from_mobile" },
          post_donation_counselling_from_center: { $sum: "$indicators.post_donation_counselling_from_center" },
          non_reactive_donors_receiving_pdc: { $sum: "$indicators.non_reactive_donors_receiving_pdc" },
          reactive_donors_receiving_pdc: { $sum: "$indicators.reactive_donors_receiving_pdc" },
          referred_reactive_donors_receiving_pdc: { $sum: "$indicators.referred_reactive_donors_receiving_pdc" },
          donations_screened_for_ttis: { $sum: "$indicators.donations_screened_for_ttis" },
          samples_screened_for_ttis: { $sum: "$indicators.samples_screened_for_ttis" },
          samples_screened_for_blood_group: { $sum: "$indicators.samples_screened_for_blood_group" },
          samples_screened_for_blood_group_quality_assured: { $sum: "$indicators.samples_screened_for_blood_group_quality_assured" },
          ttis_positive: { $sum: "$indicators.ttis_positive" },
          hiv_positive: { $sum: "$indicators.hiv_positive" },
          hepatitis_b_positive: { $sum: "$indicators.hepatitis_b_positive" },

          hepatitis_c_positive: { $sum: "$indicators.hepatitis_c_positive" },
          syphilis_positive: { $sum: "$indicators.syphilis_positive" },
          donors_positive_for_ttis: { $sum: "$indicators.donors_positive_for_ttis" },
          component_processing_system: { $sum: "$indicators.component_processing_system" },
          whole_blood_separated_into_components: { $sum: "$indicators.whole_blood_separated_into_components" },
          crc_units_repared: { $sum: "$indicators.crc_units_repared" },
          platelets_prepared: { $sum: "$indicators.platelets_prepared" },
          ffp_prepared: { $sum: "$indicators.ffp_prepared" },
          cryoprecipitate_prepared: { $sum: "$indicators.cryoprecipitate_prepared" },
          discarded_units_overweight_crc: { $sum: "$indicators.discarded_units_overweight_crc" },
          discarded_units_overweight_platelets: { $sum: "$indicators.discarded_units_overweight_platelets" },
          discarded_units_overweight_ffp: { $sum: "$indicators.discarded_units_overweight_ffp" },
          discarded_units_overweight_cryoprecipitate: { $sum: "$indicators.discarded_units_overweight_cryoprecipitate" },
          discarded_units_collection_problem: { $sum: "$indicators.discarded_units_collection_problem" },
          discarded_units_expired: { $sum: "$indicators.discarded_units_expired" },
          discarded_pnits_processing_problems: { $sum: "$indicators.discarded_pnits_processing_problems" },
          discarded_units_reactive_ttis: { $sum: "$indicators.discarded_units_reactive_ttis" },
          discarded_units_hemolyzed: { $sum: "$indicators.discarded_units_hemolyzed" },
          discarded_units_clotted: { $sum: "$indicators.discarded_units_clotted" },
          discarded_units_storage_problems: { $sum: "$indicators.discarded_units_storage_problems" },
          discarded_units_transportation_problems: { $sum: "$indicators.discarded_units_transportation_problems" },
          discarded_units_highod: { $sum: "$indicators.discarded_units_highod" },
          discarded_units_others: { $sum: "$indicators.discarded_units_others" },
          requested_aplus_wb_crc: { $sum: "$indicators.requested_aplus_wb_crc" },
          requested_bplus_wbCrc: { $sum: "$indicators.requested_bplus_wbCrc" },
          requested_abplus_wb_crc: { $sum: "$indicators.requested_abplus_wb_crc" },
          requested_oplus_wb_crc: { $sum: "$indicators.requested_oplus_wb_crc" },
          requested_aminus_wb_crc: { $sum: "$indicators.requested_aminus_wb_crc" },
          requested_bminus_wb_crc: { $sum: "$indicators.requested_bminus_wb_crc" },
          requested_abminus_wb_crc: { $sum: "$indicators.requested_abminus_wb_crc" },
          requested_ominus_wb_crc: { $sum: "$indicators.requested_ominus_wb_crc" },
          requested_ffp_units: { $sum: "$indicators.requested_ffp_units" },
          requested_platelets_units: { $sum: "$indicators.requested_platelets_units" },
          distributed_aplus_wb_crc: { $sum: "$indicators.distributed_aplus_wb_crc" },
          distributed_bplus_wb_crc: { $sum: "$indicators.distributed_bplus_wb_crc" },
          distributed_abplus_wb_crc: { $sum: "$indicators.distributed_abplus_wb_crc" },
          distributed_oplus_wb_crc: { $sum: "$indicators.distributed_oplus_wb_crc" },
          distributed_aminus_wb_crc: { $sum: "$indicators.distributed_aminus_wb_crc" },
          distributed_bminus_wb_crc: { $sum: "$indicators.distributed_bminus_wb_crc" },
          distributed_abminus_wb_crc: { $sum: "$indicators.distributed_abminus_wb_crc" },
          distributed_ominus_wb_crc: { $sum: "$indicators.distributed_ominus_wb_crc" },
          distributed_ffp_units: { $sum: "$indicators.distributed_ffp_units" },
          distributed_platelets_units: { $sum: "$indicators.distributed_platelets_units" },
          transferred_aplus_wb_crc: { $sum: "$indicators.transferred_aplus_wb_crc" },
          transferred_bplus_wb_crc: { $sum: "$indicators.transferred_bplus_wb_crc" },
          transferred_abplus_wb_crc: { $sum: "$indicators.transferred_abplus_wb_crc" },
          transferred_oplus_wb_crc: { $sum: "$indicators.transferred_oplus_wb_crc" },
          transferred_aminus_wb_crc: { $sum: "$indicators.transferred_aminus_wb_crc" },
          transferred_bminus_wb_crc: { $sum: "$indicators.transferred_bminus_wb_crc" },
          transferred_abminus_wb_crc: { $sum: "$indicators.transferred_abminus_wb_crc" },
          transferred_ominus_wb_crc: { $sum: "$indicators.transferred_ominus_wb_crc" },
          transferred_ffp_units: { $sum: "$indicators.transferred_ffp_units" },
          transferred_platelets_units: { $sum: "$indicators.transferred_platelets_units" },
          health_facilities_performing_transfusion: { $sum: "$indicators.health_facilities_performing_transfusion" },
          health_facilities_with_htc: { $sum: "$indicators.health_facilities_with_htc" },
          health_facilities_performing_clinical_audit: { $sum: "$indicators.health_facilities_performing_clinical_audit" },
          male_patients_transfused: { $sum: "$indicators.male_patients_transfused" },
          female_patients_transfused: { $sum: "$indicators.female_patients_transfused" },
          patients_under5_transfused: { $sum: "$indicators.patients_under5_transfused" },
          patients5_to14_transfused: { $sum: "$indicators.male_donors" },
          patients15_to44_transfused: { $sum: "$indicators.patients15_to44_transfused" },
          patients45_to59_transfused: { $sum: "$indicators.patients45_to59_transfused" },
          patients60_or_older_transfused: { $sum: "$indicators.patients60_or_older_transfused" },
          whole_blood_transfused: { $sum: "$indicators.whole_blood_transfused" },
          whole_blood_transfused: { $sum: "$indicators.whole_blood_transfused" },
          redCells_transfused: { $sum: "$indicators.redCells_transfused" },
          platelets_transfused: { $sum: "$indicators.platelets_transfused" },
          ffp_transfused: { $sum: "$indicators.ffp_transfused" },
          cryoprecipitate_transfused: { $sum: "$indicators.cryoprecipitate_transfused" },
          immunological_hemolysis_abo_tncompatibility: { $sum: "$indicators.immunological_hemolysis_abo_tncompatibility" },
          suspected_hemolysis_other_allo_antibody: { $sum: "$indicators.suspected_hemolysis_other_allo_antibody" },
          nonImmunological_hemolysis: { $sum: "$indicators.nonImmunological_hemolysis" },
          post_transfusion_purpura: { $sum: "$indicators.post_transfusion_purpura" },
          anaph_ylaxis_hypersensitivity: { $sum: "$indicators.anaph_ylaxis_hypersensitivity" },
          transfusion_related_lung_injury: { $sum: "$indicators.transfusion_related_lung_injury" },
          graft_versusHost_disease: { $sum: "$indicators.graft_versusHost_disease" },
          suspected_transfusion_associated_hiv: { $sum: "$indicators.suspected_transfusion_associated_hiv" },
          suspected_transfusion_associated_hbv: { $sum: "$indicators.suspected_transfusion_associated_hbv" },
          suspected_transfusion_associated_hcv: { $sum: "$indicators.suspected_transfusion_associated_hcv" },
          suspected_sepsis_donor_unit: { $sum: "$indicators.suspected_sepsis_donor_unit" },
          suspected_transfusion_associated_malaria: { $sum: "$indicators.suspected_transfusion_associated_malaria" },
          suspected_other_parasiticinfection: { $sum: "$indicators.suspected_other_parasiticinfection" },
          transfusion_associated_circulatory_overload: { $sum: "$indicators.transfusion_associated_circulatory_overload" },
          other_serious_atr: { $sum: "$indicators.other_serious_atr" },
          hiv_elisa_kits_stock: { $sum: "$indicators.hiv_elisa_kits_stock" },
          hbv_elisa_kits_stock: { $sum: "$indicators.hbv_elisa_kits_stock" },
          hcv_elisa_kits_stock: { $sum: "$indicators.hcv_elisa_kits_stock" },
          syphilis_elisa_kits_stock: { $sum: "$indicators.syphilis_elisa_kits_stock" },
          blood_bag350ml_stock: { $sum: "$indicators.blood_bag350ml_stock" },
          blood_bag450ml_single_stock: { $sum: "$indicators.blood_bag450ml_single_stock" },
          blood_bag450ml_triple_stock: { $sum: "$indicators.blood_bag450ml_triple_stock" },
          transfusion_set_stock: { $sum: "$indicators.transfusion_set_stock" },
          elisa_kits_stock_out_days: { $sum: "$indicators.elisa_kits_stock_out_days" },
          blood_bag_stock_out_days: { $sum: "$indicators.blood_bag_stock_out_days" },



          
          



        },
      },
      {
        $project: {
          _id: 0, // Remove the _id field
          regionName: 1,
          total_blood_donations: 1,
          total_blood_donations: 1,
          familyr_eplacement_donations: 1,
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
          age18to24_donors: 1,
          age25to34_donors: 1,
          age35to44_donors: 1,
          age45to54_donors: 1,
          age55to64_donors: 1,
          over65_donors: 1,
          apheresis_donations: 1,
          donations_fromCenter: 1,
          donations_from_mobile: 1,
          mobile_sessions_conducted: 1,
          active_blood_donor_clubs: 1,
          adr_fainting: 1,
          adr_fainting_withLoss_of_consciousness: 1,
          adr_seizure: 1,
          adr_technical_problem: 1,
          donor_refusals: 1,
          other_adrs: 1,
          permanent_deferrals_dueToTtis: 1,
          deferrals_by_low_weight: 1,
          deferrals_by_age: 1,
          deferrals_by_pregnancy_lactation: 1,
          deferrals_by_blood_pressure: 1,
          deferrals_by_low_hemoglobin: 1,
          deferrals_by_other_medical_conditions: 1,
          deferrals_by_high_risk_behavior: 1,
          deferrals_by_travel_history: 1,
          deferrals_by_other_reasons: 1,
          post_donation_counselling_system: 1,
          referral_for_positive_ttis_donors: 1,
          pre_donation_information_given: 1,
          pre_donation_counselling: 1,
          post_donation_counselling_service: 1,
          post_donation_counselling_from_mobile: 1,
          post_donation_counselling_from_center: 1,
          non_reactive_donors_receiving_pdc: 1,
          reactive_donors_receiving_pdc: 1,
          referred_reactive_donors_receiving_pdc: 1,
          donations_screened_for_ttis: 1,
          samples_screened_for_ttis: 1,
          samples_screened_for_blood_group: 1,
          samples_screened_for_blood_group_quality_assured: 1,
          ttis_positive: 1,
          hiv_positive: 1,
          hepatitis_b_positive: 1,

          hepatitis_c_positive: 1,
          syphilis_positive: 1,
          donors_positive_for_ttis: 1,
          component_processing_system: 1,
          whole_blood_separated_into_components: 1,
          crc_units_repared: 1,
          platelets_prepared: 1,
          ffp_prepared: 1,
          cryoprecipitate_prepared: 1,
          discarded_units_overweight_crc: 1,
          discarded_units_overweight_platelets: 1,
          discarded_units_overweight_ffp: 1,
          discarded_units_overweight_cryoprecipitate: 1,
          discarded_units_collection_problem: 1,
          discarded_units_expired: 1,
          discarded_pnits_processing_problems: 1,
          discarded_units_reactive_ttis: 1,
          discarded_units_hemolyzed: 1,
          discarded_units_clotted: 1,
          discarded_units_storage_problems: 1,
          discarded_units_transportation_problems: 1,
          discarded_units_highod: 1,
          discarded_units_others: 1,
          requested_aplus_wb_crc: 1,
          requested_bplus_wbCrc: 1,
          requested_abplus_wb_crc: 1,
          requested_oplus_wb_crc: 1,
          requested_aminus_wb_crc: 1,
          requested_bminus_wb_crc: 1,
          requested_abminus_wb_crc: 1,
          requested_ominus_wb_crc: 1,
          requested_ffp_units: 1,
          requested_platelets_units: 1,
          distributed_aplus_wb_crc: 1,
          distributed_bplus_wb_crc: 1,
          distributed_abplus_wb_crc: 1,
          distributed_oplus_wb_crc: 1,
          distributed_aminus_wb_crc: 1,
          distributed_bminus_wb_crc: 1,
          distributed_abminus_wb_crc: 1,
          distributed_ominus_wb_crc: 1,
          distributed_ffp_units: 1,
          distributed_platelets_units: 1,
          transferred_aplus_wb_crc: 1,
          transferred_bplus_wb_crc: 1,
          transferred_abplus_wb_crc: 1,
          transferred_oplus_wb_crc: 1,
          transferred_aminus_wb_crc: 1,
          transferred_bminus_wb_crc: 1,
          transferred_abminus_wb_crc: 1,
          transferred_ominus_wb_crc: 1,
          transferred_ffp_units: 1,
          transferred_platelets_units: 1,
          health_facilities_performing_transfusion: 1,
          health_facilities_with_htc: 1,
          health_facilities_performing_clinical_audit: 1,
          male_patients_transfused: 1,
          female_patients_transfused: 1,
          patients_under5_transfused: 1,
          patients5_to14_transfused: 1,
          patients15_to44_transfused: 1,
          patients45_to59_transfused: 1,
          patients60_or_older_transfused: 1,
          whole_blood_transfused: 1,
          redCells_transfused: 1,
          platelets_transfused: 1,
          ffp_transfused: 1,
          cryoprecipitate_transfused: 1,
          immunological_hemolysis_abo_tncompatibility: 1,
          suspected_hemolysis_other_allo_antibody: 1,
          nonImmunological_hemolysis: 1,
          post_transfusion_purpura: 1,
          anaph_ylaxis_hypersensitivity: 1,
          transfusion_related_lung_injury: 1,
          graft_versusHost_disease: 1,
          suspected_transfusion_associated_hiv: 1,
          suspected_transfusion_associated_hbv: 1,
          suspected_transfusion_associated_hcv: 1,
          suspected_sepsis_donor_unit: 1,
          suspected_transfusion_associated_malaria: 1,
          suspected_other_parasiticinfection: 1,
          transfusion_associated_circulatory_overload: 1,
          other_serious_atr: 1,
          hiv_elisa_kits_stock: 1,
          hbv_elisa_kits_stock: 1,
          hcv_elisa_kits_stock: 1,
          syphilis_elisa_kits_stock: 1,
          blood_bag350ml_stock: 1,
          blood_bag450ml_single_stock: 1,
          blood_bag450ml_triple_stock: 1,
          transfusion_set_stock: 1,
          elisa_kits_stock_out_days: 1,
          blood_bag_stock_out_days: 1 
        },
      },
    ]);
    // Send the result back to the client
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getIndicatorReport:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



exports.getDonationReport = async (req, res) => {
  const { fromDate, toDate, regionId } = req.query;

  try {
    // Get the site IDs that belong to the specified region
    // const sites = await Site.find({ regionId }).select("_id");
    // const siteIds = sites.map((site) => site._id);

   
    const result = await Form.aggregate([
      {
        $match: {
          date: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        },
      },
      {
        $lookup: {
          from: "sites",
          localField: "siteId",
          foreignField: "_id",
          as: "site",
        },
      },
      {
        $unwind: "$site",
      },
      {
        $lookup: {
          from: "regions",
          localField: "site.regionId",
          foreignField: "_id",
          as: "region",
        },
      },
      {
        $unwind: "$region",
      },
      {
        $group: {
          _id: "$region._id", // Group by regionId
          regionName: { $first: "$region.name" }, // Get the region name
          total_blood_donations: { $sum: "$indicators.total_blood_donations" },
          family_replacement_donations: {
            $sum: "$indicators.family_replacement_donations",
          },
          first_time_donors: { $sum: "$indicators.first_time_donors" },
          repeat_donors: { $sum: "$indicators.repeat_donors" },
           female_donors:{$sum:"$indicators.female_donors"},
           male_donors:{$sum:"$indicators.male_donors"},
           donations_fromCenter:{$sum:"$indicators.donations_fromCenter"},
           donations_from_mobile:{$sum:"$indicators.donations_from_mobile"},
           mobile_sessions_conducted:{$sum:"$indicators.mobile_sessions_conducted"},
           active_blood_donor_clubs:{$sum:"$indicators.active_blood_donor_clubs"},
           female_donors:{$sum:"$indicators.female_donors"},
           female_donors:{$sum:"$indicators.female_donors"},
           female_donors:{$sum:"$indicators.female_donors"},



        },
      },
      {
        $project: {
          _id: 0, // Remove the _id field
          regionName: 1,
          total_blood_donations: 1,
          family_replacement_donations: {
            $cond: {
              if: { $gt: ["$total_blood_donations", 0] },
              then: {
                $multiply: [
                  { $divide: ["$family_replacement_donations", "$total_blood_donations"] },
                  100,
                ],
              },
              else: 0,
            },
          },
          first_time_donors: {
            $cond: {
              if: { $gt: ["$total_blood_donations", 0] },
              then: {
                $multiply: [
                  { $divide: ["$first_time_donors", "$total_blood_donations"] },
                  100,
                ],
              },
              else: 0,
            },
          },
          repeat_donors: {
            $cond: {
              if: { $gt: ["$total_blood_donations", 0] },
              then: {
                $multiply: [
                  { $divide: ["$repeat_donors", "$total_blood_donations"] },
                  100,
                ],
              },
              else: 0,
            },
          },
          student_donors: {
            $cond: {
              if: { $gt: ["$total_blood_donations", 0] },
              then: {
                $multiply: [
                  { $divide: ["$student_donors", "$total_blood_donations"] },
                  100,
                ],
              },
              else: 0,
            },
          },
          government_employee_donors: {
            $cond: {
              if: { $gt: ["$total_blood_donations", 0] },
              then: {
                $multiply: [
                  { $divide: ["$government_employee_donors", "$total_blood_donations"] },
                  100,
                ],
              },
              else: 0,
            },
          },
          private_employee_donors: {
            $cond: {
              if: { $gt: ["$total_blood_donations", 0] },
              then: {
                $multiply: [
                  { $divide: ["$private_employee_donors", "$total_blood_donations"] },
                  100,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ]);
    // Send the result back to the client
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getIndicatorReport:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getHomeDashboard = async (req, res) => {
  let { regionId, siteId, type } = req.query;
  if (req.user.role == "regional_manager") {
    type = "region";
    const r = await Region.findOne({ managerId: req.user._id });
    regionId = r._id;
  }
  if (req.user.role == "site_coordiantor") {
    type = "site";
    console.log("+====================", req.user._id);

    const r = await Site.findOne({ coordinatorId: req.user._id });
    console.log("+====================", r);
    siteId = r._id;
  }
  try {
    let matchStage = {}; // No date filtering
    let groupStage = {
      _id: null,
      total_blood_donations: { $sum: "$indicators.total_blood_donations" },
      first_time_donors: { $sum: "$indicators.first_time_donors" },
      repeat_donors: { $sum: "$indicators.repeat_donors" },
      student_donors: { $sum: "$indicators.student_donors" },
      government_employee_donors: {
        $sum: "$indicators.government_employee_donors",
      },
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
    if (type === "all") {
      // No additional match or group stages needed for 'all'
    } else if (type === "site") {
      if (!siteId) {
        return res
          .status(400)
          .json({ message: 'siteId is required for type "site"' });
      }
      console.log("siteId", siteId);
      // if (!siteId || !isValidObjectId(siteId)) {
      //   return res.status(400).json({ message: 'Invalid siteId for type "site"' });
      // }
      matchStage.siteId = siteId;
      // groupStage._id = "$siteId";
      // projectStage.siteId = "$_id";
      // projectStage.siteName = "$siteName";
    } else if (type === "region") {
      if (!regionId) {
        return res
          .status(400)
          .json({ message: 'regionId is required for type "region"' });
      }
      const sites = await Site.find({ regionId }).select("_id");
      const siteIds = sites.map((site) => site._id);
      matchStage.siteId = { $in: siteIds };
      // groupStage._id = "$siteId";
      // projectStage.siteId = "$_id";
      // projectStage.siteName = "$siteName";
    } else {
      return res.status(400).json({ message: "Invalid type parameter" });
    }

    // Execute the aggregation pipeline
    const result = await Form.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      {
        $lookup: {
          from: "sites",
          localField: "_id",
          foreignField: "_id",
          as: "site",
        },
      },
      { $unwind: { path: "$site", preserveNullAndEmptyArrays: true } },
      { $project: projectStage },
    ]);

    // Send the result back to the client
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getIndicatorReport:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
