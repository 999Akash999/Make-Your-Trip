const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cabBookingSchema = new Schema(
  {
    // Unique Public Booking Reference ID (e.g., CAB-829104)
    bookingId: {
      type: String,
      unique: true,
      default: () => "CAB-" + Math.floor(100000 + Math.random() * 900000),
    },

    // Foreign Keys / References
    cab: {
      type: Schema.Types.ObjectId,
      ref: "Cab",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Trip Info
    tripType: {
      type: String,
      enum: ["One-Way", "Round-Trip", "Airport Transfer", "Local Rental"],
      default: "One-Way",
    },
    pickup: {
      address: {
        type: String,
        required: [true, "Pickup address is required"],
        trim: true,
      },
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    drop: {
      address: {
        type: String,
        required: [true, "Drop address is required"],
        trim: true,
      },
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    // Dates & Times
    departureTime: {
      type: Date,
      required: [true, "Pickup date & time is required"],
    },
    returnTime: {
      type: Date, // If round trip
    },

    // Route Metrics
    distanceKm: {
      type: Number,
      default: 0,
    },
    estimatedDuration: {
      type: String, // e.g., '2 hrs 45 mins'
    },

    // Fare Breakdown
    fareDetails: {
      baseFare: {
        type: Number,
        required: true,
      },
      distanceFare: {
        type: Number,
        default: 0,
      },
      tollAndTaxes: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      totalFare: {
        type: Number,
        required: true,
      },
    },

    // Ride Progress
    rideStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Driver Assigned",
        "Arrived",
        "Ongoing",
        "Completed",
        "Cancelled",
      ],
      default: "Confirmed",
    },

    // Payment Info
    payment: {
      method: {
        type: String,
        enum: ["Card", "UPI", "NetBanking", "Cash On Pickup", "Wallet"],
        default: "UPI",
      },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Paid",
      },
      transactionId: {
        type: String,
      },
    },

    // Security Start Code
    rideOtp: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },

    // Cancellation
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: String,
      enum: ["User", "Driver", "Admin"],
    },
  },
  {
    timestamps: true,
  }
);

cabBookingSchema.index({ user: 1, createdAt: -1 });
cabBookingSchema.index({ cab: 1, departureTime: 1 });

module.exports = mongoose.model("CabBooking", cabBookingSchema);