const mongoose = require('mongoose');


const restrictionsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
      }
  });
  

  module.exports = mongoose.model('restrictions', restrictionsSchema);