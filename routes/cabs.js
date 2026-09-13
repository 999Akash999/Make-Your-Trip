const express = require("express");
const router = express.Router();
const cabs = require("../controllers/cabs");

router.route("/")
  .get(cabs.index)
  .post(cabs.createCab);

router.get("/new", cabs.renderNewForm);
router.get("/:id", cabs.showCab);

module.exports = router;