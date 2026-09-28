const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Individual Passenger Sub-schema
const passengerSchema = new Schema({
  name: {
    type: String,
    required: [true, "Passenger name is required"],
    trim: true,
  },
  age: {
    type: Number,
    required: [true, "Passenger age is required"],
    min: 1,
    max: 120,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },
  seatNumber: {
    type: String, // e.g. "L4", "U12", "15A"
    required: [true, "Seat number is required"],
    trim: true,
    uppercase: true,
  },
  seatType: {
    type: String,
    enum: ["Seater", "Sleeper"],
    default: "Seater",
  },
});

const busBookingSchema = new Schema(
  {
    // Unique PNR (Auto-generated)
    pnrNumber: {
      type: String,
      unique: true,
      uppercase: true,
      index: true,
    },

    // User & Bus References
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bus: {
      type: Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },

    // Journey Snapshot (Bus modify hone par bhi booking history safe rahegi)
    journeyDetails: {
      sourceCity: { type: String, required: true },
      destinationCity: { type: String, required: true },
      journeyDate: { type: Date, required: true },
      departureTime: { type: String, required: true },
      arrivalTime: { type: String, required: true },
      busName: { type: String, required: true },
      busNumber: { type: String, required: true },
    },

    // Selected Boarding & Dropping Points
    boardingPoint: {
      locationName: { type: String, required: true },
      landmark: String,
      time: { type: String, required: true },
    },
    droppingPoint: {
      locationName: { type: String, required: true },
      landmark: String,
      time: { type: String, required: true },
    },

    // Passengers & Seats
    passengers: {
      type: [passengerSchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one passenger must be selected.",
      },
    },
    totalSeatsBooked: {
      type: Number,
      required: true,
      min: 1,
    },

    // Contact Information
    contactInfo: {
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // Fare & Payment Breakdown
    fareDetails: {
      baseFare: { type: Number, required: true },
      taxAmount: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      totalFare: { type: Number, required: true },
    },

    paymentInfo: {
      method: {
        type: String,
        enum: ["UPI", "Card", "NetBanking", "Wallet", "CashOnBoard"],
        default: "UPI",
      },
      paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending",
      },
      transactionId: {
        type: String,
        trim: true,
      },
      paidAt: Date,
    },

    // Overall Ticket Status
    bookingStatus: {
      type: String,
      enum: ["Confirmed", "Cancelled", "Completed"],
      default: "Confirmed",
      index: true,
    },

    // Cancellation Details (if user cancels)
    cancellation: {
      isCancelled: { type: Boolean, default: false },
      cancelledAt: Date,
      refundAmount: { type: Number, default: 0 },
      reason: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Random unique PNR generate karne ke liye (e.g. MYT-B9X4A1)
busBookingSchema.pre("save", function () {
  if (!this.pnrNumber) {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.pnrNumber = `MYT-${randomCode}`;
  }
});

module.exports = mongoose.model("BusBooking", busBookingSchema);
