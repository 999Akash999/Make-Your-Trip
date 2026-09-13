const express = require("express");
const router = express.Router();
const cabBookings = require("../controllers/cabBooking");

router.get("/my-bookings", cabBookings.myBookings);
router.get("/new/:cabId", cabBookings.renderBookingForm);
router.post("/", cabBookings.createBooking);

router.route("/:id")
  .get(cabBookings.showBooking);

router.put("/:id/cancel", cabBookings.cancelBooking);

module.exports = router;