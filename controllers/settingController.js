const { Setting, Site } = require("../models/models");
const APIFeature = require("../utils/apiFeature");

const cron = require("node-cron");
const axios = require("axios");
const { getDateWithDay } = require("../utils/helper");
// function updateCronJob() {

// }
async function createForm() {
  const set = await Setting.findOne({});
  Site.find({}).then((siteList) => {
    siteList.forEach(async (site) => {
      try {
        const response = await axios.post(
          "http://localhost:8000/api/indicators",
          {
            date: getDateWithDay(set.date),
            dueDate: getDateWithDay(set.date),
            siteId: site._id,
          }
        );
        console.log(response.data);
      } catch (error) {
        console.log("err", error);
      }
      //   const newForm = new Form({
      //     date:set.date,
      //     dueDate:set.dueDate,
      //     siteId:site._id
      //  });
      //  newForm.save()
      //      .then(() => console.log('User created successfully!'))
      //      .catch(err => console.error('Error creating user:', err));
    });
  });
}

exports.createSetting = async (req, res) => {
  try {
    const { date, dueDate } = req.body;

    // Check if user exists
    const setting = await Setting.find();
    if (setting.length == 0) {
      const site = new Setting({
        date,
        dueDate,
      });
      await site.save();
      // return res.status(200).json({ msg: "Site created successfully!" });
    }

    await Setting.findByIdAndUpdate(setting[0]._id, {
      $set: {
        date,
        dueDate,
      },
    });

    Setting.findOne({})
      .then((setting) => {
        if (!setting) {
          console.error("No settings found!");
          return;
        }

        const schedule = `0 0 ${setting.date} * *`; // At 00:00 on the specified day of each month
        // const schedule = `*/2 * * * *`;
        // Schedule the cron job
        cronJob = cron.schedule(schedule, () => {
          createForm();
        });

        console.log(
          `Cron job scheduled for day ${setting.date} of each month.`
        );
      })
      .catch((err) => console.error("Error fetching settings:", err));

    res.status(200).json({ msg: "Site updated Successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

exports.getSetting = async (req, res) => {
  try {
    const setting = await Setting.find();

    res.status(200).json({ data: setting });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};
