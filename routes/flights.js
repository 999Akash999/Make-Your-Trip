const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const flightController =
require("../controllers/flights");

router.get("/", wrapAsync(flightController.index));

router.get("/search",
 wrapAsync(flightController.search));
 router.get(
    "/my-bookings",
    wrapAsync(
        flightController.myBookings
    )
);

router.get("/:id",
 wrapAsync(flightController.show));

router.post(
 "/book/:id",
 wrapAsync(flightController.bookFlight)
);

module.exports = router;
router.delete(
    "/booking/:bookingId",
    wrapAsync(
        flightController.cancelBooking
    )
);