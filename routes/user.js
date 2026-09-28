const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware");
const userController = require("../controllers/users");
const listingController = require("../controllers/listings");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/", (req, res) => res.redirect("/listings"));
router.get("/rooms", wrapAsync(listingController.rooms));
router.get("/signup", userController.renderSignup);
router.post("/signup", wrapAsync(userController.Signup));
router.get("/login", userController.renderLogin);
router.post("/login", saveRedirectUrl, passport.authenticate("local", {
  failureRedirect: "/login", failureFlash: true,
}), userController.Login);
router.get("/logout", userController.Logout);
router.get("/profile", isLoggedIn, userController.profile);
router.get("/profile/edit", isLoggedIn, wrapAsync(userController.renderEditProfile));
router.put("/profile", isLoggedIn, upload.single("image"), wrapAsync(userController.updateProfile));
router.get("/bookings", isLoggedIn, wrapAsync(userController.bookings));
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", {
  failureRedirect: "/login", failureFlash: true,
}), (req, res) => {
  req.flash("success", "Welcome back!");
  res.redirect("/listings");
});
router.get("/terms", (req, res) => res.render("legal", { title: "Terms & Conditions" }));
router.get("/privacy", (req, res) => res.render("legal", { title: "Privacy Policy" }));

module.exports = router;
