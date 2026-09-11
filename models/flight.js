const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: true,
    unique: true
  },

  airline: {
    type: String,
    required: true
  },

  source: {
    type: String,
    required: true
  },

  destination: {
    type: String,
    required: true
  },

  departureTime: Date,
  arrivalTime: Date,

  price: {
    type: Number,
    required: true
  },

  seatsAvailable: {
    type: Number,
    default: 100
  }
});

module.exports = mongoose.model("Flight", flightSchema);