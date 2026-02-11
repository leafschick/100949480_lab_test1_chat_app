const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String, required: true, unique: true, trim: true, minlength: 6
    },

    forename: {
      type: String, required: true, trim: true
    },

    surname: {
      type: String, required: true, trim: true
    },

    pass: {
      type: String, required: true, minlength: 8
    },
    
    createon: {
      type: String,
      default: () => new Date().toLocaleString()
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
