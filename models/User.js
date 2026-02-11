const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(

    {
    username: {
      type: String, required: true, unique: true, trim: true, minlength: 6
    },

    // User's first name

    forename: {
      type: String, required: true, trim: true
    },

    // User's last name

    surname: {
      type: String, required: true, trim: true
    },

    // User's password

    pass: {
      type: String, required: true, trim: true, minlength: 8
    },
    
    // Account creation timestamp

    createon: {
      type: String,
      default: () => new Date().toLocaleString()
    },

    // User's preferred sport 
    sport: { 
        type: String, required: true, trim: true

     }
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
