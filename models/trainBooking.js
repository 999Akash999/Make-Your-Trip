const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passengerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 1, max: 120 },
  gender: { type: String, enum: ["Male", "Female", "Transgender"], required: true },
  berthPreference: {
    type: String,
    enum: ["Lower", "Middle", "Upper", "Side Lower", "Side Upper", "No Preference"],
    default: "No Preference",
  },
  allocatedCoach: { type: String, default: "B1" },
  allocatedBerth: { type: Number, default: 12 },
});

const trainBookingSchema = new Schema(
  {
    pnrNumber: {
      type: String,
      unique: true,
      uppercase: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    train: { type: Schema.Types.ObjectId, ref: "Train", required: true },
    journeyDetails: {
      trainNumber: { type: String, required: true },
      trainName: { type: String, required: true },
      fromStation: { type: String, required: true },
      toStation: { type: String, required: true },
      journeyDate: { type: Date, required: true },
      bookedClass: { type: String, required: true },
      quota: { type: String, default: "General" },
    },
    passengers: [passengerSchema],
    totalFare: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed", "Refunded"],
      default: "Paid",
    },
    bookingStatus: {
      type: String,
      enum: ["Confirmed (CNF)", "RAC", "Waitlist (WL)", "Cancelled"],
      default: "Confirmed (CNF)",
    },
    contactInfo: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
  },
  { timestamps: true }
);

trainBookingSchema.pre("save", function () {
  if (!this.pnrNumber) {
    // 10-digit realistic PNR format
    const random10 = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    this.pnrNumber = random10;
  }
});

module.exports = mongoose.model("TrainBooking", trainBookingSchema);
