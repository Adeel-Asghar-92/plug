const express = require("express");
const User = require("../models/user");
const Product = require("../models/product");
const crypto = require("crypto");
const router = express.Router();
const axios = require("axios");
const multer = require("multer");
const path = require("path");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store files in 'uploads' folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed (jpeg, jpg, png, gif)"));
  },
});

// Middleware to verify API key
const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const email = req.query.email;

  if (!apiKey || !email) {
    return res.status(401).json({ error: "API key and email required" });
  }

  try {
    const user = await User.findOne({ email, apiKey });
    if (!user) {
      return res.status(401).json({ error: "Invalid API key or email" });
    }
    if (!["premium", "standard", "basic"].includes(user.subscription)) {
      return res.status(403).json({ error: "Premium subscription required" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: "Authentication failed" });
  }
};

// API endpoint to get saved products using API key
router.get("/saved-products", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.query.email }).populate(
      "savedProducts"
    );
    res.json({
      products: user.savedProducts.map((product) => {
        return({
        productId: product.productId,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        detailUrl: product.detailUrl,
        seller: product.seller,
        category: product.category,
        subcategory: product.subcategory,
        secondSubcategory: product.secondSubcategory,
      })})
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Save product for user
router.post(
  "/user/saved-products",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        email,
        title,
        description,
        price,
        category,
        subcategory,
        location,
        detailUrl,
        secondSubcategory,
        videoUrl,
      } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.email !== process.env.ADMIN_EMAIL) {
        if (user.subscriptionDetails.geoListing == 0) {
          if (user?.tokens < 500) {
            return res.status(403).json({
              error: "Add Tokens to your account or upgrade subscription",
              reason: "token",
            });
          }
        }
      }

      // Check if product exists or create a new one
      let product = await Product.findOne({ title });
      if (!product) {
        const productId = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        const imageUrl = `${req.protocol}://${req.get(
          "host"
        )}/uploads/${req.file.filename.replace(/\\/g, "/")}`;

        product = await Product.create({
          productId,
          title,
          description,
          price,
          category,
          subcategory,
          location,
          imageUrl: imageUrl,
          images: [imageUrl],
          detailUrl,
          secondSubcategory,
          videoUrl: videoUrl || null,
          savedBy: "user",
        });
      }

      user.savedProducts.push(product._id);

      if (
        user.subscriptionDetails.geoListing != "Unlimited" ||
        user?.email !== process.env.ADMIN_EMAIL
      ) {
        if (user.subscriptionDetails.geoListing == 0) {
          user.tokens = Number(user.tokens) - 500;
        } else {
          user.subscriptionDetails.geoListing =
            Number(user.subscriptionDetails.geoListing) - 1;
        }
      }
      user.save();

      res.json({
        message: "Product saved successfully",
        success: true,
        product: {
          productId: product.productId,
          title: product.title,
          price: product.price,
          imageUrl: product.images[0],
          detailUrl: product.detailUrl,
        },
        remainingGeoListings: user.subscriptionDetails.geoListing,
      });
    } catch (error) {
      console.error("Error saving product:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
// POST route to save products by URL
router.post("/user/saved-products-by-url", async (req, res) => {
  try {
    const { email, url } = req.body;

    // Validate inputs
    if (!email || !url) {
      return res.status(400).json({ error: "Email and URL are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.email !== process.env.ADMIN_EMAIL) {
      if (user.subscriptionDetails.geoListing == 0) {
        if (user?.tokens < 500) {
          return res.status(403).json({
            error: "Add Tokens to your account or upgrade subscription",
            reason: "token",
          });
        }
      }
    }

    // Extract domain from the URL
    let siteDomain;
    try {
      const urlObj = new URL(url);
      siteDomain = urlObj.hostname; // e.g., "www.amazon.sa"
    } catch (error) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Function to extract potential product ID from URL
    const extractProductId = (url) => {
      // Common patterns for product IDs
      const patterns = [
        /product\/(\d+)/, // e.g., /product/12345
        /dp\/([A-Z0-9]{10})/, // Amazon DP (e.g., /dp/B0D2N69B4P)
        /item\/(\d+)/, // eBay item (e.g., /item/123456)
        /p\/(\d+)/, // Generic /p/12345
        /id=(\d+)/, // Query param id=12345
        /([A-Z0-9]{8,12})/, // Fallback: 8-12 alphanumeric chars
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }

      // If no pattern matches, try to find any sequence that looks like an ID
      const pathSegments = url.split("/").filter((segment) => segment);
      const queryParams = new URLSearchParams(url.split("?")[1] || "");

      // Look in path segments
      for (const segment of pathSegments) {
        if (/^[A-Z0-9]{6,}$/.test(segment)) return segment; // At least 6 alphanumeric chars
      }

      // Look in query params
      for (const [key, value] of queryParams) {
        if (/^[A-Z0-9]{6,}$/.test(value)) return value;
      }

      return null; // No ID found
    };

    const productId = extractProductId(url);
    if (!productId) {
      return res
        .status(400)
        .json({ error: "Could not extract product ID from URL" });
    }

    // Fetch product data from SearchAPI.io with dynamic site domain
    const response = await axios.get("https://www.searchapi.io/api/v1/search", {
      params: {
        engine: "google",
        product_id: productId,
        api_key: "QQEUz1sddzCgE2zJRMZbfWfd",
        q: `${url} site:${siteDomain}`,
        hl: "en",
        gl: "us",
      },
    });
    const apiProduct = response.data.product || {};
    const offers = response.data.offers || [];

    // Map API response to your Product schema
    const productData = {
      productId,
      title: apiProduct.title || "Unknown Title",
      price: offers.length > 0 ? parseFloat(offers[0].price) : null,
      imageUrl: apiProduct.images?.[0] || "",
      withVendor: offers.map((offer) => ({
        imageUrl: offer.image || apiProduct.images?.[0] || "",
        sourceUrl: offer.link || "",
      })),
      seller: offers.length > 0 ? offers[0].seller_name : "Unknown Seller",
      shopId: null,
      detailUrl: url,
      category: apiProduct.category || "Uncategorized",
      subcategory: apiProduct.subcategory || "",
      description: apiProduct.description || "",
      colors: apiProduct.variations?.colors || [],
      sizes: apiProduct.variations?.sizes || [],
      images: apiProduct.images || [],
      savedBy: "user",
    };

    // Create and save the product
    const product = await Product.create(productData);

    // Add product to user's savedProducts if not already present
    if (!user.savedProducts.includes(product._id)) {
      user.savedProducts.push(product._id);
    }

    if (
      user.subscriptionDetails.geoListing != "Unlimited" ||
      user?.email !== process.env.ADMIN_EMAIL
    ) {
      if (user.subscriptionDetails.geoListing == 0) {
        user.tokens = Number(user.tokens) - 500;
      } else {
        user.subscriptionDetails.geoListing =
          Number(user.subscriptionDetails.geoListing) - 1;
      }
    }
    user.save();

    res.json({ message: "Product saved successfully", product });
  } catch (error) {
    console.error("Error saving product:", error.message);
    res.status(500).json({ error: "Failed to save product" });
  }
});
router.get("/user/saved-products", async (req, res) => {
  try {
    const { email, id } = req.query;
    const query = email ? { email } : { _id: id };
    const user = await User.findOne(query).populate({
      path: "savedProducts",
      select: "+detailUrl",
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const reversedProducts = user.savedProducts.reverse();
    const followers = [];
    const favourites = [];
    const followersSet = new Set();
    const favouritesSet = new Set();
    reversedProducts.forEach((product) => {
      product.followers.forEach((follower) => followersSet.add(follower.email));
      product.favourites.forEach((favourite) => favouritesSet.add(favourite.email));
    });
    const uniqueFollowers = Array.from(followersSet);
    const uniqueFavourites = Array.from(favouritesSet);
    console.log(uniqueFollowers);
    console.log(uniqueFavourites);
    res.json({ products: reversedProducts, stats:{followers: uniqueFollowers, favourites: uniqueFavourites} });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Remove saved product
router.delete("/user/saved-products/:productId", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    user.savedProducts = user.savedProducts.filter(
      (id) => !id.equals(product._id)
    );
    await Product.findOneAndDelete({ productId: req.params.productId });
    await user.save();

    res.json({ message: "Product removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update saved product

router.put(
  "/user/saved-products-image/:productId",
  upload.single("image"),
  async (req, res) => {
    try {
      const { imageUrl, email } = req.body;
      // Validate required fields
      if (!imageUrl || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find product
      const product = await Product.findOne({
        productId: req.params.productId,
      });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Verify product belongs to user
      const productBelongsToUser = user.savedProducts.some((id) =>
        id.equals(product._id)
      );
      if (!productBelongsToUser) {
        return res
          .status(403)
          .json({ error: "Product does not belong to user" });
      }

      // Update product
      product.imageUrl = imageUrl;
      product.images[0] = imageUrl;
      product.updatedAt = new Date();

      await product.save();

      res.json({
        success: true,
        message: "Updated successfully",
        product: {
          productId: product.productId,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          subcategory: product.subcategory,
        },
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Server error during product update",
      });
    }
  }
);

router.put(
  "/user/saved-products/:productId",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        email,
        title,
        price,
        category,
        imageUrl,
        subcategory,
        secondSubcategory,
        videoUrl,
      } = req.body;
      const imageUrlLocal = `${req.protocol}://${req.get(
        "host"
      )}/uploads/${req.file?.filename.replace(/\\/g, "/")}`;

      // Validate required fields
      if (!email || !title || !price) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.email !== process.env.ADMIN_EMAIL) {
        if (user.subscriptionDetails.status !== "active") {
          if (req.file) {
            if (user.tokens < 20) {
              return res.status(402).json({
                success: false,
                message: "Insufficient Token",
                reason: "token",
              });
            }
          }
        }
      }

      // Find product
      const product = await Product.findOne({
        productId: req.params.productId,
      });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Verify product belongs to user
      const productBelongsToUser = user.savedProducts.some((id) =>
        id.equals(product._id)
      );
      if (!productBelongsToUser) {
        return res
          .status(403)
          .json({ error: "Product does not belong to user" });
      }

      // Handle file upload if present
      // let finalImageUrl = imageUrl;
      // if (req.file) {
      //     // Process file upload (implementation depends on your storage solution)
      //     // Example for Cloudinary:
      //     const result = await cloudinary.uploader.upload(req.file.path);
      //     finalImageUrl = result.secure_url;

      //     // Delete temp file
      //     fs.unlinkSync(req.file.path);
      // }

      // Update product
      product.title = title;
      product.price = price;
      product.imageUrl = imageUrl || imageUrlLocal; // Keep existing if no new image
      product.images[0] = imageUrl || imageUrlLocal; // Keep existing if no new image
      product.category = category || product.category;
      product.subcategory = subcategory || product.subcategory;
      product.secondSubcategory =
        secondSubcategory || product.secondSubcategory;
      product.updatedAt = new Date();
      product.videoUrl = videoUrl || product.videoUrl;

      await product.save();

      if (user.email !== process.env.ADMIN_EMAIL) {
        if (user.subscriptionDetails.status !== "active") {
          if (req.file) {
            user.tokens = Number(user.tokens) - 20;
            await user.save();
          }
        }
      }

      res.json({
        success: true,
        message: "Product updated successfully",
        product: {
          productId: product.productId,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          subcategory: product.subcategory,
        },
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Server error during product update",
      });
    }
  }
);

// Get API key
router.get("/user/api-key", async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.apiKey) {
      user.apiKey = crypto.randomBytes(32).toString("hex");
      await user.save();
    }

    res.json({ apiKey: user.apiKey });
  } catch (error) {
    console.error("Error retrieving API key:", error);
    res.status(500).json({ error: error.message });
  }
});

// Regenerate API key
router.post("/user/api-key", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.apiKey = crypto.randomBytes(32).toString("hex");
    await user.save();

    res.json({ apiKey: user.apiKey });
  } catch (error) {
    console.error("Error regenerating API key:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/user/update-geosearch-tokens", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has available geoSearchTokens
    if (user.email !== process.env.ADMIN_EMAIL) {
      if (
        user.subscriptionDetails.geoSearchTokens === 0 ||
        user.subscriptionDetails.geoSearchTokens === "0"
      ) {
        return res.status(403).json({
          error:
            "No geoSearchTokens available. Please upgrade your subscription.",
        });
      }
    }

    // Subtract one geoSearchToken if not unlimited
    if (
      user.subscriptionDetails.geoSearchTokens !== "Unlimited" ||
      user?.email !== process.env.ADMIN_EMAIL
    ) {
      user.subscriptionDetails.geoSearchTokens =
        Number(user.subscriptionDetails.geoSearchTokens) - 1;
      await user.save();
    }

    res.json({
      message: "GeoSearchTokens updated successfully",
      remainingGeoSearchTokens: user.subscriptionDetails.geoSearchTokens,
    });
  } catch (error) {
    console.error("Error updating geoSearchTokens:", error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;

router.post("/user/searchbyimage", upload.single("image"), async (req, res) => {
  try {
    const { email } = req.body;
    const file = req.file;
    if (!email || !file) {
      return res.status(400).json({ error: "Someting went wrong" });
    }
    const base64Image = file.buffer.toString("base64");

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.balance >= 10 || email === process.env.ADMIN_EMAIL) {
      try {
        const payload = {
          key: "29a9df07476d9153a64cb7cdd8982968",
          data: base64Image,
        };

        const response = await axios.post(
          "https://www.lovbuy.com/1688api/uploadimg2.php",
          new URLSearchParams(payload).toString(),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        const { result } = response.data;
        if (result?.success === "true") {
          const requestData = {
            key: "29a9df07476d9153a64cb7cdd8982968",
            beginPage: "1",
            pageSize: "50",
            imageId: result?.result,
            lang: "en",
          };
          //   console.log(requestData);
          try {
            const response = await axios.post(
              "https://www.lovbuy.com/1688api/searchimg2.php",
              requestData,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.data?.result?.success) {
              const products = response.data.result.result.data.map((item) => ({
                productId: item.offerId?.toString() || "undefined",
                title: item.subjectTrans || item.subject || "undefined",
                price: parseFloat(item.priceInfo?.price) * 0.7 || 0,
                imageUrl: item.imageUrl || "undefined",
                seller: "1688",
                shopId: "1668",
                detailUrl: item.promotionURL || "undefined",
                category: "undefined",
                subcategory: "undefined",
                createdAt: new Date(),
                isActive: true,
              }));
              //   console.log("Products fetched successfully:", response.data.result.result.data);
              if (products.length > 0 && email !== process.env.ADMIN_EMAIL) {
                if (user.subscription === "free") {
                  user.balance -= 20;
                } else {
                  user.balance -= 10;
                }
                await user.save();
              }

              return res.json({
                subscriptionDetails: user.subscriptionDetails,
                products: products,
              });
            } else {
              console.error(
                "API error:",
                response.data?.result?.code || "Unknown error"
              );
            }
          } catch (error) {
            console.error("Request failed:", error.message);
          }
        } else {
          return res
            .status(400)
            .json({ error: "Image upload failed.", details: result });
        }
      } catch (apiError) {
        console.error("Error communicating with LovBuy API:", apiError);
        return res
          .status(500)
          .json({ error: "Error communicating with LovBuy API." });
      }
    } else {
      await user.save();
      return res.status(403).json({ message: "Please upgrade your plan!" });
    }
  } catch (error) {
    console.error("Error in search by image route:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

router.post("/user/getproductinfo", async (req, res) => {
  try {
    // console.log('hit')
    const { email, productId } = req.body;
    if (!email || !productId) {
      return res.status(404).json({ error: "Plase provide all information!" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      // console.log('user not found')
      return res.status(404).json({ error: "User not found" });
    }

    if (
      !["premium", "standard", "basic"].includes(user.subscription) &&
      email !== process.env.ADMIN_EMAIL
    ) {
      // console.log('user is free')
      return res.status(403).json({ error: "Premium subscription required" });
    }
    const existingProduct = await Product.findOne({ productId });
    if (
      existingProduct &&
      (existingProduct.images.length > 0 ||
        existingProduct.colors.length > 0 ||
        existingProduct.sizes.length > 0)
    ) {
      // console.log('product has variables')
      return res.status(200).json(existingProduct);
    }
    const detailUrl = req.body.detailUrl || existingProduct.detailUrl;
    if (!detailUrl) {
      return res.status(404).json({ error: "Not found!" });
    }
    try {
      let apiEndpoint;
      //selects the api endpoint based on the detailUrl
      if (detailUrl.includes("1688.com")) {
        apiEndpoint = "https://www.lovbuy.com/1688api/getproductinfo2.php";
      } else if (detailUrl.includes("aliexpress.com")) {
        apiEndpoint = "https://www.lovbuy.com/aliexpressapi/getproductinfo.php";
      }
      // console.log(apiEndpoint)
      const response = await axios.get(apiEndpoint, {
        params: {
          key: "29a9df07476d9153a64cb7cdd8982968",
          item_id: productId,
        },
      });
      // console.log(response.data)
      if (
        response?.data?.status === "200" &&
        apiEndpoint ===
          "https://www.lovbuy.com/aliexpressapi/getproductinfo.php"
      ) {
        const images = response?.data?.productinfo?.item_imgs?.map(
          (item) => item.url
        );
        const object = response?.data?.productinfo?.props_list;
        let colors = [];
        let sizes = [];
        try {
          colors = Object.values(object)
            .filter((item) => item.includes("Color"))
            .map((item) => item.split(":")[1]);
          sizes = Object.values(object)
            .filter((item) => item.includes("Size"))
            .map((item) => item.split(":")[1]);
        } catch (error) {}
        const product = req.body;
        product.images = images;
        product.colors = colors;
        product.sizes = sizes;
        //saves extra info so that next time we dont have to fetch it again
        if (
          existingProduct &&
          !(
            existingProduct.images.length > 0 ||
            existingProduct.colors.length > 0 ||
            existingProduct.sizes.length > 0
          )
        ) {
          existingProduct.images = images;
          existingProduct.colors = colors;
          existingProduct.sizes = sizes;
          await existingProduct.save();
        }
        // console.log(response?.data?.productinfo?.props_list)
        return res.status(200).json(product);
      } else if (
        response?.data?.result?.success &&
        apiEndpoint === "https://www.lovbuy.com/1688api/getproductinfo2.php"
      ) {
        const result = response?.data?.result?.result;
        const images = result.productImage.images;
        const colors = await result.productAttribute
          .filter((item) => item.attributeNameTrans === "Color")
          .map((item) => item.valueTrans)
          .filter((item) => item !== "");
        const sizes = await result.productAttribute
          .filter((item) => item.attributeNameTrans === "Size")
          .map((item) => item.valueTrans)
          .filter((item) => item !== "");
        const product = req.body;
        product.images = images;
        product.colors = colors;
        product.sizes = sizes;
        //saves extra info so that next time we dont have to fetch it again
        if (
          existingProduct &&
          !(
            existingProduct.images.length > 0 ||
            existingProduct.colors.length > 0 ||
            existingProduct.sizes.length > 0
          )
        ) {
          existingProduct.images = images;
          existingProduct.colors = colors;
          existingProduct.sizes = sizes;
          await existingProduct.save();
        }
        // console.log(colors)
        return res.status(200).json(product);
      } else {
        // console.log(response.data)
        return res.status(400).json({ error: "Product not found" });
      }
    } catch (error) {
      // console.log(error)
      return res.status(400).json({ error: "Product not found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
});

router.post("/user/getTokens", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ data: user.tokens || 0 });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
});

router.post("/user/getUsersDetail", async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: "Invalid email array" });
    }
    const users = await User.find({ email: { $in: emails } }, {
      _id: 1,
      fullName: 1,
      email: 1,
      photoURL: 1,
    });
    return res.json({ data: users });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
});
router.get("/user/getUserDetail", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const user = await User.findById(id, {
      _id: 1,
      fullName: 1,
      email: 1,
      photoURL: 1,
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ data: user });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
});

router.post("/user/blockEmail", async (req, res) => {
  try {
    const { userEmail, blockEmail, block } = req.body;

    if (!userEmail || !blockEmail) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const savedProducts = await Product.find({ _id: { $in: user.savedProducts } });
    if (savedProducts.length === 0) {
      return res.status(404).json({ error: "No saved products found for the user" });
    }

    await Promise.all(
      savedProducts.map(async (product) => {
        const blockedUserIndex = product.blockedUsers.findIndex((blockedUser) => blockedUser.email === blockEmail);
        if (block) {
          if (blockedUserIndex === -1) {
            product.blockedUsers.push({ email: blockEmail });
          }
        } else {
          if (blockedUserIndex !== -1) {
            product.blockedUsers.splice(blockedUserIndex, 1);
          }
        }
        await product.save();
      })
    );

    return res.json({ message: `Email ${block ? "blocked" : "unblocked"} successfully in saved products` });
  } catch (error) {
    console.error("Error in blockEmail route:", error);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Block/Unblock user
router.post("/user/toggleBlock", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    return res.json({ message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully` });
  } catch (error) {
    console.error("Error in toggleBlock route:", error);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
});

module.exports = router;
