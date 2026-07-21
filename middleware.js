const Listing=require("./models/listing");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");

module.exports.isLoggedIn=(req,res,next)=>{
if(!req.isAuthenticated()){
  req.session.redirectUrl=req.method === "GET" ? req.originalUrl : req.get("Referer") || "/listings";
    req.flash("error","you must be logged in");
    return res.redirect("/login");
  }
next();}
module.exports.saveRedirectUrl=(req,res,next)=>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl=req.session.redirectUrl;
  }next();
};
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;

    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You don't have permission to edit");
        return res.redirect(`/listings/${id}`);
    }next();
};
module.exports.validateListing = (req,res,next)=>{
    let { error } = listingSchema.validate(req.body);

    if(error){
        throw new ExpressError(400, error.message);
    }

    next();
};

module.exports.validateReview = (req,res,next)=>{
    let { error } = reviewSchema.validate(req.body);

    if(error){
        throw new ExpressError(400, error.message);
    }

    next();
};
