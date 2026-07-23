

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// IMPORTANT FIX
const passportLocalMongoose =
    require("passport-local-mongoose").default || require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique:true,
    },googleId: {
        type: String,
        default: null,
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
