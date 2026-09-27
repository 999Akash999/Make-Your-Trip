const Cab = require("../models/cab");
const CabBooking = require("../models/CabBooking");

// 1. Render Booking Screen
module.exports.renderBookingForm = async (req, res, next) => {
  try {
    const { cabId } = req.params;
    const cab = await Cab.findById(cabId);

    if (!cab) {
      const err = new Error("Cab not found for booking");
      err.statusCode = 404;
      return next(err);
    }

    res.render("cabs/book", { cab });
  } catch (err) {
    next(err);
  }
};

// 2. Process Booking Creation
module.exports.createBooking = async (req, res, next) => {
  try {
    const { cabId, pickup, drop, departureTime, distanceKm, tripType, paymentMethod } = req.body;

    const cab = await Cab.findById(cabId);
    if (!cab) {
      const err = new Error("Cab not found");
      err.statusCode = 404;
      return next(err);
    }

    // Price calculation
    const distance = Number(distanceKm) || 15; // default fallback km
    const baseFare = cab.pricing.baseFare;
    const distanceFare = distance * cab.pricing.pricePerKm;
    const tollAndTaxes = Math.round((baseFare + distanceFare) * 0.05); // 5% GST/Toll
    const totalFare = baseFare + distanceFare + tollAndTaxes;

    const booking = new CabBooking({
      cab: cab._id,
      user: req.user._id,
      tripType: tripType || "One-Way",
      pickup: { address: pickup },
      drop: { address: drop },
      departureTime: new Date(departureTime),
      distanceKm: distance,
      fareDetails: {
        baseFare,
        distanceFare,
        tollAndTaxes,
        totalFare,
      },
      payment: {
        method: paymentMethod || "UPI",
        status: "Paid",
      },
    });

    await booking.save();
    res.redirect(`/bookings/cabs/${booking._id}`);
  } catch (err) {
    next(err);
  }
};

// 3. Show Booking Confirmation / Receipt
module.exports.showBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await CabBooking.findById(id)
      .populate("cab")
      .populate("user", "username email phone");

    if (!booking) {
      const err = new Error("Booking confirmation not found");
      err.statusCode = 404;
      return next(err);
    }

    res.render("cabs/bookingConfirmation", { booking });
  } catch (err) {
    next(err);
  }
};

// 4. View Logged-in User's Bookings
module.exports.myBookings = async (req, res, next) => {
  try {
    const bookings = await CabBooking.find({ user: req.user._id })
      .populate("cab")
      .sort({ createdAt: -1 });

    res.render("cabs/myBookings", { bookings });
  } catch (err) {
    next(err);
  }
};

// 5. Cancel Booking
module.exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await CabBooking.findById(id);
    if (!booking) {
      const err = new Error("Booking not found");
      err.statusCode = 404;
      return next(err);
    }

    booking.rideStatus = "Cancelled";
    booking.cancelledBy = "User";
    booking.cancellationReason = reason || "Cancelled by passenger";
    await booking.save();

    res.redirect(`/bookings/cabs/${id}`);
  } catch (err) {
    next(err);
  }
};