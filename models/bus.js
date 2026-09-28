const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Sub-schema for individual stops/points along the route
const stopPointSchema = new Schema({
  locationName: {
    type: String,
    required: true,
    trim: true,
  },
  landmark: {
    type: String,
    trim: true,
  },
  time: {
    type: String, // e.g. "21:30" or ISO time
    required: true,
  },
});

const busSchema = new Schema(
  {
    // Bus & Operator Details
    busName: {
      type: String,
      required: [true, "Bus name/service name is required"],
      trim: true,
    },
    busNumber: {
      type: String,
      required: [true, "Vehicle registration number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    operatorName: {
      type: String,
      required: true,
      trim: true,
    },
    operatorRating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },

    // Bus Classification
    busType: {
      type: String,
      enum: ["Sleeper", "Semi-Sleeper", "Seater", "Volvo Multi-Axle", "AC", "Non-AC"],
      required: true,
    },
    hasAC: {
      type: Boolean,
      default: true,
    },

    // Primary Route
    sourceCity: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    destinationCity: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Timings
    departureTime: {
      type: Date,
      required: true,
    },
    arrivalTime: {
      type: Date,
      required: true,
    },
    durationHours: {
      type: Number, // e.g. 7.5 (7 hours 30 mins)
      required: true,
    },

    // Stops on this Route
    boardingPoints: [stopPointSchema],
    droppingPoints: [stopPointSchema],

    // Capacity & Seating Layout
    totalSeats: {
      type: Number,
      required: true,
      min: 10,
      max: 60,
    },
    bookedSeats: {
      type: [String], // Array of booked seat numbers, e.g. ["U1", "L4", "12A"]
      default: [],
    },

    // Pricing Breakdown
    pricing: {
      seaterPrice: {
        type: Number,
        required: true,
      },
      sleeperPrice: {
        type: Number,
        default: 0,
      },
      taxPercent: {
        type: Number,
        default: 5,
      },
    },

    // Amenities
    amenities: {
      wifi: { type: Boolean, default: false },
      chargingPoint: { type: Boolean, default: true },
      waterBottle: { type: Boolean, default: true },
      blanket: { type: Boolean, default: false },
      liveTracking: { type: Boolean, default: true },
      readingLight: { type: Boolean, default: true },
    },

    // Media
    image: {
      url: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
      },
      filename: String,
    },

    // Status & Host/Admin Reference
    isActive: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Available Seats Count
busSchema.virtual("availableSeats").get(function () {
  return this.totalSeats - (this.bookedSeats ? this.bookedSeats.length : 0);
});

// Compound Index for fast search queries by source, destination, and date
busSchema.index({ sourceCity: 1, destinationCity: 1, departureTime: 1 });

module.exports = mongoose.model("Bus", busSchema);