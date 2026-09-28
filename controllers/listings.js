const Listing=require("../models/listing");
const ExpressError = require("../utils/ExpressError.js");
const cloudinary = require("../cloudConfig.js");
const Cab = require("../models/cab");
const Bike = require("../models/bike");
const Bus = require("../models/bus");
const Train = require("../models/train");
const UPLOAD_TIMEOUT_MS = 120_000;

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

module.exports.index=async (req, res) => {
  const { q } = req.query;
  const filter = q?.trim() ? {
    $or: [
      { title: { $regex: q.trim(), $options: "i" } },
      { location: { $regex: q.trim(), $options: "i" } },
      { country: { $regex: q.trim(), $options: "i" } },
    ],
  } : {};
  const [allListings, cabs, bikes, buses, trains] = await Promise.all([
    Listing.find(filter),
    Cab.find({ isAvailable: true }).limit(4),
    Bike.find({ isAvailable: true }).limit(4),
    Bus.find({ isActive: true }).sort({ departureTime: 1 }).limit(4),
    Train.find({ isActive: true }).limit(4),
  ]);
  res.render("listings/index.ejs", { allListings, cabs, bikes, buses, trains });
};

module.exports.rooms = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/rooms", { allListings });
};
module.exports.renderNewForm=(req, res) => {
  
  res.render("listings/new.ejs");
};

module.exports.showRoute=async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        });

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    res.render("listings/show.ejs", { listing });
};
module.exports.createRoute=async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      newListing.image = {
        url: result.secure_url,
        filename: result.public_id,
      };
     
    }
    newListing.owner=req.user._id;
     let savedListing = await newListing.save();
     console.log(savedListing);
    req.flash("success","new listing is created");
    res.redirect("/listings");
};
module.exports.editRoute=async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }
  res.render("listings/edit.ejs", { listing });
};
module.exports.updateRoute=async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  if (req.file) {
    const result = await uploadToCloudinary(req.file);
    listing.image = {
        url: result.secure_url,
        filename: result.public_id,
    };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};
module.exports.deleteRoute=async (req, res) => {
        let { id } = req.params;
        let deletedListing = await Listing.findByIdAndDelete(id);
        console.log(deletedListing);

        req.flash("success", "Listing Deleted!");
        res.redirect("/listings");
    };
