const express = require("express");
const router = express.Router();
const trains = require("../controllers/trains");
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");

router.get("/", wrapAsync(trains.index));
router.route("/:id/book")
  .get(isLoggedIn, wrapAsync(trains.renderBookingForm))
  .post(isLoggedIn, wrapAsync(trains.createBooking));

router.get("/bookings/:bookingId/ticket", isLoggedIn, wrapAsync(trains.showTicket));
router.get("/:id", wrapAsync(trains.showTrain));

module.exports = router;
