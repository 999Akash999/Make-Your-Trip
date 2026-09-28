const express = require("express");
const router = express.Router();
const cabs = require("../controllers/cabs");
const { isLoggedIn } = require("../middleware");

router.route("/")
  .get(cabs.index)
  .post(isLoggedIn, cabs.createCab);

router.get("/new", isLoggedIn, cabs.renderNewForm);
router.get("/:id", cabs.showCab);

module.exports = router;
