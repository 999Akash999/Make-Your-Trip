if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const multer = require("multer");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Error Handling & Models
const ExpressError = require("./utils/ExpressError.js");
const User = require("./models/user.js");
const Flight = require("./models/flight.js");
const Cab = require("./models/cab.js");
const Bus = require("./models/bus.js"); 
const Bike = require("./models/bike.js");
const Train = require("./models/train.js");
// Routes
const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const flightRouter = require("./routes/flights.js");
const cabRoutes = require("./routes/cabs.js");
const cabBookingRoutes = require("./routes/cabBooking.js");
const busRouter = require("./routes/buses.js");
const bikeRoutes = require("./routes/bikes.js");

const trainRoutes = require("./routes/trains.js");
// Database configuration
const dbUrl = process.env.ATLASDB_URL;
const secret = process.env.SECRET;
const DB_TIMEOUT_MS = 10_000;

// App & View Configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session Store Configuration
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: secret,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.error("Mongo session store error:", err);
});

const sessionOptions = {
  store,
  secret: secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport Authentication Configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://make-your-trip-90sr.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          user = new User({
            email,
            username: email.split("@")[0],
            googleId: profile.id,
          });
          await user.save();
        } else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global Template Variables
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Demo Cabs Data
const demoCabs = [
  {
    vehicleName: "Toyota Innova Crysta",
    vehicleType: "SUV",
    registrationNumber: "DL-01-AB-1234",
    capacity: { passengers: 6, luggage: 4 },
    hasAC: true,
    fuelType: "Diesel",
    image: {
      url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
      filename: "cabs/innova",
    },
    driver: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      rating: 4.9,
      totalTrips: 340,
    },
    operatingCity: "Delhi",
    serviceTypes: ["One-Way", "Round-Trip", "Airport Transfer"],
    pricing: { baseFare: 800, pricePerKm: 18, extraHourCharge: 200 },
    isAvailable: true,
  },
  {
    vehicleName: "Maruti Suzuki Dzire",
    vehicleType: "Sedan",
    registrationNumber: "MH-02-CD-5678",
    capacity: { passengers: 4, luggage: 2 },
    hasAC: true,
    fuelType: "CNG",
    image: {
      url: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80",
      filename: "cabs/dzire",
    },
    driver: {
      name: "Amit Patil",
      phone: "+91 91234 56789",
      rating: 4.8,
      totalTrips: 215,
    },
    operatingCity: "Mumbai",
    serviceTypes: ["One-Way", "Round-Trip", "Airport Transfer", "Local Rental"],
    pricing: { baseFare: 500, pricePerKm: 13, extraHourCharge: 150 },
    isAvailable: true,
  },
  {
    vehicleName: "Hyundai i20 Asta",
    vehicleType: "Hatchback",
    registrationNumber: "KA-03-EF-9012",
    capacity: { passengers: 4, luggage: 2 },
    hasAC: true,
    fuelType: "Petrol",
    image: {
      url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
      filename: "cabs/i20",
    },
    driver: {
      name: "Suresh Reddy",
      phone: "+91 98450 11223",
      rating: 4.7,
      totalTrips: 180,
    },
    operatingCity: "Bangalore",
    serviceTypes: ["One-Way", "Airport Transfer"],
    pricing: { baseFare: 400, pricePerKm: 11, extraHourCharge: 120 },
    isAvailable: true,
  },
  {
    vehicleName: "Mercedes-Benz E-Class",
    vehicleType: "Luxury",
    registrationNumber: "DL-08-ZZ-9999",
    capacity: { passengers: 4, luggage: 3 },
    hasAC: true,
    fuelType: "Petrol",
    image: {
      url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
      filename: "cabs/mercedes",
    },
    driver: {
      name: "Vikram Malhotra",
      phone: "+91 99999 88888",
      rating: 5.0,
      totalTrips: 410,
    },
    operatingCity: "Delhi",
    serviceTypes: ["One-Way", "Round-Trip", "Airport Transfer", "Local Rental"],
    pricing: { baseFare: 2500, pricePerKm: 45, extraHourCharge: 500 },
    isAvailable: true,
  },
  {
    vehicleName: "Tata Nexon EV",
    vehicleType: "SUV",
    registrationNumber: "MH-12-EV-4422",
    capacity: { passengers: 4, luggage: 3 },
    hasAC: true,
    fuelType: "Electric",
    image: {
      url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
      filename: "cabs/nexon",
    },
    driver: {
      name: "Ganesh Shinde",
      phone: "+91 97654 32109",
      rating: 4.8,
      totalTrips: 195,
    },
    operatingCity: "Pune",
    serviceTypes: ["One-Way", "Airport Transfer"],
    pricing: { baseFare: 600, pricePerKm: 15, extraHourCharge: 180 },
    isAvailable: true,
  },
];

// Cab Seeder Function
async function initCabData() {
  try {
    const count = await Cab.countDocuments();
    if (count === 0) {
      let hostUser = await User.findOne();
      if (!hostUser) {
        hostUser = await User.create({
          username: "cab_host",
          email: "host@makeyourtrip.com",
        });
      }

      const cabsToInsert = demoCabs.map((cab) => ({
        ...cab,
        owner: hostUser._id,
      }));

      await Cab.insertMany(cabsToInsert);
      console.log("Demo Cabs successfully initialized in Database!");
    }
  } catch (err) {
    console.error("Error initializing cab data:", err.message);
  }
}

// Demo Buses Data
const sampleDemoBuses = [
  {
    busName: "Zingbus Maxx AC Sleeper",
    busNumber: "DL-01-EQ-9821",
    operatorName: "Zingbus Electric & Multi-Axle",
    operatorRating: 4.8,
    busType: "Sleeper",
    hasAC: true,
    sourceCity: "delhi",
    destinationCity: "manali",
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    arrivalTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
    durationHours: 12,
    boardingPoints: [
      { locationName: "Kashmere Gate Metro Gate 5", landmark: "Near ISBT", time: "20:00" },
      { locationName: "Majnu Ka Tilla", landmark: "Petrol Pump", time: "20:45" },
    ],
    droppingPoints: [
      { locationName: "Private Bus Parking Manali", landmark: "Near Mall Road", time: "08:00" },
    ],
    totalSeats: 36,
    bookedSeats: ["L1", "L2", "U5"],
    pricing: { seaterPrice: 1250, sleeperPrice: 1650, taxPercent: 5 },
    amenities: { wifi: true, chargingPoint: true, waterBottle: true, blanket: true, liveTracking: true, readingLight: true },
    image: { url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80", filename: "sample-bus-1" },
    isActive: true,
  },
  {
    busName: "IntrCity SmartBus Volvo Multi-Axle",
    busNumber: "KA-01-AK-4412",
    operatorName: "IntrCity Mobility",
    operatorRating: 4.9,
    busType: "Volvo Multi-Axle",
    hasAC: true,
    sourceCity: "bangalore",
    destinationCity: "goa",
    departureTime: new Date(Date.now() + 28 * 60 * 60 * 1000),
    arrivalTime: new Date(Date.now() + 40 * 60 * 60 * 1000),
    durationHours: 12,
    boardingPoints: [
      { locationName: "Majestic Anand Rao Circle", landmark: "Opposite SRS Travels", time: "21:30" },
      { locationName: "Yeshwantpur Govardhan", landmark: "Metro Gate 1", time: "22:15" },
    ],
    droppingPoints: [
      { locationName: "Panjim Kadamba Bus Stand", landmark: "Platform 3", time: "09:30" },
    ],
    totalSeats: 40,
    bookedSeats: ["U1", "U2", "L10"],
    pricing: { seaterPrice: 1400, sleeperPrice: 1950, taxPercent: 5 },
    amenities: { wifi: true, chargingPoint: true, waterBottle: true, blanket: true, liveTracking: true, readingLight: true },
    image: { url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80", filename: "sample-bus-2" },
    isActive: true,
  },
  {
    busName: "Shivneri AC Seater Express",
    busNumber: "MH-12-RN-7700",
    operatorName: "MSRTC Premium AC",
    operatorRating: 4.6,
    busType: "Seater",
    hasAC: true,
    sourceCity: "mumbai",
    destinationCity: "pune",
    departureTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    arrivalTime: new Date(Date.now() + 16 * 60 * 60 * 1000),
    durationHours: 4,
    boardingPoints: [
      { locationName: "Dadar Asiad Terminal", landmark: "TT Circle", time: "07:00" },
      { locationName: "Vashi Plaza", landmark: "Highway Exit", time: "07:45" },
    ],
    droppingPoints: [
      { locationName: "Pune Station Stand", landmark: "Platform 1", time: "11:00" },
    ],
    totalSeats: 45,
    bookedSeats: ["1", "2", "3", "15"],
    pricing: { seaterPrice: 520, sleeperPrice: 0, taxPercent: 5 },
    amenities: { wifi: false, chargingPoint: true, waterBottle: true, blanket: false, liveTracking: true, readingLight: true },
    image: { url: "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=1200&q=80", filename: "sample-bus-3" },
    isActive: true,
  }
];

// Bus Seeder Function
async function initBusData() {
  try {
    const count = await Bus.countDocuments();
    if (count === 0) {
      let hostUser = await User.findOne();
      if (!hostUser) {
        hostUser = await User.create({
          username: "bus_host",
          email: "bus_host@makeyourtrip.com",
        });
      }

      const busesToInsert = sampleDemoBuses.map((bus) => ({
        ...bus,
        owner: hostUser._id,
      }));

      await Bus.insertMany(busesToInsert);
      console.log("Demo Buses successfully initialized in Database!");
    }
  } catch (err) {
    console.error("Error initializing bus data:", err.message);
  }
}

// Primary Redirect & Quick Test Endpoints
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
    email: "gnagwarakash555@gmail.com",
    username: "Akash999",
  });
  let registeredUser = await User.register(fakeUser, "helloworld");
  res.send(registeredUser);
});

app.get("/seed", async (req, res) => {
  await Flight.deleteMany({});
  await Flight.insertMany([
    {
      flightNumber: "AI101",
      airline: "Air India",
      source: "Delhi",
      destination: "Mumbai",
      departureTime: new Date("2026-09-20T09:00:00"),
      arrivalTime: new Date("2026-09-20T11:15:00"),
      price: 5500,
      seatsAvailable: 45,
    },
    {
      flightNumber: "6E202",
      airline: "IndiGo",
      source: "Delhi",
      destination: "Bangalore",
      departureTime: new Date("2026-09-20T12:00:00"),
      arrivalTime: new Date("2026-09-20T14:30:00"),
      price: 4800,
      seatsAvailable: 70,
    },
    {
      flightNumber: "UK303",
      airline: "Vistara",
      source: "Mumbai",
      destination: "Goa",
      departureTime: new Date("2026-09-21T08:00:00"),
      arrivalTime: new Date("2026-09-21T09:10:00"),
      price: 3200,
      seatsAvailable: 30,
    },
  ]);
  res.send("Flights Seeded Successfully");
});

// Mounted Application Routes
app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);
app.use("/", userRouter);
app.use("/flights", flightRouter);
app.use("/cabs", cabRoutes);
app.use("/bookings/cabs", cabBookingRoutes);
app.use("/buses", busRouter);
app.use("/bikes", bikeRoutes);
app.use("/trains", trainRoutes);
// 404 Handler

const sampleDemoBikes = [
  {
    bikeName: "Royal Enfield Classic 350 Reborn",
    bikeModelYear: 2024,
    registrationNumber: "GA-03-AB-4001",
    bikeType: "Cruiser",
    engineCC: 349,
    operatingCity: "goa",
    pickupLocations: [
      { hubName: "Airport Hub Dabolim", address: "Opposite Terminal 1" },
      { hubName: "Calangute Beach Road", address: "Near Tito's Lane" },
    ],
    pricing: { dailyRent: 950, hourlyRent: 110, securityDeposit: 1500, freeKmPerDay: 150 },
    features: { helmetIncluded: true, extraHelmetAvailable: true, fuelType: "Petrol" },
    image: { url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80", filename: "bike-1" },
    isAvailable: true,
  },
  {
    bikeName: "Honda Activa 6G Premium",
    bikeModelYear: 2024,
    registrationNumber: "KA-05-MK-9821",
    bikeType: "Scooter",
    engineCC: 110,
    operatingCity: "bangalore",
    pickupLocations: [
      { hubName: "Koramangala 5th Block", address: "Near Sony Signal" },
      { hubName: "Indiranagar 100ft Road", address: "Metro Pillar 42" },
    ],
    pricing: { dailyRent: 450, hourlyRent: 50, securityDeposit: 1000, freeKmPerDay: 100 },
    features: { helmetIncluded: true, extraHelmetAvailable: true, fuelType: "Petrol" },
    image: { url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80", filename: "bike-2" },
    isAvailable: true,
  },
  {
    bikeName: "Royal Enfield Himalayan 450",
    bikeModelYear: 2024,
    registrationNumber: "HP-01-TR-3312",
    bikeType: "Adventure",
    engineCC: 452,
    operatingCity: "manali",
    pickupLocations: [
      { hubName: "Mall Road Manali", address: "Near Bus Terminal" },
    ],
    pricing: { dailyRent: 1600, hourlyRent: 180, securityDeposit: 3000, freeKmPerDay: 200 },
    features: { helmetIncluded: true, extraHelmetAvailable: true, fuelType: "Petrol" },
    image: { url: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=800&q=80", filename: "bike-3" },
    isAvailable: true,
  },
];

async function initBikeData() {
  try {
    const count = await Bike.countDocuments();
    if (count === 0) {
      let hostUser = await User.findOne();
      if (!hostUser) {
        hostUser = await User.create({ username: "bike_host", email: "bikes@makeyourtrip.com" });
      }
      const bikesToInsert = sampleDemoBikes.map((bike) => ({ ...bike, owner: hostUser._id }));
      await Bike.insertMany(bikesToInsert);
      console.log("Demo Bikes initialized in Database!");
    }
  } catch (err) {
    console.error("Error seeding bikes:", err.message);
  }
}
const sampleDemoTrains = [
  {
    trainNumber: "22436",
    trainName: "Vande Bharat Express",
    trainType: "Vande Bharat",
    runsOnDays: ["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
    sourceStation: { code: "NDLS", name: "New Delhi", departureTime: "06:00" },
    destinationStation: { code: "BSB", name: "Varanasi Jn", arrivalTime: "14:00" },
    durationHours: 8,
    classes: [
      { className: "CC", fare: 1750, availableSeats: 54 },
      { className: "EC", fare: 3300, availableSeats: 18 },
    ],
    isActive: true,
  },
  {
    trainNumber: "12952",
    trainName: "Mumbai Rajdhani Express",
    trainType: "Rajdhani",
    runsOnDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    sourceStation: { code: "NDLS", name: "New Delhi", departureTime: "16:55" },
    destinationStation: { code: "MMCT", name: "Mumbai Central", arrivalTime: "08:35" },
    durationHours: 15.5,
    classes: [
      { className: "3A", fare: 2420, availableSeats: 42 },
      { className: "2A", fare: 3450, availableSeats: 26 },
      { className: "1A", fare: 5200, availableSeats: 12 },
    ],
    isActive: true,
  },
  {
    trainNumber: "12626",
    trainName: "Kerala Superfast Express",
    trainType: "Superfast",
    runsOnDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    sourceStation: { code: "NDLS", name: "New Delhi", departureTime: "20:10" },
    destinationStation: { code: "SBC", name: "KSR Bengaluru", arrivalTime: "04:30" },
    durationHours: 32,
    classes: [
      { className: "SL", fare: 810, availableSeats: 85 },
      { className: "3A", fare: 2130, availableSeats: 30 },
      { className: "2A", fare: 3120, availableSeats: 14 },
    ],
    isActive: true,
  }
];

async function initTrainData() {
  try {
    const count = await Train.countDocuments();
    if (count === 0) {
      await Train.insertMany(sampleDemoTrains);
      console.log("Demo Trains seeded successfully into Database!");
    }
  } catch (err) {
    console.error("Error seeding trains:", err.message);
  }
}
// Database Connection and Server Startup
async function main() {
  mongoose.set("bufferCommands", false);
  await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: DB_TIMEOUT_MS,
    connectTimeoutMS: DB_TIMEOUT_MS,
  });
}
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    err = new ExpressError(400, "Image must be 10 MB or smaller.");
  }
  console.error(`${req.method} ${req.originalUrl} failed:`, {
    name: err.name,
    message: err.message,
    code: err.code,
    httpCode: err.http_code,
  });

  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { statusCode, message });
});
main()
  .then(async () => {
    console.log("connected to DB");

    // Both seeders execute strictly AFTER the database connection is established
    await initCabData();
    await initBusData();
await initBikeData();
await initTrainData();
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`server is listening to port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Database Connection Failed:", err);
  });