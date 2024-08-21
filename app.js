const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const { errHandling } = require("./utils/errorController");

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
// Connect to Database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/sites", siteRoutes);

//sample trial for protected routs
app.use("/api/protected", protectedRoutes);

// indicator form routes
app.use("/api/forms", formRoutes);

app.all("*", (req, res, next) => {
  return next(new AppErorr("Page is not found", 404));
});

app.use(errHandling);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
