const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const flightController =
require("../controllers/flights");

router.get("/", wrapAsync(flightController.index));

router.get("/search",
 wrapAsync(flightController.search));
router.get(
    "/my-bookings",
    isLoggedIn, wrapAsync(
        flightController.myBookings
    )
);
router.get("/bookings/:bookingId/ticket", isLoggedIn, wrapAsync(flightController.showTicket));

router.get("/:id",
 wrapAsync(flightController.show));

router.post(
 "/book/:id",
 isLoggedIn, wrapAsync(flightController.bookFlight)
);


router.delete(
    "/booking/:bookingId",
    isLoggedIn, wrapAsync(
        flightController.cancelBooking
    )
);
module.exports = router;
