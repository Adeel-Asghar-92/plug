const mongoose = require('mongoose');


const carouselSchema = new mongoose.Schema({
    Image: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
      },
    link:{
        type: String,
        required: true
    }
  });
  

  module.exports = mongoose.model('Carousel', carouselSchema);