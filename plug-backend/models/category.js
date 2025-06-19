const mongoose = require("mongoose");

// Schema for second-level subcategories
const secondSubcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Schema for subcategories, now including second-level subcategories
const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: null,
    },
    secondSubcategories: [secondSubcategorySchema],
  },
  { timestamps: true }
);

// Schema for categories, including subcategories
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    subcategories: [subcategorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
