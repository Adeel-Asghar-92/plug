const mongoose = require('mongoose');


const sessionSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
    unregisteredUserToken: {
        type: String,
        default: null,
    },
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    },
    status: { 
        type: String, 
        enum: ['active', 'ended'], 
        default: 'active' 
    },
    messages: [
      {
        sender: { type: String, enum: ['user', 'admin'] },
        message: String,
        timestamp: { type: Date, default: Date.now },
        isReadByAdmin: { 
            type: Boolean, 
            default: false 
        }, 
        isReadByUser: { 
            type: Boolean, 
            default: false 
        },
      },
    ],
    startedAt: { type: Date, default: Date.now },
  });
  

  module.exports = mongoose.model('session', sessionSchema);