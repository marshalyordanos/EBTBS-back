const validateForm = (req, res, next) => {
  const indicators = req.body.indicators;

  // Define validation rules with field names directly
  const rules = [
    {
      fields: ["firstTimeDonors", "repeatDonors"],
      equalsTo: "totalBloodDonations",
    },
    {
      fields: [
        "studentDonors",
        "governmentEmployeeDonors",
        "privateEmployeeDonors",
        "unemployedDonors",
        "otherDonors",
      ],
      equalsTo: "totalBloodDonations",
    },
    { fields: ["maleDonors", "femaleDonors"], equalsTo: "totalBloodDonations" },
    {
      fields: ["donationsFromCenter", "donationsFromMobile"],
      equalsTo: "totalBloodDonations",
    },
    {
      fields: [
        "postDonationCounsellingFromMobile",
        "postDonationCounsellingFromCenter",
      ],
      equalsTo: "postDonationCounsellingService",
    },
    {
      fields: ["nonReactiveDonorsReceivingPdc", "reactiveDonorsReceivingPdc"],
      equalsTo: "postDonationCounsellingService",
    },
  ];

  // Define human-readable descriptions for field names
  const descriptions = {
    totalBloodDonations: "total number Blood Donations",
    firstTimeDonors: "Number of first Time Donors",
    repeatDonors: "number of repeat Donors",
    studentDonors: "number of Student Donors",
    governmentEmployeeDonors: "number of Government Employee Donors",
    privateEmployeeDonors: "number of Private Employee Donors",
    unemployedDonors: "number of Unemployed Donors",
    otherDonors: "number of Other Donors",
    maleDonors: "number of Male Donors",
    femaleDonors: "number of Female Donors",
    donationsFromCenter: "number of Donations from Center",
    donationsFromMobile: "number of Donations from Mobile",
    postDonationCounsellingService: "Post Donation Counselling Service",
    postDonationCounsellingFromMobile:
      "number of Post Donation Counselling from Mobile",
    postDonationCounsellingFromCenter:
      "number of Post Donation Counselling from Center",
    nonReactiveDonorsReceivingPdc:
      "number of Non-Reactive Donors Receiving PDC",
    reactiveDonorsReceivingPdc: "number of Reactive Donors Receiving PDC",
    ttisPositive: "number of TTIs Positive",
    hivPositive: "number of HIV Positive",
    syphilisPositive: "number of Syphilis Positive",
    hepatitisBPositive: "number of Hepatitis B Positive",
    hepatitisCPositive: "number of Hepatitis C Positive",
    discardedUnitsReactiveTtis: "number of Discarded Units Reactive to TTIs",
  };

  for (const rule of rules) {
    const equalsToValue = indicators[rule.equalsTo];

    if (equalsToValue === undefined) {
      // If the equalsTo field is missing, skip validation
      continue;
    }

    // Check if all fields are defined
    const allFieldsDefined = rule.fields.every(
      (field) => indicators[field] !== undefined
    );

    if (!allFieldsDefined) {
      // If any field is not defined, skip validation
      continue;
    }

    const sum = rule.fields.reduce((acc, field) => {
      const fieldValue = indicators[field];
      return acc + (fieldValue || 0);
    }, 0);

    if (sum !== equalsToValue) {
      const fieldsDescription = rule.fields
        .map((field) => descriptions[field])
        .join(", ");
      const equalsToDescription = descriptions[rule.equalsTo];
      return res
        .status(400)
        .json({
          msg: `Sum of fields ${fieldsDescription} must equal field ${equalsToDescription}`,
        });
    }
  }

  // Specific validation for ttisPositive
  const ttisPositiveSumFields = [
    "hivPositive",
    "syphilisPositive",
    "hepatitisCPositive",
    "hepatitisBPositive",
  ];
  const ttisPositiveSum = ttisPositiveSumFields.reduce((acc, field) => {
    const fieldValue = indicators[field];
    return acc + (fieldValue || 0);
  }, 0);
  const ttisPositiveValue = indicators["ttisPositive"];

  if (ttisPositiveValue !== undefined && ttisPositiveSum > ttisPositiveValue) {
    const ttisPositiveDescription = descriptions["ttisPositive"];
    const sumDescription = ttisPositiveSumFields
      .map((field) => descriptions[field])
      .join(", ");
    return res
      .status(400)
      .json({
        msg: `Sum of fields ${sumDescription} must not exceed field ${ttisPositiveDescription}`,
      });
  }

  next();
};

module.exports = validateForm;
