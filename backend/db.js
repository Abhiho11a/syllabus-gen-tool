const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // The DB_URI in .env has "password" placeholder. We replace it with the actual DB_PASSWORD.
    // Also appending "test" database as per the user's screenshot.
    const dbUri = process.env.DB_URI.replace("password", process.env.DB_PASSWORD)

    await mongoose.connect(dbUri);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
