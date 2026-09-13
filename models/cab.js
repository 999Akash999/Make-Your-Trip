const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cabSchema = new Schema(
  {
    // Basic Vehicle Info
    vehicleName: {
      type: String,
      required: [true, "Vehicle name is required"], // e.g., 'Toyota Innova Crysta', 'Maruti Suzuki Dzire'
      trim: true,
    },
    vehicleType: {
      type: String,
      required: true,
      enum: ["Sedan", "Hatchback", "SUV", "Luxury"],
      default: "Sedan",
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Vehicle Features & Capacities
    capacity: {
      passengers: {
        type: Number,
        required: true,
        min: 1,
        max: 8,
        default: 4,
      },
      luggage: {
        type: Number, // bag count
        default: 2,
      },
    },
    hasAC: {
      type: Boolean,
      default: true,
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "CNG", "Electric"],
      default: "Diesel",
    },

    // Media
    image: {
      url: {
        type: String,
        default: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341",
      },
      filename: String,
    },

    // Driver Details
    driver: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 4.8,
      },
      totalTrips: {
        type: Number,
        default: 0,
      },
    },

    // Operating Routes / Location
    operatingCity: {
      type: String,
      required: true,
      trim: true, // e.g., 'Delhi', 'Mumbai'
    },
    serviceTypes: [
      {
        type: String,
        enum: ["One-Way", "Round-Trip", "Airport Transfer", "Local Rental"],
      },
    ],

    // Fare & Pricing
    pricing: {
      baseFare: {
        type: Number, // Starting charge (₹)
        required: true,
      },
      pricePerKm: {
        type: Number, // Per km rate (₹)
        required: true,
      },
      extraHourCharge: {
        type: Number, // Hourly charge for rentals (₹)
        default: 150,
      },
    },

    // Status
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Host / Vendor reference
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

cabSchema.index({ operatingCity: 1, isAvailable: 1 });

module.exports = mongoose.model("Cab", cabSchema);