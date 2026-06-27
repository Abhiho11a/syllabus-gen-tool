const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema(
  {
    type: { type: String, default: "global" }, // Used to easily find the singleton document
    totalGenerated: { type: Number, default: 0 },
    pdfCount: { type: Number, default: 0 },
    docxCount: { type: Number, default: 0 },
    jsonCount: { type: Number, default: 0 },
  },
  {
    collection: "syllabus gen stats", // Explicit collection name requested by user
    timestamps: true,
  }
);

const Stats = mongoose.model("Stats", statsSchema);

module.exports = Stats;
