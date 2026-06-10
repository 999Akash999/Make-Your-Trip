const express=require("express");
const router=express.Router();
const Listing = require("../models/listing.js");

const wrapAsync=require("../utils/wrapAsync.js");
const {isLoggedIn,isOwner,validateListing}=require("../middleware.js");
const listingcontroller=require("../controllers/listings.js");
const multer=require("multer");
const upload=multer({storage: multer.memoryStorage()});
//Index Route
router.get("/",wrapAsync(listingcontroller.index));

//New Route
router.get("/new", isLoggedIn,listingcontroller.renderNewForm);

//Show Route

router.get("/:id", wrapAsync(listingcontroller.showRoute));
//Create Route
router.post("/",isLoggedIn,upload.single("listing[image]"),validateListing, wrapAsync(listingcontroller.createRoute));

//Edit Route
router.get("/:id/edit", isLoggedIn,isOwner,wrapAsync(listingcontroller.editRoute));

//Update Route
router.put("/:id",isLoggedIn,isOwner, upload.single("listing[image]"),validateListing,wrapAsync(listingcontroller.updateRoute));


//Delete Route
router.delete(
    "/:id",
    isLoggedIn,
    isOwner,
    wrapAsync(listingcontroller.deleteRoute)
);
module.exports=router;
