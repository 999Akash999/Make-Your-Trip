const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  init.Data.data=init.Data.data.map((obj)=>({...obj,owner:"6a24154f1aea142f090f5ec7",}));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

initDB();