const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const listingSchema=new Schema({
    title:String,
    description:String,
    image:String,
    price:Number,
    location:String,
    country:String,

});
const Listing=mongoose.model("Listing",listingSchema);