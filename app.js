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
const Cab = require("./models/Cab.js");

// Routes
const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const flightRouter = require("./routes/flights.js");
const cabRoutes = require("./routes/cabs.js");
const cabBookingRoutes = require("./routes/cabBooking.js");

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

// Routes
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

app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);
app.use("/", userRouter);
app.use("/flights", flightRouter);
app.use("/cabs", cabRoutes);
app.use("/bookings/cabs", cabBookingRoutes);

// 404 Handler
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

// Database Connection and Server Startup
async function main() {
  mongoose.set("bufferCommands", false);
  await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: DB_TIMEOUT_MS,
    connectTimeoutMS: DB_TIMEOUT_MS,
  });
}

main()
  .then(async () => {
    console.log("connected to DB");
    // Seed cabs only after DB connection is ready
    await initCabData();

    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`server is listening to port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Database Connection Failed:", err);
  });