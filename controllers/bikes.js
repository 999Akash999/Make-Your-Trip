const Bike = require("../models/bike");
const BikeBooking = require("../models/bikeBooking");
const ExpressError = require("../utils/ExpressError");

// 1. All Bikes & Filter
module.exports.index = async (req, res) => {
  const { city, bikeType } = req.query;
  const filter = { isAvailable: true };

  if (city) filter.operatingCity = new RegExp(city.trim(), "i");
  if (bikeType) filter.bikeType = bikeType;

  const bikes = await Bike.find(filter);
  res.render("bikes/index", {
    bikes,
    searchCity: city || "",
    searchType: bikeType || "",
  });
};

// 2. New Bike Form
module.exports.renderNewForm = (req, res) => {
  res.render("bikes/new");
};

// 3. Create Bike
module.exports.createBike = async (req, res) => {
  const bike = new Bike(req.body.bike);
  bike.owner = req.user._id;

  if (req.file) {
    bike.image = { url: req.file.path, filename: req.file.filename };
  }

  await bike.save();
  req.flash("success", "New bike listed successfully!");
  res.redirect(`/bikes/${bike._id}`);
};

// 4. Show Bike Details
module.exports.showBike = async (req, res) => {
  const { id } = req.params;
  const bike = await Bike.findById(id).populate("owner");

  if (!bike) {
    req.flash("error", "Bike listing not found!");
    return res.redirect("/bikes");
  }

  res.render("bikes/show", { bike });
};

// 5. Booking Form
module.exports.renderBookingForm = async (req, res) => {
  const { id } = req.params;
  const bike = await Bike.findById(id);

  if (!bike || !bike.isAvailable) {
    req.flash("error", "Bike is not available for rental.");
    return res.redirect("/bikes");
  }

  res.render("bikes/book", { bike });
};

// 6. Process Rental Booking
module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { pickupHub, startDate, endDate, driverInfo } = req.body;

  const bike = await Bike.findById(id);
  if (!bike || !bike.isAvailable) {
    req.flash("error", "Bike is currently unavailable.");
    return res.redirect("/bikes");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new ExpressError(400, "Choose a valid rental start and end date.");
  }
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const rentAmount = totalDays * bike.pricing.dailyRent;
  const securityDeposit = bike.pricing.securityDeposit;
  const taxAmount = Math.round(rentAmount * 0.05); // 5% GST
  const totalAmountPaid = rentAmount + securityDeposit + taxAmount;

  const booking = new BikeBooking({
    user: req.user._id,
    bike: bike._id,
    rentalDetails: {
      bikeName: bike.bikeName,
      registrationNumber: bike.registrationNumber,
      city: bike.operatingCity,
      pickupHub,
      startDate: start,
      endDate: end,
      totalDays,
    },
    driverInfo,
    fareBreakdown: {
      rentAmount,
      securityDeposit,
      taxAmount,
      totalAmountPaid,
    },
    paymentInfo: {
      paymentStatus: "Paid",
      transactionId: `BK-TXN-${Date.now()}`,
      paidAt: new Date(),
    },
  });

  await booking.save();

  // Mark bike unavailable during active rental
  bike.isAvailable = false;
  await bike.save();

  req.flash("success", "Bike rented successfully!");
  res.redirect(`/bikes/bookings/${booking._id}/receipt`);
};

// 7. Booking Confirmation Receipt
module.exports.showReceipt = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await BikeBooking.findOne({ _id: bookingId, user: req.user._id }).populate("bike").populate("user");

  if (!booking) {
    req.flash("error", "Booking receipt not found!");
    return res.redirect("/bikes");
  }

  res.render("bikes/receipt", { booking });
};
