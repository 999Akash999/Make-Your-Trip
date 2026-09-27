const Cab = require("../models/cab");

// 1. Index & Search Cabs
module.exports.index = async (req, res, next) => {
  try {
    const { city, vehicleType } = req.query;
    let filter = { isAvailable: true };

    if (city) {
      filter.operatingCity = { $regex: new RegExp(city.trim(), "i") };
    }
    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    const cabs = await Cab.find(filter).populate("owner", "username email");
    res.render("cabs/index", { cabs, searchCity: city || "" });
  } catch (err) {
    next(err);
  }
};

// 2. Render New Form
module.exports.renderNewForm = (req, res) => {
  res.render("cabs/new");
};

// 3. Create Cab
module.exports.createCab = async (req, res, next) => {
  try {
    const newCab = new Cab(req.body.cab);
    newCab.owner = req.user._id;

    if (req.file) {
      newCab.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await newCab.save();
    res.redirect(`/cabs/${newCab._id}`);
  } catch (err) {
    next(err);
  }
};

// 4. Show Single Cab Details
module.exports.showCab = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cab = await Cab.findById(id).populate("owner", "username email");

    if (!cab) {
      const err = new Error("Cab not found");
      err.statusCode = 404;
      return next(err);
    }

    res.render("cabs/show", { cab });
  } catch (err) {
    next(err);
  }
};