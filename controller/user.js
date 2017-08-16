var mongoose = require("mongoose");
var db = require("../model/db.js");

var userSchema = new mongoose.Schema({
    content: String
});

var user = db.model("user",userSchema);

module.exports = user;
