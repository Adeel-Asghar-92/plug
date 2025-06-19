const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    // required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    // required: true
  },
  imageUrl: {
    type: String,
    // required: true
  },
  videoUrl: {
    type: String,
  },
  withVendor: [
    {
      imageUrl: {
        type: String,
        // required: true
      },
      sourceUrl: {
        type: String,
        // required: true
      },
    },
  ],
  seller: {
    type: String,
    // required: true
  },
  shopId: {
    type: String,
    // required: true
  },
  detailUrl: {
    type: String,
    // required: true
  },
  category: {
    type: String,
    // required: true
  },
  subcategory: {
    type: String,
    // required: true
  },
  secondSubcategory: { type: String },
  description: {
    type: String,
  },
  companyDetails: {
    type: String,
  },
  additional_properties: {
    type: Array,
  },
  colors: {
    type: Array,
  },
  sizes: {
    type: Array,
  },
  images: {
    type: Array,
  },
  favourites: [{
    email: {
      type: String,
      required: true
    }
  }],
  followers: [{
    email: {
      type: String,
      required: true
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  blockedUsers: [{
    email: {
      type: String,
      required: true
    },
  }],
  followersCount: {
    type: Number,
    default: 0
  },
  views: [{
    email: {
      type: String,
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
  }],
  viewsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  savedBy: {
    type: String,
    default: "admin",
  },
  content: {
    type: Object,
  },
  updatedContentAt: {
    type: Date,
  },
});

// Index for better performance
productSchema.index({ 'followers.email': 1 });
productSchema.index({ 'views.email': 1 });

module.exports = mongoose.model("Product", productSchema);
