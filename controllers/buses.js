const Bus = require("../models/bus");
const BusBooking = require("../models/busBooking");

// 1. Search & List All Buses
module.exports.index = async (req, res) => {
  const { source, destination, date, busType } = req.query;
  const filter = { isActive: true };

  if (source) filter.sourceCity = new RegExp(source.trim(), "i");
  if (destination) filter.destinationCity = new RegExp(destination.trim(), "i");
  if (busType) filter.busType = busType;

  if (date) {
    const journeyDate = new Date(date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    filter.departureTime = { $gte: journeyDate,$lt: nextDate };
  }

  const buses = await Bus.find(filter).sort({ departureTime: 1 });
  res.render("buses/index", {
    buses,
    searchSource: source || "",
    searchDestination: destination || "",
    searchDate: date || "",
    searchType: busType || "",
  });
};

// 2. Render New Bus Form (Admin/Host)
module.exports.renderNewForm = (req, res) => {
  res.render("buses/new");
};

// 3. Create New Bus
module.exports.createBus = async (req, res) => {
  const newBus = new Bus(req.body.bus);
  newBus.owner = req.user._id;

  if (req.file) {
    newBus.image = { url: req.file.path, filename: req.file.filename };
  }

  await newBus.save();
  req.flash("success", "Bus service created successfully!");
  res.redirect(`/buses/${newBus._id}`);
};

// 4. Show Single Bus Details & Seat Layout
module.exports.showBus = async (req, res) => {
  const { id } = req.params;
  const bus = await Bus.findById(id).populate("owner");

  if (!bus) {
    req.flash("error", "Bus route not found!");
    return res.redirect("/buses");
  }

  res.render("buses/show", { bus });
};

// 5. Render Booking / Seat Selection Form
module.exports.renderBookingForm = async (req, res) => {
  const { id } = req.params;
  const bus = await Bus.findById(id);

  if (!bus) {
    req.flash("error", "Bus not found!");
    return res.redirect("/buses");
  }

  res.render("buses/book", { bus });
};

// 6. Process Ticket Booking
module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { passengers, boardingPointId, droppingPointId, contactInfo, paymentMethod } = req.body;

  const bus = await Bus.findById(id);
  if (!bus) {
    req.flash("error", "Bus unavailable.");
    return res.redirect("/buses");
  }

  // Ensure passengers is array
  const passengerList = Array.isArray(passengers) ? passengers : passengers ? [passengers] : [];
  if (!passengerList.length || passengerList.some((passenger) => !passenger.seatNumber || !passenger.name || !passenger.age || !passenger.gender)) {
    req.flash("error", "Select at least one seat and enter each passenger's details.");
    return res.redirect(`/buses/${id}/book`);
  }
  const requestedSeats = passengerList.map((p) => p.seatNumber.toUpperCase());

  // Prevent double booking
  const conflict = requestedSeats.some((seat) => bus.bookedSeats.includes(seat));
  if (conflict) {
    req.flash("error", "One or more seats have already been booked. Please pick other seats.");
    return res.redirect(`/buses/${id}/book`);
  }

  // Calculate Fare
  const seatRate = bus.pricing.seaterPrice;
  const baseFare = seatRate * requestedSeats.length;
  const taxAmount = Math.round(baseFare * ((bus.pricing.taxPercent || 5) / 100));
  const totalFare = baseFare + taxAmount;

  // Resolve Boarding & Dropping Points
  const selectedBoarding = bus.boardingPoints.id(boardingPointId);
  const selectedDropping = bus.droppingPoints.id(droppingPointId);

  const newBooking = new BusBooking({
    user: req.user._id,
    bus: bus._id,
    journeyDetails: {
      sourceCity: bus.sourceCity,
      destinationCity: bus.destinationCity,
      journeyDate: bus.departureTime,
      departureTime: selectedBoarding ? selectedBoarding.time : "Scheduled",
      arrivalTime: selectedDropping ? selectedDropping.time : "Scheduled",
      busName: bus.busName,
      busNumber: bus.busNumber,
    },
    boardingPoint: {
      locationName: selectedBoarding ? selectedBoarding.locationName : "Main Station",
      landmark: selectedBoarding?.landmark || "",
      time: selectedBoarding ? selectedBoarding.time : "",
    },
    droppingPoint: {
      locationName: selectedDropping ? selectedDropping.locationName : "Main Station",
      landmark: selectedDropping?.landmark || "",
      time: selectedDropping ? selectedDropping.time : "",
    },
    passengers: passengerList,
    totalSeatsBooked: requestedSeats.length,
    contactInfo,
    fareDetails: {
      baseFare,
      taxAmount,
      totalFare,
    },
    paymentInfo: {
      method: paymentMethod || "UPI",
      paymentStatus: "Paid",
      transactionId: `BUS-${Date.now()}`,
      paidAt: new Date(),
    },
  });

  await newBooking.save();

  // Update booked seats array on Bus model
  bus.bookedSeats.push(...requestedSeats);
  await bus.save();

  req.flash("success", "Ticket booked successfully!");
  res.redirect(`/buses/bookings/${newBooking._id}/ticket`);
};

// 7. View Ticket / PNR Confirmation
module.exports.showTicket = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await BusBooking.findOne({ _id: bookingId, user: req.user._id }).populate("user").populate("bus");

  if (!booking) {
    req.flash("error", "Ticket not found!");
    return res.redirect("/buses");
  }

  res.render("buses/ticket", { booking });
};

// 8. Cancel Ticket & Free Up Seats
module.exports.cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await BusBooking.findOne({ _id: bookingId, user: req.user._id });

  if (!booking || booking.bookingStatus === "Cancelled") {
    req.flash("error", "Invalid booking or ticket already cancelled.");
    return res.redirect("/buses");
  }

  // Release Seats from the Bus document
  const seatsToRelease = booking.passengers.map((p) => p.seatNumber);
  await Bus.findByIdAndUpdate(booking.bus, {
    $pull: { bookedSeats: {$in: seatsToRelease } },
  });

  // Mark status cancelled with 80% refund
  booking.bookingStatus = "Cancelled";
  booking.cancellation = {
    isCancelled: true,
    cancelledAt: new Date(),
    refundAmount: Math.round(booking.fareDetails.totalFare * 0.8),
    reason: req.body.reason || "User requested cancellation",
  };
  await booking.save();

  req.flash("success", "Ticket cancelled. Refund initiated.");
  res.redirect(`/buses/bookings/${booking._id}/ticket`);
};
