const mongoose = require("mongoose");

const flightBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Flight"
  },

  passengers: [{
    name: String,
    age: Number
  }],

  totalAmount: Number,
  status:{
    type:String,
    enum:["Booked","Cancelled"],
    default:"Booked"
},

  bookingDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "FlightBooking",
  flightBookingSchema
);