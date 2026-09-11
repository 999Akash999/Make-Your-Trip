const Flight = require("../models/flight");
const FlightBooking = require("../models/flightBooking");

// All Flights
module.exports.index = async (req, res) => {
    const flights = await Flight.find({});
    res.render("flights/index", { flights });
};

// Search Flights
// module.exports.search = async (req, res) => {

//     const { source, destination } = req.query;

//     const flights = await Flight.find({
//         source: {
//             $regex: source,
//             $options: "i"
//         },
//         destination: {
//             $regex: destination,
//             $options: "i"
//         }
//     });
//  console.log("Found:", flights.length);

//     res.render("flights/index", { flights });
// }; 
 module.exports.search = async (req,res)=>{

    console.log("Query:", req.query);

    const { source,destination } = req.query;

    const flights = await Flight.find({
        source: {
            $regex: source,
            $options: "i"
        },
        destination: {
            $regex: destination,
            $options: "i"
        }
    });

    console.log("Flights Found:", flights.length);
    console.log(flights);

    res.render("flights/index",{ flights });
};

// Show Single Flight
module.exports.show = async (req, res) => {

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
        req.flash("error", "Flight not found");
        return res.redirect("/flights");
    }

    res.render("flights/show", { flight });
};

// Book Flight
module.exports.bookFlight = async (req, res) => {

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
        req.flash("error", "Flight not found");
        return res.redirect("/flights");
    }

    const booking = new FlightBooking({
        user: req.user._id,
        flight: flight._id,
        totalAmount: flight.price
    });
    if(flight.seatsAvailable <= 0){
    req.flash(
        "error",
        "Flight Sold Out"
    );

    return res.redirect(
        `/flights/${flight._id}`
    );
}

    await booking.save();flight.seatsAvailable -= 1;
await flight.save();

    req.flash("success", "Flight booked successfully!");

    res.redirect("/my-bookings");
};module.exports.myBookings =
async(req,res)=>{

    const bookings =
    await FlightBooking
    .find({
        user:req.user._id
    })
    .populate("flight");

    res.render(
        "flights/bookings",
        { bookings }
    );
};
module.exports.myBookings =
async(req,res)=>{

    const bookings =
    await FlightBooking
    .find({
        user:req.user._id
    })
    .populate("flight");

    res.render(
        "flights/bookings",
        { bookings }
    );
};
module.exports.cancelBooking =
async(req,res)=>{

    const { bookingId } =
    req.params;

    const booking =
    await FlightBooking
    .findById(bookingId);

    if(booking){

        const flight =
        await Flight.findById(
            booking.flight
        );

        if(flight){
            flight.seatsAvailable += 1;
            await flight.save();
        }

        const booking =
await FlightBooking.findById(bookingId);

booking.status = "Cancelled";

await booking.save();
    }

    req.flash(
        "success",
        "Booking Cancelled"
    );

    res.redirect(
        "/flights/my-bookings"
    );
};