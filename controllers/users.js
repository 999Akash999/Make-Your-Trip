const User=require("../models/user.js");
 module.exports.renderSignup=(req, res) => {
    res.render("users/signup");
};const cloudinary = require("../cloudConfig");
const Listing = require("../models/listing");
const UPLOAD_TIMEOUT_MS = 120000;
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      reject(new ExpressError(500, "Image storage is not configured."));
      return;
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: "wanderlust_DEV", resource_type: "auto", timeout: UPLOAD_TIMEOUT_MS },
      (error, result) => {
        if (error) {
          if (error.name === "TimeoutError" || error.http_code === 499) {
            return reject(new ExpressError(
              503,
              "Image storage did not respond. Check that this server can reach api.cloudinary.com, then try again."
            ));
          }
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};
const FlightBooking =
require("../models/flightBooking");
module.exports.Signup=async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      const newUser = new User({
        username,
        email,
      });

      const registeredUser = await User.register(
        newUser,
        password
      );

      req.login(registeredUser, (err) => {
        if (err) return next(err);

        req.flash("success", "Welcome to Make Your Trip!");
        res.redirect("/listings");
      });

    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  };

  module.exports.renderLogin=(req, res) => {
    res.render("users/login.ejs");
};
module.exports.Login=async(req, res) => {
  req.flash("success", "Welcome back!");
  let redirectUrl=res.locals.redirectUrl||"/listings";
  res.redirect(redirectUrl);
};

module.exports.Logout=(req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
    });
};module.exports.profile =
async(req,res)=>{

    const user =
    await User.findById(
        req.user._id
    );

    const listingsCount =
    await Listing.countDocuments({
        owner:req.user._id
    });

    const bookings =
    await FlightBooking.find({
        user:req.user._id
    })
    .populate("flight")
    .sort({ bookingDate:-1 });

    const bookingsCount =
    bookings.length;

    const cancelledBookings =
    bookings.filter(
        b => b.status === "Cancelled"
    ).length;

    res.render(
        "users/profile",
        {
            user,
            listingsCount,
            bookingsCount,
            cancelledBookings,
            bookings
        }
    );
};
module.exports.renderEditProfile =
async(req,res)=>{

    const user =
    await User.findById(
        req.user._id
    );

    res.render(
        "users/editProfile",
        { user }
    );
};

module.exports.updateProfile =
async(req,res)=>{

    const { bio, phone, city } = req.body;

    const updateData = {
        bio,
        phone,
        city
    };

    if(req.file){

        const result =
        await uploadToCloudinary(
            req.file
        );

        updateData.image = {
            url: result.secure_url,
            filename: result.public_id
        };
    }

    await User.findByIdAndUpdate(
        req.user._id,
        updateData
    );

    req.flash(
        "success",
        "Profile Updated"
    );

    res.redirect("/profile");
};