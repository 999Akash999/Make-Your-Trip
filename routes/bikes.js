const express = require("express");
const router = express.Router();
const bikes = require("../controllers/bikes");
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");

router.route("/")
  .get(wrapAsync(bikes.index))
  .post(isLoggedIn, wrapAsync(bikes.createBike));

router.get("/new", isLoggedIn, bikes.renderNewForm);
router.get("/bookings/:bookingId/receipt", isLoggedIn, wrapAsync(bikes.showReceipt));

router.route("/:id/book")
  .get(isLoggedIn, wrapAsync(bikes.renderBookingForm))
  .post(isLoggedIn, wrapAsync(bikes.createBooking));

router.get("/:id", wrapAsync(bikes.showBike));

module.exports = router;
