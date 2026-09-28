const express = require("express");
const router = express.Router();
const buses = require("../controllers/buses");
const { isLoggedIn } = require("../middleware"); // Aapka auth middleware
const wrapAsync = require("../utils/wrapAsync"); // Error handler wrapper agar use ho raha ho

// Catalog & Search
router.route("/")
  .get(wrapAsync(buses.index))
  .post(isLoggedIn, wrapAsync(buses.createBus));

router.get("/new", isLoggedIn, buses.renderNewForm);

// Booking Flow
router.route("/:id/book")
  .get(isLoggedIn, wrapAsync(buses.renderBookingForm))
  .post(isLoggedIn, wrapAsync(buses.createBooking));

// Ticket View & Cancellation
router.get("/bookings/:bookingId/ticket", isLoggedIn, wrapAsync(buses.showTicket));
router.post("/bookings/:bookingId/cancel", isLoggedIn, wrapAsync(buses.cancelBooking));
router.get("/:id", wrapAsync(buses.showBus));

module.exports = router;
