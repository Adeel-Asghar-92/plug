const seedrandom = require("seedrandom");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Product = require("../models/product");
const Category = require("../models/category");
const Carousel = require("../models/carousel");
const CustomBuilder = require("../models/customBuilder");
const Restrictions = require("../models/restrictions");
const TokenPlan = require("../models/tokenPlans");
const fs = require("fs");
const multer = require("multer");
const nodemailer = require("nodemailer");
const Plan = require("../models/Plan");
const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads/",
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware to check if user is admin

const isAdmin = async (req, res, next) => {
  const { email } = req.query;

  if (email === process.env.ADMIN_EMAIL) {
    // Replace with your admin email check
    next();
  } else {
    return res.status(403).json({ message: "Unauthorized access" });
  }
};

// Token Routes

router.post("/admin/addTokenPlan", isAdmin, async (req, res) => {
  try {
    const { name, price, tokens } = req.body;

    // Basic validation
    if (!name || !price || !tokens) {
      return res.status(400).json({
        success: false,
        message: "Name, price and tokens are required",
      });
    }

    // Create a new token plan
    const newTokenPlan = new TokenPlan({ name, price, tokens });
    await newTokenPlan.save();

    return res.json({
      success: true,
      message: "Token plan added successfully",
      tokenPlan: newTokenPlan,
    });
  } catch (error) {
    console.error("Error adding token plan:", error);
    return res.status(500).json({
      success: false,
      message: "Error adding token plan",
      error: error.message,
    });
  }
});

router.get("/admin/token-plans", isAdmin, async (req, res) => {
  try {
    const tokenPlans = await TokenPlan.find().sort({ name: 1 });
    res.json({ tokenPlans });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching token plans", error: error.message });
  }
});

router.put("/admin/token-plans/:tokenPlanId", isAdmin, async (req, res) => {
  try {
    const { tokenPlanId } = req.params;
    const { name, price, tokens } = req.body;
    const tokenPlan = await TokenPlan.findById(tokenPlanId);
    if (!tokenPlan) {
      return res.status(404).json({ message: "Token plan not found" });
    }
    tokenPlan.name = name;
    tokenPlan.price = price;
    tokenPlan.tokens = tokens;
    await tokenPlan.save();
    res
      .status(200)
      .json({ message: "Token plan updated successfully", tokenPlan });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching token plan", error: error.message });
  }
});

router.delete("/admin/token-plans/:tokenPlanId", isAdmin, async (req, res) => {
  try {
    const { tokenPlanId } = req.params;
    const tokenPlan = await TokenPlan.findById(tokenPlanId);
    if (!tokenPlan) {
      return res.status(404).json({ message: "Token plan not found" });
    }
    await tokenPlan.deleteOne();
    res.json({ message: "Token plan deleted successfully", tokenPlan });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting token plan", error: error.message });
  }
});

// Get all users
router.get("/admin/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("fullName email subscription lastLogin visitCount isBlocked photoURL")
      .sort({ lastLogin: -1 });
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// Get dashboard stats
// GET /admin/stats
router.get("/admin/stats", isAdmin, async (req, res) => {
  try {
    // Handle legacy string subscriptions by migrating them
    const usersWithStringSubscription = await User.find({
      subscription: { $type: "string" },
    });
    for (const user of usersWithStringSubscription) {
      let planId = null;
      if (user.subscription?.toLowerCase() !== "free") {
        const plan = await Plan.findOne({
          title: { $regex: new RegExp(`^${user.subscription}$`, "i") },
        });
        if (plan) {
          planId = plan._id;
        }
      }
      user.subscription = planId;
      user.subscriptionDetails = {
        ...user.subscriptionDetails,
        plan: planId,
        geoListing: planId ? (await Plan.findById(planId))?.geoListing : 5,
        geoSearchTokens: planId
          ? (await Plan.findById(planId))?.geoSearchSessions
          : 0,
      };
      await user.save();
      console.log(`Updated legacy subscription for user: ${user.email}`);
    }

    // Fetch non-free plans
    const nonFreePlans = await Plan.find({
      $or: [{ monthlyPrice: { $gt: 0 } }, { title: { $ne: "Free" } }],
    }).select("_id");

    const nonFreePlanIds = nonFreePlans.map((plan) => plan._id);

    // Fetch stats
    const [totalUsers, premiumUsers, recentLogins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        subscription: { $in: nonFreePlanIds },
      }),
      User.find()
        .sort({ lastLogin: -1 })
        .limit(10)
        .select("fullName email lastLogin"),
    ]);

    res.json({
      totalUsers,
      premiumUsers,
      recentLogins,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res
      .status(500)
      .json({ message: "Error fetching stats", error: error.message });
  }
});

// Save products route (modify the existing route)
// Update the products fetch route

function seededShuffle(array, seed) {
  const rng = seedrandom(seed);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

router.get("/products", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      category,
      subcategory,
      secondSubcategory, // Added secondSubcategory
      search,
      minPrice,
      maxPrice,
      email,
    } = req.query;

    const seed = req.query.seed || Date.now().toString(); // Generate if not passed

    const query = {};

    // Category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // Subcategory filter
    if (subcategory && subcategory !== "All") {
      query.subcategory = subcategory;
    }

    // Second Subcategory filter
    if (secondSubcategory && secondSubcategory !== "All") {
      query.secondSubcategory = secondSubcategory; // Adjust field name based on Product schema
    }

    // Search filter
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};

      if (minPrice) {
        query.price.$gte = parseFloat(minPrice);
      }

      if (maxPrice) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }
    if (email) {
      query['blockedUsers.email'] = { $ne: email };
    }
    // Debug log to check the query
    // console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    let select = "";
    try {
      const token = req.cookies.user;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (
        (!user ||
          user.subscription === "free" ||
          user.subscriptionDetails.status !== "active") &&
        user.email !== process.env.ADMIN_EMAIL
      ) {
        select = "-detailUrl";
      }
    } catch (error) {
      select = "-detailUrl";
    }

    const products = await Product.find(query)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const shuffledProducts = seededShuffle(products, seed);

    const count = await Product.countDocuments(query);

    const isFollowedPromises = shuffledProducts.map(async (product) => {
      const isFollowed = await product.followers.find((follower) => follower.email === email);
      return { ...product.toObject(), isFollowed: isFollowed ? true : false };
    });

    const productsWithIsFollowed = await Promise.all(isFollowedPromises);

    res.json({
      products: productsWithIsFollowed,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalProducts: count,
      seed,
    });
  } catch (error) {
    console.error("Error in /products route:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});

router.get("/products-count", async (req, res) => {
  try {
    try {
      const token = req.cookies.user;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {}

    const products = await Product.find();

    const count = await Product.countDocuments();

    res.json({
      products,

      totalProducts: count,
    });
  } catch (error) {
    console.error("Error in /products route:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});

// Get single product by ID
router.get("/products/:productId", async (req, res) => {
  try {
    const product = await Product.findOne({
      productId: req.params.productId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
});

// In your routes file

router.post("/user/saved-products/bulk", async (req, res) => {
  try {
    const { productIds, email } = req.body;

    // Validate input
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        message: "Invalid product IDs",
        success: false,
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Get existing saved products
    const existingSavedProductIds = new Set(
      user.savedProducts.map((p) => p.toString())
    );

    // Filter out duplicates
    const uniqueNewProductIds = productIds.filter(
      (id) => !existingSavedProductIds.has(id.toString())
    );

    if (uniqueNewProductIds.length === 0) {
      return res.json({
        message: "No new products to save",
        success: true,
        savedCount: 0,
      });
    }

    // Find all valid products from the unique IDs
    const validProducts = await Product.find({
      productId: { $in: uniqueNewProductIds },
    });

    if (validProducts.length === 0) {
      if (!req?.body?.products?.length > 0) {
        return res.status(404).json({
          message: "No valid products found to save",
          success: false,
        });
      } else {
        const newProducts = req.body.products.map((product) => ({
          ...product,
          savedBy: "user",
        }));
        try {
          const savedProducts = await Product.create(newProducts);
          await User.findOneAndUpdate(
            { email },
            {
              $addToSet: {
                savedProducts: {
                  $each: savedProducts.map((p) => p._id),
                },
              },
            }
          );
        } catch (error) {
          console.error("Error saving multiple products:", error);
          res.status(500).json({
            message: "Error saving products",
            error: error.message,
            success: false,
          });
        }
      }
    }

    // Add only the valid products to saved products
    await User.findOneAndUpdate(
      { email },
      {
        $addToSet: {
          savedProducts: {
            $each: validProducts.map((p) => p._id),
          },
        },
      }
    );

    res.json({
      message: "Products saved successfully",
      success: true,
      savedCount: validProducts.length,
      totalCount: productIds.length,
      duplicateCount: productIds.length - validProducts.length,
    });
  } catch (error) {
    console.error("Error saving multiple products:", error);
    res.status(500).json({
      message: "Error saving products",
      error: error.message,
      success: false,
    });
  }
});

// Save products route (modify the existing route)
router.post("/admin/save-products", async (req, res) => {
  try {
    const { email, products } = req.body;
    console.log(products);
    // Check if admin
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid products data" });
    }

    // Transform products to include imageUrl and detailUrl as the first object in withVendor array
    const transformedProducts = products.map((product) => {
      const { imageUrl, detailUrl, withVendor = [] } = product;

      // Create the first vendor object
      const firstVendor = {
        imageUrl: imageUrl,
        sourceUrl: detailUrl,
      };

      // Add the first vendor object to the beginning of the withVendor array
      const updatedWithVendor = [firstVendor, ...withVendor];

      return {
        ...product,
        withVendor: updatedWithVendor,
        updatedAt: new Date(),
      };
    });

    // Bulk operation for saving products
    const operations = transformedProducts.map((product) => ({
      updateOne: {
        filter: { productId: product.productId },
        update: { $set: product },
        upsert: true,
      },
    }));

    const result = await Product.bulkWrite(operations);

    res.status(200).json({
      message: "Products saved successfully",
      count: transformedProducts.length,
      result,
    });
  } catch (error) {
    console.error("Error saving products:", error);
    res.status(500).json({
      message: "Error saving products",
      error: error.message,
    });
  }
});

// Update the delete route to actually delete from database instead of just setting isActive
router.delete("/admin/products/:productId", isAdmin, async (req, res) => {
  try {
    const result = await Product.findOneAndDelete({
      productId: req.params.productId,
    });

    if (!result) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product deleted successfully",
      deletedProduct: result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
});

// Update product route
router.put("/admin/products/:productId", isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;
    const updateCompanyDetails = req.body.updateCompanyDetails || "no";

    // Step 1: Find the product first
    const existingProduct = await Product.findOne({ productId });
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Step 2: Build update object
    let upData = {
      title: updateData.title,
      price: updateData.price,
      imageUrl: updateData.imageUrl,
      videoUrl: updateData.videoUrl,
      seller: updateData.seller,
      updatedAt: new Date(),
    };

    // Step 3: Generate companyDetails with OpenAI if requested
    if (updateCompanyDetails === "yes") {
      const prompt = `
Write a concise overview of the company, including its core product or service. List at least 5 major awards, accolades, or notable celebrities who use the brand. Then provide 5 compelling reasons why customers should choose this brand, followed by one key feature that users are likely to value most in the next 3 years. Conclude with 4 product-specific details: year built, technology used (if applicable), location of origin, and one standout feature—tailored to the product category (e.g., yachts, jets, real estate, watches, cars).
Title: ${existingProduct.title}
Price: ${existingProduct.price ? `$${existingProduct.price}` : "Not provided"}
Category: ${existingProduct.category || "N/A"}
Subcategory: ${existingProduct.subcategory || "N/A"}
Second Subcategory: ${existingProduct.secondSubcategory || "N/A"}
Description: ${existingProduct.description || "No description available"}
Available Colors: ${existingProduct.colors?.join(", ") || "N/A"}
Available Sizes: ${existingProduct.sizes?.join(", ") || "N/A"}
Write this in a formal tone, using persuasive language suitable for marketing or investment evaluation.
      `.trim();

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content: "You are a professional business analyst.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 800,
        });

        upData.companyDetails = response.choices[0].message.content || "";
      } catch (error) {
        console.error("OpenAI error:", error?.response?.data || error.message);
      }
    }

    // Step 4: Update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      { $set: upData },
      { new: true }
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
});

// Add upload image route
router.post(
  "/admin/upload-image",
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No image file uploaded" });
      }

      // Create the public URL for the uploaded image
      const imageUrl = `${process.env.PROTOCOL}://${process.env.IP}:${process.env.PORT}/uploads/${req.file.filename}`;

      res.json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading image",
        error: error.message,
      });
    }
  }
);

// Get all categories
router.get("/admin/categories", async (req, res) => {
  const email = req.query.email || null; // Assuming email comes as query param

  try {
    const allCategories = await Category.find().lean().sort({ name: 1 }); // Use .lean() for better performance

    // Filter logic
    const filteredCategories = allCategories.map((category) => {
      const filteredSubcategories = category.subcategories
        .filter(
          (sub) =>
            (!email && !sub.email) || (email && (!sub.email || sub.email === email))
        )
        .map((sub) => {
          const filteredSecondSubs = sub.secondSubcategories?.filter(
            (second) =>
              (!email && !second.email) ||
              (email && (!second.email || second.email === email))
          );

          return {
            ...sub,
            secondSubcategories: filteredSecondSubs,
          };
        });

      return {
        ...category,
        subcategories: filteredSubcategories,
      };
    });

    res.json({ categories: filteredCategories });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// Add new category
router.post("/admin/categories", isAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({
      name,
      subcategories: [],
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
});

// Add subcategory to existing category
router.post(
  "/admin/categories/:categoryId/subcategories",
  // isAdmin,
  async (req, res) => {
    try {
      const { subcategoryName, email } = req.body;
      const { categoryId } = req.params;

      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check if subcategory already exists
      const subcategoryExists = category.subcategories.some(
        (sub) =>
          sub.name.toLowerCase() === subcategoryName.toLowerCase() &&
          (email === null ? sub.email === null : sub.email === email)
      );

      if (subcategoryExists) {
        return res.status(400).json({ message: "Subcategory already exists" });
      }

      category.subcategories.push({ name: subcategoryName, email });
      await category.save();

      res.status(201).json(category);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error adding subcategory", error: error.message });
    }
  }
);

// Delete category
router.delete("/admin/categories/:categoryId", isAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting category", error: error.message });
  }
});

router.delete(
  "/admin/categories/:categoryId/subcategories/:subcategoryId",
  isAdmin,
  async (req, res) => {
    try {
      const { categoryId, subcategoryId } = req.params;

      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Find the subcategory index
      const subcategoryIndex = category.subcategories.findIndex(
        (sub) => sub._id.toString() === subcategoryId
      );

      if (subcategoryIndex === -1) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      // Remove the subcategory
      category.subcategories.splice(subcategoryIndex, 1);
      await category.save();

      return res.json({
        message: "Subcategory deleted successfully",
        category,
      });
    } catch (error) {
      console.error("Error removing subcategory:", error);
      return res
        .status(500)
        .json({ message: "Error removing subcategory", error: error.message });
    }
  }
);

// Add second-level subcategory to existing subcategory
router.post(
  "/admin/categories/:categoryId/subcategories/:subcategoryId/second-subcategories",
  // isAdmin,
  async (req, res) => {
    try {
      const { secondSubcategoryName, email } = req.body;
      const { categoryId, subcategoryId } = req.params;

      // Find the category
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Find the subcategory
      const subcategory = category.subcategories.id(subcategoryId);
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      // Check if second-level subcategory already exists
      const secondSubcategoryExists = subcategory.secondSubcategories.some(
        (sub) => sub.name.toLowerCase() === secondSubcategoryName.toLowerCase() &&
          (email === null ? sub.email === null : sub.email === email)
      );

      if (secondSubcategoryExists) {
        return res
          .status(400)
          .json({ message: "Second-level subcategory already exists" });
      }

      // Add the second-level subcategory
      subcategory.secondSubcategories.push({ name: secondSubcategoryName, email });
      await category.save();

      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({
        message: "Error adding second-level subcategory",
        error: error.message,
      });
    }
  }
);

// Delete second-level subcategory
router.delete(
  "/admin/categories/:categoryId/subcategories/:subcategoryId/second-subcategories/:secondSubcategoryId",
  isAdmin,
  async (req, res) => {
    try {
      const { categoryId, subcategoryId, secondSubcategoryId } = req.params;

      // Find the category
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Find the subcategory
      const subcategory = category.subcategories.id(subcategoryId);
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      // Find the second-level subcategory index
      const secondSubcategoryIndex = subcategory.secondSubcategories.findIndex(
        (sub) => sub._id.toString() === secondSubcategoryId
      );

      if (secondSubcategoryIndex === -1) {
        return res
          .status(404)
          .json({ message: "Second-level subcategory not found" });
      }

      // Remove the second-level subcategory
      subcategory.secondSubcategories.splice(secondSubcategoryIndex, 1);
      await category.save();

      return res.json({
        message: "Second-level subcategory deleted successfully",
        category,
      });
    } catch (error) {
      console.error("Error removing second-level subcategory:", error);
      return res.status(500).json({
        message: "Error removing second-level subcategory",
        error: error.message,
      });
    }
  }
);

// Update second-level subcategory
router.post("/admin/changesecondsubcategory", isAdmin, async (req, res) => {
  try {
    const { prev, neww, categoryId, subcategoryId, email } = req.body;

    // Find the category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Find the subcategory
    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Find the second-level subcategory
    const secondSubcategory = subcategory.secondSubcategories.find(
      (sub) => sub.name === prev
    );

    if (!secondSubcategory) {
      return res
        .status(404)
        .json({ message: "Second-level subcategory not found" });
    }

    // Check if the new name already exists
    const nameExists = subcategory.secondSubcategories.some(
      (sub) =>
        sub.name.toLowerCase() === neww.toLowerCase() && sub.name !== prev
    );

    if (nameExists) {
      return res
        .status(400)
        .json({ message: "Second-level subcategory name already exists" });
    }

    // Update the second-level subcategory name
    secondSubcategory.name = neww;
    await category.save();

    res.json({
      message: "Second-level subcategory updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating second-level subcategory:", error);
    res.status(500).json({
      message: "Error updating second-level subcategory",
      error: error.message,
    });
  }
});

// Bulk Delete Products
router.post("/admin/products/bulk-delete", isAdmin, async (req, res) => {
  try {
    const { productIds } = req.body;

    // Input validation
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products selected for deletion.",
      });
    }

    // First verify all products exist
    const existingProducts = await Product.find({
      productId: { $in: productIds },
    });

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "None of the selected products were found.",
      });
    }

    // Perform the deletion
    const result = await Product.deleteMany({
      productId: { $in: productIds },
    });

    // Return detailed response
    return res.json({
      success: true,
      message: "Products deleted successfully.",
      deletedCount: result.deletedCount,
      totalRequested: productIds.length,
      notFound: productIds.length - result.deletedCount,
    });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting products.",
      error: error.message,
    });
  }
});

// Delete user route
router.delete("/admin/users/:userId", isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "User deleted successfully",
      user: {
        id: deletedUser._id,
        email: deletedUser.email,
        fullName: deletedUser.fullName,
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

router.post("/admin/changecategory", async (req, res) => {
  const { prev, neww, email } = req.body;
  if (!prev || !neww || !email || email !== process.env.ADMIN_EMAIL) {
    return res.status(400).json({ message: "Unauthorized access" });
  }
  try {
    const Category = await Category.findOne({ name: prev });
    if (!Category) {
      return res.status(404).json({ message: "Previous category not found" });
    }
    Category.name = neww;
    await Category.save();
    const products = await Product.find({ category: prev });
    for (const product of products) {
      product.category = neww;
      await product.save();
    }
    return res.json({ message: "Category changed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error changing category", error: error.message });
  }
});

router.post("/admin/changesubcategory", async (req, res) => {
  const { prev, neww, email } = req.body;

  if (!prev || !neww || !email || email !== process.env.ADMIN_EMAIL) {
    return res.status(400).json({ message: "Unauthorized access" });
  }

  try {
    const category = await Category.findOne({
      "subcategories.name": prev,
    });

    if (!category) {
      return res
        .status(404)
        .json({ message: "Previous subcategory not found" });
    }

    const subcategory = category.subcategories.find((sub) => sub.name === prev);
    if (subcategory) {
      subcategory.name = neww;
    }

    await category.save();
    const products = await Product.find({ subcategory: prev });
    for (const product of products) {
      product.subcategory = neww;
      await product.save();
    }

    return res.json({ message: "Subcategory changed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error changing subcategory", error: error.message });
  }
});

// Get all carousels
router.get("/admin/carousels", async (req, res) => {
  try {
    const carousels = await Carousel.find().sort({ order: 1 });
    return res.json({ success: true, carousels });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching carousels",
      error: error.message,
    });
  }
});

// Add new carousel
router.post(
  "/admin/carousels",
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file || !req.body.link) {
        return res.status(400).json({
          success: false,
          message: "Please provide both image and link",
        });
      }
      const path = `${process.env.PROTOCOL}://${process.env.IP}/uploads/${req.file.filename}`;
      const newCarousel = new Carousel({ Image: path, link: req.body.link });
      await newCarousel.save();

      return res.json({
        success: true,
        message: "Carousel added successfully",
        carousel: newCarousel,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error adding carousel",
        error: error.message,
      });
    }
  }
);

// Update carousel
router.put(
  "/admin/carousels/:carouselId",
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { carouselId } = req.params;
      const targetCarousel = await Carousel.findById(carouselId);

      if (!targetCarousel) {
        return res
          .status(404)
          .json({ success: false, message: "Carousel not found" });
      }
      const updateData = {};
      if (req.file) {
        const filename = targetCarousel.Image.split("/").pop();
        try {
          await fs.promises.unlink(`./uploads/${filename}`);
        } catch (error) {}
        updateData.Image = `${process.env.PROTOCOL}://${process.env.IP}/uploads/${req.file.filename}`;
      }

      const updatedCarousel = await Carousel.findByIdAndUpdate(
        carouselId,
        updateData,
        { new: true }
      );

      if (!updatedCarousel) {
        return res
          .status(404)
          .json({ success: false, message: "Carousel not found" });
      }

      return res.json({
        success: true,
        message: "Carousel updated successfully",
        carousel: updatedCarousel,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Error updating carousel",
        error: error.message,
      });
    }
  }
);

// Delete carousel
router.delete("/admin/carousels/:carouselId", isAdmin, async (req, res) => {
  try {
    const { carouselId } = req.params;
    const deletedCarousel = await Carousel.findByIdAndDelete(carouselId);

    if (!deletedCarousel) {
      return res
        .status(404)
        .json({ success: false, message: "Carousel not found" });
    }

    // Delete the associated image file
    const filename = deletedCarousel.Image.split("/").pop();
    try {
      await fs.promises.unlink(`./uploads/${filename}`);
    } catch (error) {}

    return res.json({
      success: true,
      message: "Carousel deleted successfully",
      carousel: deletedCarousel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting carousel",
      error: error.message,
    });
  }
});

router.get("/admin/restrictions", isAdmin, async (req, res) => {
  try {
    const restrictions = await Restrictions.find();
    return res.json({ success: true, restrictions });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching restrictions",
      error: error.message,
    });
  }
});

// Add Restriction
router.post("/admin/addrestriction", isAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    // Check for duplicate restrictions
    const existingRestriction = await Restrictions.findOne({ name });
    if (existingRestriction) {
      return res.status(409).json({
        success: false,
        message: "Restriction already exists",
      });
    }

    // Create new restriction
    const newRestriction = new Restrictions({ name });
    await newRestriction.save();

    return res.json({
      success: true,
      message: "Restriction added successfully",
      restriction: newRestriction,
    });
  } catch (error) {
    console.error("Error adding restriction:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error adding restriction",
      error: error.message,
    });
  }
});

// Delete Restriction
router.post("/admin/deleterestriction", isAdmin, async (req, res) => {
  try {
    const { id } = req.body;

    // Basic validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    // Check if restriction exists before deletion
    const restriction = await Restrictions.findById(id);
    if (!restriction) {
      return res.status(404).json({
        success: false,
        message: "Restriction not found",
      });
    }

    // Delete restriction
    await restriction.deleteOne();

    return res.json({
      success: true,
      message: "Restriction deleted successfully",
      restriction,
    });
  } catch (error) {
    console.error("Error deleting restriction:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting restriction",
      error: error.message,
    });
  }
});

// Add CustomBuilder image
router.post(
  "/admin/custom-builder/image",
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No image file uploaded" });
      }

      const path = `${process.env.PROTOCOL}://${process.env.IP}/uploads/${req.file.filename}`;
      const newCustomBuilder = new CustomBuilder({ Image: path });
      await newCustomBuilder.save();

      return res.json({
        success: true,
        message: "Custom Builder Image added successfully",
        customBuilder: newCustomBuilder,
      });
    } catch (error) {
      console.error("Error uploading and saving image:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading and saving image",
        error: error.message,
      });
    }
  }
);

// Get all CustomBuilder images
router.get("/admin/custom-builder/images", isAdmin, async (req, res) => {
  try {
    const images = await CustomBuilder.find().sort({ createdAt: -1 });
    res.json({ success: true, images });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching images",
      error: error.message,
    });
  }
});

// Delete CustomBuilder image
router.delete("/admin/custom-builder/:imageId", isAdmin, async (req, res) => {
  try {
    const { imageId } = req.params;

    // Find the image record
    const image = await CustomBuilder.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Extract the filename from the image URL
    const filename = image.Image.split("/").pop();

    // Delete the file from the uploads folder
    try {
      await fs.promises.unlink(`./uploads/${filename}`);
    } catch (fileError) {
      console.error("Error deleting image file:", fileError);
      // Continue with the database deletion even if file deletion fails
    }

    // Delete the record from the database
    await CustomBuilder.findByIdAndDelete(imageId);

    return res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom builder image:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting image",
      error: error.message,
    });
  }
});

// regenerate image background and messages
router.post("/admin/project/regenerate-images", isAdmin, async (req, res) => {
  try {
    const { image, promt, ratio } = req.body;

    res.json({ success: true, image, promt, ratio });
  } catch (error) {
    console.error("Error generating images:", error);
    res.status(500).json({
      success: false,
      message: "Error generating images",
      error: error.message,
    });
  }
});

// Fix CustomBuilder image URLs

// Contact Form route - for sending contact form emails
router.post("/contact", upload.single("attachment"), async (req, res) => {
  try {
    const { name, lastname, email, phone, category, subcategory, message } =
      req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required",
      });
    }

    // Create a transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "plugspaceapp@gmail.com",
        pass: process.env.EMAIL_PASS, // Make sure to set this in your .env file
      },
    });

    // Build email HTML content
    let emailContent = `
            <h2>Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name} ${lastname || ""}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Option:</strong> ${category || "Not specified"}</p>
            <h3>Message:</h3>
            <p>${message}</p>
        `;

    // Email options
    let mailOptions = {
      from: process.env.EMAIL_USER || "plugspaceapp@gmail.com",
      to: "plugspaceapp@gmail.com",
      subject: "New Contact Form Submission",
      html: emailContent,
    };

    // Add attachment if provided
    if (req.file) {
      mailOptions.attachments = [
        {
          filename: req.file.originalname,
          path: req.file.path,
        },
      ];
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Remove attachment file after sending
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (error) {
        console.error("Error deleting attachment file:", error);
      }
    }

    return res.json({
      success: true,
      message: "Contact form submitted successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending contact form email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send contact form",
      error: error.message,
    });
  }
});

// Report User route - for sending report emails
router.post("/report", async (req, res) => {
  try {
    const { reporterEmail, reportedEmail, reason } = req.body;

    // Basic validation
    if (!reporterEmail || !reportedEmail || !reason) {
      return res.status(400).json({
        success: false,
        message: "Reporter email, reported email and reason are required",
      });
    }

    // Create a transporter
    let transporter = nodemailer.createTransport({

      service: 'gmail',
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      from: "adeelasghar9292@gmail.com",
      auth: {
        user: "adeelasghar9292@gmail.com" || "plugspaceapp@gmail.com",
        pass: "sqjodwcwthledukw", // Make sure to set this in your .env file
      },
    });
    

    // Build email HTML content
    let emailContent = `
            <h2>Report User</h2>
            <p><strong>Reporter Email:</strong> ${reporterEmail}</p>
            <p><strong>Reported Email:</strong> ${reportedEmail}</p>
            <p><strong>Reason:</strong> ${reason}</p>
        `;

    // Email options
    let mailOptions = {
      from: "adeelasghar9292@gmail.com" || "plugspaceapp@gmail.com",
      to: "contact@valuevauil.ai",
      subject: "Report User",
      html: emailContent,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Remove attachment file after sending
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (error) {
        console.error("Error deleting attachment file:", error);
      }
    }

    return res.json({
      success: true,
      message: "Report email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending report email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send report email",
      error: error.message,
    });
  }
});
module.exports = router;
