const Flight = require("../models/flight");
const FlightBooking = require("../models/flightBooking");
const ExpressError = require("../utils/ExpressError");

module.exports.index = async (req, res) => {
  const flights = await Flight.find({});
  res.render("flights/index", { flights, searchSource: "", searchDestination: "" });
};

module.exports.search = async (req, res) => {
  const { source, destination } = req.query;
  const filter = {};
  if (source?.trim()) filter.source = { $regex: source.trim(), $options: "i" };
  if (destination?.trim()) filter.destination = { $regex: destination.trim(), $options: "i" };
  const flights = await Flight.find(filter);
  res.render("flights/index", {
    flights,
    searchSource: source || "",
    searchDestination: destination || "",
  });
};

module.exports.show = async (req, res) => {
  const flight = await Flight.findById(req.params.id);
  if (!flight) {
    req.flash("error", "Flight not found");
    return res.redirect("/flights");
  }
  res.render("flights/show", { flight });
};

module.exports.bookFlight = async (req, res) => {
  const flight = await Flight.findById(req.params.id);
  if (!flight) {
    req.flash("error", "Flight not found");
    return res.redirect("/flights");
  }
  if (flight.seatsAvailable <= 0) {
    req.flash("error", "Flight sold out");
    return res.redirect(`/flights/${flight._id}`);
  }
  const booking = await new FlightBooking({ user: req.user._id, flight: flight._id, totalAmount: flight.price }).save();
  flight.seatsAvailable -= 1;
  await flight.save();
  req.flash("success", "Flight booked successfully!");
  res.redirect(`/flights/bookings/${booking._id}/ticket`);
};

module.exports.myBookings = async (req, res) => {
  const bookings = await FlightBooking.find({ user: req.user._id }).populate("flight").sort({ bookingDate: -1 });
  res.render("flights/bookings", { bookings });
};

module.exports.showTicket = async (req, res) => {
  const booking = await FlightBooking.findOne({ _id: req.params.bookingId, user: req.user._id }).populate("flight");
  if (!booking) throw new ExpressError(404, "Booking not found");
  res.render("flights/ticket", { booking });
};

module.exports.cancelBooking = async (req, res) => {
  const booking = await FlightBooking.findOne({ _id: req.params.bookingId, user: req.user._id });
  if (!booking) throw new ExpressError(404, "Booking not found");
  if (booking.status !== "Cancelled") {
    const flight = await Flight.findById(booking.flight);
    if (flight) {
      flight.seatsAvailable += 1;
      await flight.save();
    }
    booking.status = "Cancelled";
    await booking.save();
  }
  req.flash("success", "Booking cancelled");
  res.redirect("/flights/my-bookings");
};
