const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); //  environment

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
      // "mongodb+srv://marshyordanos:marshal1111@cluster0.brz8d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
