const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const { errHandling } = require("./utils/errorController");
const AppErorr = require("./utils/appError");

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "*",
  })
);
//Routes
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const userRoutes = require("./routes/userRoutes");
const siteRoutes = require("./routes/siteRoutes");
const regionRoutes = require("./routes/regionRoutes");
const formRoutes = require("./routes/formRoutes");
const settingRoutes = require("./routes/settingRoutes");
const { Setting, Form, Site } = require("./models/models");
const { getDateWithDay } = require("./utils/helper");
// Connect to Database

connectDB();

// Middleware
app.use(express.json());

let cronJob;

// Routes
// function stopCronJob() {
//   if (cronJob) {
//     cronJob.stop();
//     console.log("Cron job stopped manually.");
//   } else {
//     console.log("No cron job to stop.");
//   }
// }
// stopCronJob();
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/sites", siteRoutes);

//sample trial for protected routs
app.use("/api/protected", protectedRoutes);

// indicator form routes
app.use("/api/indicators", formRoutes);
app.use("/api/setting", settingRoutes);

app.all("*", (req, res, next) => {
  return next(new AppErorr("Page is not found", 404));
});

app.use(errHandling);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
