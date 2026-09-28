const Train = require("../models/train");
const TrainBooking = require("../models/trainBooking");

// 1. Search & List Trains
module.exports.index = async (req, res) => {
  const { from, to, date } = req.query;
  const filter = { isActive: true };

  if (from) {
    filter.$or = [
      { "sourceStation.code": new RegExp(from.trim(), "i") },
      { "sourceStation.name": new RegExp(from.trim(), "i") },
    ];
  }
  if (to) {
    filter.$and = filter.$and || [];
    filter.$and.push({$or: [
        { "destinationStation.code": new RegExp(to.trim(), "i") },
        { "destinationStation.name": new RegExp(to.trim(), "i") },
      ],
    });
  }

  const trains = await Train.find(filter);
  res.render("trains/index", {
    trains,
    searchFrom: from || "",
    searchTo: to || "",
    searchDate: date || "",
  });
};

// 2. Train Details & Live Schedule
module.exports.showTrain = async (req, res) => {
  const { id } = req.params;
  const train = await Train.findById(id);

  if (!train) {
    req.flash("error", "Train route not found!");
    return res.redirect("/trains");
  }

  res.render("trains/show", { train });
};

// 3. Render Booking Form
module.exports.renderBookingForm = async (req, res) => {
  const { id } = req.params;
  const { classType } = req.query;
  const train = await Train.findById(id);

  if (!train) {
    req.flash("error", "Train not found!");
    return res.redirect("/trains");
  }

  const selectedClass = train.classes.find((c) => c.className === classType) || train.classes[0];
  res.render("trains/book", { train, selectedClass });
};

// 4. Confirm & Process Ticket
module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { classType, journeyDate, passengers, contactInfo } = req.body;

  const train = await Train.findById(id);
  if (!train) {
    req.flash("error", "Train not available.");
    return res.redirect("/trains");
  }

  const coachClass = train.classes.find((c) => c.className === classType);
  const passengerList = Array.isArray(passengers) ? passengers : passengers ? [passengers] : [];
  if (!passengerList.length || !coachClass || coachClass.availableSeats < passengerList.length) {
    req.flash("error", "Seats unavailable in selected class.");
    return res.redirect(`/trains/${id}`);
  }

  // Assign realistic coach & berth numbers
  const coachPrefix = classType === "3A" ? "B" : classType === "2A" ? "A" : classType === "1A" ? "H" : "S";
  const processedPassengers = passengerList.map((p, idx) => ({
    name: p.name,
    age: p.age,
    gender: p.gender,
    berthPreference: p.berthPreference,
    allocatedCoach: `${coachPrefix}1`,
    allocatedBerth: Math.floor(Math.random() * 64) + 1,
  }));

  const totalFare = coachClass.fare * processedPassengers.length;

  const booking = new TrainBooking({
    user: req.user._id,
    train: train._id,
    journeyDetails: {
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      fromStation: `${train.sourceStation.name} (${train.sourceStation.code})`,
      toStation: `${train.destinationStation.name} (${train.destinationStation.code})`,
      journeyDate: new Date(journeyDate || Date.now()),
      bookedClass: classType,
      quota: "General",
    },
    passengers: processedPassengers,
    totalFare,
    contactInfo,
    bookingStatus: "Confirmed (CNF)",
  });

  await booking.save();

  // Deduct seat count
  coachClass.availableSeats -= processedPassengers.length;
  await train.save();

  req.flash("success", "Train ticket booked! PNR generated.");
  res.redirect(`/trains/bookings/${booking._id}/ticket`);
};

// 5. Show PNR Ticket View
module.exports.showTicket = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await TrainBooking.findOne({ _id: bookingId, user: req.user._id }).populate("user").populate("train");

  if (!booking) {
    req.flash("error", "Booking record not found.");
    return res.redirect("/trains");
  }

  res.render("trains/ticket", { booking });
};
