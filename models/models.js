const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "site_coordiantor", "regional_manager"],
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("remove", async function (next) {
  const user = this;
  console.log("user",user)
  // await Task.deleteMany({ owner: user._id });
  // next();
  s
});

const regionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    managerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

const siteSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    coordinatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    regionId: { type: Schema.Types.ObjectId, ref: "Region", required: true },
  },
  { timestamps: true }
);

const settingSchema = new Schema(
  {
    date: { type: Number, default: null },
      dueDate: { type: Number, default: null },
  },
  { timestamps: true }
);

const tokenSchema = new Schema(
  {
    userId: { type: String, required: true },
    token: { type: String, required: true },
    expireAt: { type: Date, expires: 60 * 60, default: Date.now },
  },
  { timestamps: true }
);

const formSchema = new Schema(
  {
    siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    dueDate: { type: Date, required: true },
    date: { type: Date, required: true },
    isPublished: { type: Boolean, default: true },
    indicators: {
      total_blood_donations: { type: Number, default: null },
      familyr_eplacement_donations: { type: Number, default: null },
      first_time_donors: { type: Number, default: null },
      repeat_donors: { type: Number, default: null },
      student_donors: { type: Number, default: null },
      government_employee_donors: { type: Number, default: null },
      private_employee_donors: { type: Number, default: null },
      self_employed_donors: { type: Number, default: null },
      unemployed_donors: { type: Number, default: null },
      other_donors: { type: Number, default: null },
      male_donors: { type: Number, default: null },
      female_donors: { type: Number, default: null },
      under18_donors: { type: Number, default: null },
      age18to24_donors: { type: Number, default: null },
      age25to34_donors: { type: Number, default: null },
      age35to44_donors: { type: Number, default: null },
      age45to54_donors: { type: Number, default: null },
      age55to64_donors: { type: Number, default: null },
      over65_donors: { type: Number, default: null },
      apheresis_donations: { type: Number, default: null },
      donations_fromCenter: { type: Number, default: null },
      donations_from_mobile: { type: Number, default: null },
      mobile_sessions_conducted: { type: Number, default: null },
      active_blood_donor_clubs: { type: Number, default: null },
      adr_fainting: { type: Number, default: null },
      adr_fainting_withLoss_of_consciousness: { type: Number, default: null },
      adr_seizure: { type: Number, default: null },
      adr_technical_problem: { type: Number, default: null },
      donor_refusals: { type: Number, default: null },
      other_adrs: { type: Number, default: null },
      permanent_deferrals_dueToTtis: { type: Number, default: null },
      deferrals_by_low_weight: { type: Number, default: null },
      deferrals_by_age: { type: Number, default: null },
      deferrals_by_pregnancy_lactation: { type: Number, default: null },
      deferrals_by_blood_pressure: { type: Number, default: null },
      deferrals_by_low_hemoglobin: { type: Number, default: null },
      deferrals_by_other_medical_conditions: { type: Number, default: null },
      deferrals_by_high_risk_behavior: { type: Number, default: null },
      deferrals_by_travel_history: { type: Number, default: null },
      deferrals_by_other_reasons: { type: Number, default: null },
      post_donation_counselling_system: { type: Boolean, default: null },
      referral_for_positive_ttis_donors: { type: Boolean, default: null },
      pre_donation_information_given: { type: Number, default: null },
      pre_donation_counselling: { type: Number, default: null },
      post_donation_counselling_service: { type: Number, default: null },
      post_donation_counselling_from_mobile: { type: Number, default: null },
      post_donation_counselling_from_center: { type: Number, default: null },
      non_reactive_donors_receiving_pdc: { type: Number, default: null },
      reactive_donors_receiving_pdc: { type: Number, default: null },
      referred_reactive_donors_receiving_pdc: { type: Number, default: null },
      donations_screened_for_ttis: { type: Number, default: null },
      samples_screened_for_ttis: { type: Number, default: null },
      samples_screened_for_blood_group: { type: Number, default: null },
      samples_screened_for_blood_group_quality_assured: {
        type: Number,
        default: null,
      },
      ttis_positive: { type: Number, default: null },
      hiv_positive: { type: Number, default: null },
      hepatitis_b_positive: { type: Number, default: null },
      hepatitis_c_positive: { type: Number, default: null },
      syphilis_positive: { type: Number, default: null },
      donors_positive_for_ttis: { type: Number, default: null },
      component_processing_system: { type: Boolean, default: null },
      whole_blood_separated_into_components: { type: Number, default: null },
      crc_units_repared: { type: Number, default: null },
      platelets_prepared: { type: Number, default: null },
      ffp_prepared: { type: Number, default: null },
      cryoprecipitate_prepared: { type: Number, default: null },
      discarded_units_overweight_crc: { type: Number, default: null },
      discarded_units_overweight_platelets: { type: Number, default: null },
      discarded_units_overweight_ffp: { type: Number, default: null },
      discarded_units_overweight_cryoprecipitate: {
        type: Number,
        default: null,
      },
      discarded_units_collection_problem: { type: Number, default: null },
      discarded_units_expired: { type: Number, default: null },
      discarded_pnits_processing_problems: { type: Number, default: null },
      discarded_units_reactive_ttis: { type: Number, default: null },
      discarded_units_hemolyzed: { type: Number, default: null },
      discarded_units_clotted: { type: Number, default: null },
      discarded_units_storage_problems: { type: Number, default: null },
      discarded_units_transportation_problems: { type: Number, default: null },
      discarded_units_highod: { type: Number, default: null },
      discarded_units_others: { type: Number, default: null },
      requested_aplus_wb_crc: { type: Number, default: null },
      requested_bplus_wbCrc: { type: Number, default: null },
      requested_abplus_wb_crc: { type: Number, default: null },
      requested_oplus_wb_crc: { type: Number, default: null },
      requested_aminus_wb_crc: { type: Number, default: null },
      requested_bminus_wb_crc: { type: Number, default: null },
      requested_abminus_wb_crc: { type: Number, default: null },
      requested_ominus_wb_crc: { type: Number, default: null },
      requested_ffp_units: { type: Number, default: null },
      requested_platelets_units: { type: Number, default: null },
      distributed_aplus_wb_crc: { type: Number, default: null },
      distributed_bplus_wb_crc: { type: Number, default: null },
      distributed_abplus_wb_crc: { type: Number, default: null },
      distributed_oplus_wb_crc: { type: Number, default: null },
      distributed_aminus_wb_crc: { type: Number, default: null },
      distributed_bminus_wb_crc: { type: Number, default: null },
      distributed_abminus_wb_crc: { type: Number, default: null },
      distributed_ominus_wb_crc: { type: Number, default: null },
      distributed_ffp_units: { type: Number, default: null },
      distributed_platelets_units: { type: Number, default: null },
      transferred_aplus_wb_crc: { type: Number, default: null },
      transferred_bplus_wb_crc: { type: Number, default: null },
      transferred_abplus_wb_crc: { type: Number, default: null },
      transferred_oplus_wb_crc: { type: Number, default: null },
      transferred_aminus_wb_crc: { type: Number, default: null },
      transferred_bminus_wb_crc: { type: Number, default: null },
      transferred_abminus_wb_crc: { type: Number, default: null },
      transferred_ominus_wb_crc: { type: Number, default: null },
      transferred_ffp_units: { type: Number, default: null },
      transferred_platelets_units: { type: Number, default: null },
      health_facilities_performing_transfusion: { type: Number, default: null },
      health_facilities_with_htc: { type: Number, default: null },
      health_facilities_performing_clinical_audit: {
        type: Number,
        default: null,
      },
      male_patients_transfused: { type: Number, default: null },
      female_patients_transfused: { type: Number, default: null },
      patients_under5_transfused: { type: Number, default: null },
      patients5_to14_transfused: { type: Number, default: null },
      patients15_to44_transfused: { type: Number, default: null },
      patients45_to59_transfused: { type: Number, default: null },
      patients60_or_older_transfused: { type: Number, default: null },
      whole_blood_transfused: { type: Number, default: null },
      redCells_transfused: { type: Number, default: null },
      platelets_transfused: { type: Number, default: null },
      ffp_transfused: { type: Number, default: null },
      cryoprecipitate_transfused: { type: Number, default: null },
      immunological_hemolysis_abo_tncompatibility: {
        type: Number,
        default: null,
      },
      suspected_hemolysis_other_allo_antibody: { type: Number, default: null },
      nonImmunological_hemolysis: { type: Number, default: null },
      post_transfusion_purpura: { type: Number, default: null },
      anaph_ylaxis_hypersensitivity: { type: Number, default: null },
      transfusion_related_lung_injury: { type: Number, default: null },
      graft_versusHost_disease: { type: Number, default: null },
      suspected_transfusion_associated_hiv: { type: Number, default: null },
      suspected_transfusion_associated_hbv: { type: Number, default: null },
      suspected_transfusion_associated_hcv: { type: Number, default: null },
      suspected_sepsis_donor_unit: { type: Number, default: null },
      suspected_transfusion_associated_malaria: { type: Number, default: null },
      suspected_other_parasiticinfection: { type: Number, default: null },
      transfusion_associated_circulatory_overload: {
        type: Number,
        default: null,
      },
      other_serious_atr: { type: Number, default: null },
      hiv_elisa_kits_stock: { type: Number, default: null },
      hbv_elisa_kits_stock: { type: Number, default: null },
      hcv_elisa_kits_stock: { type: Number, default: null },
      syphilis_elisa_kits_stock: { type: Number, default: null },
      blood_bag350ml_stock: { type: Number, default: null },
      blood_bag450ml_single_stock: { type: Number, default: null },
      blood_bag450ml_triple_stock: { type: Number, default: null },
      transfusion_set_stock: { type: Number, default: null },
      elisa_kits_stock_out_days: { type: Number, default: null },
      blood_bag_stock_out_days: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Region = mongoose.model("Region", regionSchema);
const Site = mongoose.model("Site", siteSchema);
const Token = mongoose.model("Token", tokenSchema);
const Form = mongoose.model("Form", formSchema);
const Setting = mongoose.model("Setting", settingSchema);


module.exports = {
  User,
  Region,
  Site,
  Token,
  Form,
  Setting
};
