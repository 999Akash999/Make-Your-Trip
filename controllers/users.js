const User = require("../models/user");
const Listing = require("../models/listing");
const FlightBooking = require("../models/flightBooking");
const TrainBooking = require("../models/trainBooking");
const BusBooking = require("../models/busBooking");
const BikeBooking = require("../models/bikeBooking");
const CabBooking = require("../models/cabBooking");
const cloudinary = require("../cloudConfig");

module.exports.renderSignup = (req, res) => res.render("users/signup");

module.exports.Signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const registeredUser = await User.register(new User({ username, email }), password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Make Your Trip!");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.renderLogin = (req, res) => res.render("users/login");
module.exports.Login = (req, res) => {
  req.flash("success", "Welcome back!");
  res.redirect(res.locals.redirectUrl || "/listings");
};

module.exports.Logout = (req, res, next) => req.logout((err) => {
  if (err) return next(err);
  req.flash("success", "You are logged out!");
  res.redirect("/listings");
});

module.exports.profile = async (req, res) => {
  const user = await User.findById(req.user._id);
  const listingsCount = await Listing.countDocuments({ owner: req.user._id });
  const bookings = await FlightBooking.find({ user: req.user._id }).populate("flight").sort({ bookingDate: -1 });
  res.render("users/profile", {
    user, listingsCount, bookingsCount: bookings.length,
    cancelledBookings: bookings.filter((booking) => booking.status === "Cancelled").length,
    bookings,
  });
};

module.exports.bookings = async (req, res) => {
  const [flightBookings, trainBookings, busBookings, bikeBookings, cabBookings] = await Promise.all([
    FlightBooking.find({ user: req.user._id }).populate("flight").sort({ bookingDate: -1 }),
    TrainBooking.find({ user: req.user._id }).sort({ createdAt: -1 }),
    BusBooking.find({ user: req.user._id }).sort({ createdAt: -1 }),
    BikeBooking.find({ user: req.user._id }).sort({ createdAt: -1 }),
    CabBooking.find({ user: req.user._id }).populate("cab").sort({ createdAt: -1 }),
  ]);
  res.render("users/bookings", { flightBookings, trainBookings, busBookings, bikeBookings, cabBookings });
};

module.exports.renderEditProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.render("users/editProfile", { user });
};

module.exports.updateProfile = async (req, res) => {
  const { bio, phone, city } = req.body;
  const update = { bio, phone, city };
  if (req.file) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "users" }, (err, value) => err ? reject(err) : resolve(value));
      stream.end(req.file.buffer);
    });
    update.image = { url: result.secure_url, filename: result.public_id };
  }
  await User.findByIdAndUpdate(req.user._id, update, { runValidators: true });
  req.flash("success", "Profile updated");
  res.redirect("/profile");
};
