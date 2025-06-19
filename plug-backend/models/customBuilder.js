const mongoose = require('mongoose');


const customBuilderSchema = new mongoose.Schema({
    Image: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
      },
  });
  

  module.exports = mongoose.model('CustomBuilder', customBuilderSchema);