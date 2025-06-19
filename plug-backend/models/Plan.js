const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Plan title is required"],
    unique: true,
    trim: true,
  },
  monthlyPrice: {
    type: Number,
    required: [true, "Monthly price is required"],
    min: [0, "Monthly price cannot be negative"],
  },
  features: {
    type: [String],
    required: [true, "Features are required"],
    validate: {
      validator: (arr) => arr.length > 0,
      message: "At least one feature is required",
    },
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  geoListing: {
    type: mongoose.Schema.Types.Mixed, // Number or String (e.g., "Unlimited")
    required: [true, "Geo listing is required"],
    validate: {
      validator: (value) =>
        (typeof value === "number" && value >= 0) || value === "Unlimited",
      message: 'Geo listing must be a non-negative number or "Unlimited"',
    },
  },
  geoSearchSessions: {
    type: mongoose.Schema.Types.Mixed, // Number or String (e.g., "Unlimited")
    required: [true, "Geo search sessions are required"],
    validate: {
      validator: (value) =>
        (typeof value === "number" && value >= 0) || value === "Unlimited",
      message:
        'Geo search sessions must be a non-negative number or "Unlimited"',
    },
  },
  productValuation: {
    type: mongoose.Schema.Types.Mixed, // Number or String (e.g., "Unlimited")
    required: [true, "Product valuation is required"],
    validate: {
      validator: (value) =>
        (typeof value === "number" && value >= 0) || value === "Unlimited",
      message: 'Product valuation must be a non-negative number or "Unlimited"',
    },
  },
  isYearly: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` on save
planSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Plan", planSchema);
