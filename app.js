if(process.env.NODE_ENV!="production"){
  require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const listings=require("./routes/listing.js");
const reviews=require("./routes/review.js");
const session=require("express-session");
// const MongoStore = require("connect-mongo");
const MongoStore = require("connect-mongo").default;
const flash=require("connect-flash");
const passport=require("passport");
// const LocalStrategy=require("passport-local");
const LocalStrategy = require("passport-local");
const User=require("./models/user.js");
const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL;
const secret = process.env.SECRET;
// main()
//   .then(() => {
//     console.log("connected to DB");
//   })
//   .catch((err) => {
//     console.log(err);
//   });
main()
  .then(() => {
    console.log("connected to DB");

    app.listen(8080, () => {
      console.log("server is listening to port 8080");
    });
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log(MongoStore);
const store=MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
    secret:secret,
  },
  touchAfter:24*3600,
});
store.on("error",()=>{
  console.log("error in mongo session store",err);
});
const sessionOptions={
  store,
  secret:secret,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now()+7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true,
  },

};


// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));


// passport.use(new LocalStrategy,( User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser=req.user;
    next();
});
app.get("/demouser",async(req,res)=>{
let fakeUser=new User({
email:"gnagwarakash555@gmail.com",
username:"Akash999",

});
let registeredUser=await User.register(fakeUser,"helloworld");
res.send(registeredUser);
});
// using routes

app.use("/listings",listings);
app.use("/listings/:id/reviews",reviews);
app.use("/",userRouter);

// 404 handler MUST BE LAST
app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

