const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stationStopSchema = new Schema({
  stationCode: { type: String, required: true, uppercase: true, trim: true },
  stationName: { type: String, required: true, trim: true },
  arrivalTime: { type: String, required: true }, // e.g. "06:15"
  departureTime: { type: String, required: true },
  haltMinutes: { type: Number, default: 2 },
  dayCount: { type: Number, default: 1 },
});

const trainSchema = new Schema(
  {
    trainNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    trainName: {
      type: String,
      required: true,
      trim: true,
    },
    trainType: {
      type: String,
      enum: ["Vande Bharat", "Rajdhani", "Shatabdi", "Superfast", "Express", "Duronto"],
      default: "Superfast",
    },
    runsOnDays: {
      type: [String], // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    sourceStation: {
      code: { type: String, required: true, uppercase: true },
      name: { type: String, required: true },
      departureTime: { type: String, required: true },
    },
    destinationStation: {
      code: { type: String, required: true, uppercase: true },
      name: { type: String, required: true },
      arrivalTime: { type: String, required: true },
    },
    durationHours: {
      type: Number,
      required: true,
    },
    routeStops: [stationStopSchema],
    classes: [
      {
        className: {
          type: String,
          enum: ["1A", "2A", "3A", "SL", "CC", "EC"],
          required: true,
        },
        fare: { type: Number, required: true },
        totalSeats: { type: Number, default: 60 },
        availableSeats: { type: Number, default: 60 },
      },
    ],
    isActive: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

trainSchema.index({ "sourceStation.code": 1, "destinationStation.code": 1 });
trainSchema.index({ "sourceStation.name": 1, "destinationStation.name": 1 });

module.exports = mongoose.model("Train", trainSchema);