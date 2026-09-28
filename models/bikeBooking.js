const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bikeBookingSchema = new Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
      uppercase: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bike: {
      type: Schema.Types.ObjectId,
      ref: "Bike",
      required: true,
    },
    rentalDetails: {
      bikeName: { type: String, required: true },
      registrationNumber: { type: String, required: true },
      city: { type: String, required: true },
      pickupHub: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      totalDays: { type: Number, required: true, min: 1 },
    },
    driverInfo: {
      fullName: { type: String, required: true },
      drivingLicenseNumber: { type: String, required: true, uppercase: true },
      contactNumber: { type: String, required: true },
      email: { type: String, required: true },
    },
    fareBreakdown: {
      rentAmount: { type: Number, required: true },
      securityDeposit: { type: Number, required: true },
      taxAmount: { type: Number, default: 0 },
      totalAmountPaid: { type: Number, required: true },
    },
    paymentInfo: {
      paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Refunded"],
        default: "Paid",
      },
      transactionId: String,
      paidAt: Date,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Active", "Returned", "Cancelled"],
      default: "Confirmed",
    },
  },
  { timestamps: true }
);

bikeBookingSchema.pre("save", function () {
  if (!this.bookingCode) {
    this.bookingCode = `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
});

module.exports = mongoose.model("BikeBooking", bikeBookingSchema);
