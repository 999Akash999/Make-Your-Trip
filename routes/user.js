const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport=require("passport");
 const {saveRedirectUrl}=require ("../middleware.js");
 const usercontroller=require("../controllers/users.js");
router.get("/signup", usercontroller.renderSignup);



router.post(
  "/signup",
  wrapAsync(usercontroller.Signup)
);
router.get("/login", usercontroller.renderLogin);

router.post("/login",saveRedirectUrl, (req, res, next) => {
  console.log("LOGIN BODY:", req.body);   // 👈 HERE
  next();
}, passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: true,
}), usercontroller.Login);
router.get("/logout", usercontroller.Logout);
module.exports=router;
