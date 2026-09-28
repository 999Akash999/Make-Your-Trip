const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bikeSchema = new Schema(
  {
    bikeName: {
      type: String,
      required: true,
      trim: true,
    },
    bikeModelYear: {
      type: Number,
      default: 2024,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    bikeType: {
      type: String,
      enum: ["Scooter", "Cruiser", "Sports", "Commuter", "Adventure", "Electric"],
      required: true,
    },
    engineCC: {
      type: Number,
      required: true, // e.g., 110, 350, 650
    },
    operatingCity: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    pickupLocations: [
      {
        hubName: { type: String, required: true },
        address: { type: String, required: true },
      },
    ],
    pricing: {
      dailyRent: { type: String, required: false }, // fallback safe
      dailyRent: { type: Number, required: true }, // e.g. ₹500/day
      hourlyRent: { type: Number, required: true }, // e.g. ₹60/hr
      securityDeposit: { type: Number, default: 1000 },
      freeKmPerDay: { type: Number, default: 120 },
      extraKmCharge: { type: Number, default: 5 },
    },
    features: {
      helmetIncluded: { type: Boolean, default: true },
      extraHelmetAvailable: { type: Boolean, default: true },
      fuelType: { type: String, default: "Petrol" },
      tankCapacityLitres: { type: Number, default: 12 },
    },
    image: {
      url: {
        type: String,
        default: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
      },
      filename: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

bikeSchema.index({ operatingCity: 1, bikeType: 1, isAvailable: 1 });

module.exports = mongoose.model("Bike", bikeSchema);