const express = require("express");
const router = express.Router();
const cabBookings = require("../controllers/cabBooking");
const { isLoggedIn } = require("../middleware");

router.get("/my-bookings", isLoggedIn, cabBookings.myBookings);
router.get("/new/:cabId", isLoggedIn, cabBookings.renderBookingForm);
router.post("/", isLoggedIn, cabBookings.createBooking);

router.route("/:id")
  .get(isLoggedIn, cabBookings.showBooking);

router.put("/:id/cancel", isLoggedIn, cabBookings.cancelBooking);

module.exports = router;
