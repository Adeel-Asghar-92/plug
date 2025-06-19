const dotenv = require("dotenv");
const path = require("path");

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: envFile });

const express = require("express");
const app = express();
const cors = require("cors");
const AuthRoutes = require("./routes/auth");
const SubscribeRoutes = require("./routes/subscribe");
const AdminRoutes = require("./routes/admin");
const imageEditRoutes = require("./routes/imageEdit");
const favoriteRoutes = require("./routes/favoriteRoutes");
const UserRoutes = require("./routes/user");
const UserProductRoutes = require("./routes/userProductRoutes");
const ProductRoutes = require("./routes/product");
const StripeRoutes = require("./routes/stripe");
const SessionRoutes = require("./routes/chatSession");
const webhookRoutes = require("./routes/webhooks");
const bodyParser = require("body-parser");

const planRoutes = require("./routes/planRoutes");
const teamMemberRoutes = require("./routes/teamMemberRoutes");
const stepRoutes = require("./routes/stepRoutes");

const AiRoutes = require("./routes/ai");
const mongoose = require("mongoose");
const axios = require("axios");
const cookieParser = require("cookie-parser");

const User = require("./models/user");

const { OpenAI } = require("openai");

app.use("/api/webhooks", webhookRoutes);

const http = require("http"); // Required to integrate Socket.IO
const { Server } = require("socket.io"); // Import the Socket.IO server
const setupSocket = require("./socket/socket");

const server = http.createServer(app); // Create the HTTP server for Express and Socket.IO
const io = setupSocket(server);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.urlencoded({ extended: true, limit: "200mb" }));
app.use(bodyParser.json({ limit: "200mb" }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_URL,
      "https://valuevault.ai",
    ],
    credentials: true,
  })
);

// app.use(express.json({ limit: "200mb" }));

// Middleware to parse cookies
app.use(cookieParser());

const MONGODB =
  process.env.MONGO_URI ||
  "mongodb+srv://dashmeeshop:0Y8t6p2QeOY9E6c0@cluster0.oqhu6.mongodb.net/plugspace?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  try {
    await mongoose
      .connect(MONGODB)
      .then(() => console.log("Connected to MongoDB"))
      .catch((err) => console.error("Error connecting to MongoDB:", err));
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

const Product = require("./models/product");
// const bodyParser = require("body-parser");

// Admin Authentication Middleware (unchanged)
const adminAuth = (req, res, next) => {
  const { username, password } = req.headers;
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    next(); // Proceed if credentials match
  } else {
    res.status(401).json({ message: "Unauthorized access" });
  }
};

// Protected Admin Routes
app.use("/admin", adminAuth);
app.get("/admin/dashboard", (req, res) => {
  res.json({ message: "Welcome to the admin dashboard" });
});

app.get("/", (req, res) => {
  res.send("Welcome to the Node.js Dashboard API");
});

// API Routes
app.use("/api/", StripeRoutes);
app.use("/api/", AuthRoutes);
app.use("/api/", AdminRoutes);
app.use("/api/", imageEditRoutes);
app.use("/api/", SubscribeRoutes);
app.use("/api/", UserRoutes);
app.use("/api/", UserProductRoutes);
app.use("/api/favorites/", favoriteRoutes);
app.use("/api/product", ProductRoutes);
app.use("/api/chat/", SessionRoutes);
app.use("/api/ai/", AiRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/team-members", teamMemberRoutes);
app.use("/api/steps", stepRoutes);

// ... (keep all your existing imports and setup code)

// Oxylabs Configuration (direct credentials)
const OXYLABS_CONFIG = {
  username: "valuevault_YZucD",
  password: "d=VNLsCg+6sfGxG",
  endpoint: "https://realtime.oxylabs.io/v1/queries",
};

// Enhanced Scraper Endpoint
app.post("/api/scrape-product", async (req, res) => {
  try {
    console.log(req.body);
    console.log("\n===== NEW SCRAPE REQUEST =====");
    console.log("Incoming Request:", {
      url: req.body.url,
      category: req.body.category,
      subcategory: req.body.subcategory,
      secondSubcategory: req.body.secondSubcategory,
      timestamp: new Date().toISOString(),
    });

    const { url, category, subcategory, secondSubcategory, email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
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

    // Input validation
    if (!url || !category) {
      console.error("Validation Error: Missing URL or Category");
      return res.status(400).json({
        success: false,
        message: "URL and category are required",
      });
    }

    console.log("\n=== SENDING TO OXYLABS ===");
    const oxylabsPayload = {
      source: "universal_ecommerce",
      url: url,
      geo_location: "United States",
      parse: true,
      context: [
        { key: "category", value: category },
        ...(subcategory ? [{ key: "subcategory", value: subcategory }] : []),
        ...(secondSubcategory
          ? [{ key: "secondSubcategory", value: secondSubcategory }]
          : []),
      ],
    };
    console.log("Payload:", JSON.stringify(oxylabsPayload, null, 2));

    const response = await axios.post(
      "https://realtime.oxylabs.io/v1/queries",
      oxylabsPayload,
      {
        auth: {
          username: "valuevault_YZucD",
          password: "d=VNLsCg+6sfGxG",
        },
        timeout: 30000,
      }
    );

    console.log("\n=== OXYLABS FULL RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Headers:", response.headers);
    console.log(
      "Complete Response Data:",
      JSON.stringify(response.data, null, 2)
    );

    const scrapedData = response.data.results[0]?.content;
    if (!scrapedData) {
      console.error("No content in response:", response.data);
      throw new Error("No content received from Oxylabs");
    }

    console.log("\n=== SCRAPED DATA ANALYSIS ===");
    console.log("All Available Fields:", Object.keys(scrapedData));
    console.log("All Data:", scrapedData);
    console.log("Sample of Scraped Data:", {
      title: scrapedData.title,
      price: scrapedData.price,
      seller: scrapedData.seller,
      vendor: scrapedData.vendor,
      brand: scrapedData.brand,
      agent: scrapedData.agent,
      brokerage: scrapedData.brokerage,
      image: scrapedData.image,
      images: scrapedData.images ? scrapedData.images.slice(0, 3) : null,
      description: scrapedData.description
        ? scrapedData.description.substring(0, 100) + "..."
        : null,
    });

    // Enhanced seller extraction with domain-specific logic
    let seller = "Unknown Seller";

    // 1. First try standard ecommerce fields
    seller =
      scrapedData.seller ||
      scrapedData.vendor ||
      scrapedData.brand ||
      scrapedData.manufacturer ||
      scrapedData.store ||
      seller; // Keep current value if all above are undefined

    // 2. Special handling for Yachts
    if (category === "Yacht") {
      seller =
        scrapedData.brokerage || // Common in yacht listings
        scrapedData.brand || // Manufacturer name
        scrapedData.agent || // Sometimes listed as agent
        (() => {
          // Try to extract from URL for JamesEdition and similar sites
          try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes("jamesedition")) {
              const pathParts = urlObj.pathname.split("/");
              // Typically format: /yachts/{brand}/{model}/
              return pathParts[2]
                ? pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1)
                : seller;
            }
          } catch (e) {
            console.log("URL parsing error for seller extraction");
          }
          return seller;
        })();
    }

    // 3. Special handling for Real Estate
    if (category === "Real Estate") {
      seller =
        scrapedData.brokerage ||
        scrapedData.agent ||
        scrapedData.listing_office ||
        scrapedData.property_management ||
        scrapedData.advertiser ||
        scrapedData.contact_name ||
        (() => {
          // Try to extract from domain for real estate sites
          try {
            const domain = new URL(url).hostname;
            const domainParts = domain.replace("www.", "").split(".");
            // Get the main domain name (e.g., 'remax' from 'remax.com')
            const mainDomain =
              domainParts.length > 1
                ? domainParts[domainParts.length - 2]
                : domainParts[0];
            return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
          } catch (e) {
            console.log("Could not extract seller from domain");
            return seller;
          }
        })();
    }

    // 4. Final formatting cleanup
    seller = seller.replace(/[^\w\s]/gi, "").trim(); // Remove special characters
    if (seller === "Unknown Seller") {
      // One last attempt - check description for company names
      const companyMatch = scrapedData.description?.match(
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(Yachts|Realty|Properties|Homes|Estates)/
      );
      if (companyMatch) {
        seller = companyMatch[1];
      }
    }

    let savedBy = user?.email || "system";

    // Image extraction
    const imageUrl =
      scrapedData.main_image ||
      scrapedData.image ||
      scrapedData.primary_image ||
      (scrapedData.images && scrapedData.images[0]) ||
      "";

    const productData = {
      productId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: scrapedData.title || scrapedData.product_name || "Unknown Product",
      price: scrapedData.price || 0,
      imageUrl: imageUrl,
      videoUrl: null,
      seller: seller,
      detailUrl: url,
      category: category,
      subcategory: subcategory || "",
      secondSubcategory: secondSubcategory || "",
      description: scrapedData.description || "",
      colors: scrapedData.variants?.map((v) => v.color).filter(Boolean) || [],
      sizes: scrapedData.variants?.map((v) => v.size).filter(Boolean) || [],
      images: scrapedData.images || [],
      savedBy: savedBy,
      companyDetails: "",
      additional_properties: scrapedData.additional_properties || [],
    };

    const prompt =
      `Write a concise overview of the company, including its core product or service. List at least 5 major awards, accolades, or notable celebrities who use the brand. Then provide 5 compelling reasons why customers should choose this brand, followed by one key feature that users are likely to value most in the next 3 years. Conclude with 4 product-specific details: year built, technology used (if applicable), location of origin, and one standout feature—tailored to the product category (e.g., yachts, jets, real estate, watches, cars).
              Title: ${productData.title}
              Price: ${
                productData.price ? `$${productData.price}` : "Not provided"
              }
              Category: ${productData.category || "N/A"}
              Subcategory: ${productData.subcategory || "N/A"}
              Second Subcategory: ${productData.secondSubcategory || "N/A"}
              Description: ${
                productData.description || "No description available"
              }
              Available Colors: ${productData.colors?.join(", ") || "N/A"}
              Available Sizes: ${productData.sizes?.join(", ") || "N/A"}
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

      productData.companyDetails = response.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI error:", error?.response?.data || error.message);
    }

    console.log("\n=== FINAL PRODUCT DATA ===");
    console.log(JSON.stringify(productData, null, 2));

    const product = new Product(productData);
    const savedProduct = await product.save();

    // Add product to user's savedProducts if not already present
    if (user) {
      if (!user.savedProducts.includes(savedProduct._id)) {
        user.savedProducts.push(savedProduct._id);
      }
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

    console.log("\n=== SAVE RESULT ===");
    console.log("Saved Product:", {
      id: savedProduct._id,
      seller: savedProduct.seller,
      category: savedProduct.category,
      subcategory: savedProduct.subcategory,
      secondSubcategory: savedProduct.secondSubcategory,
    });

    return res.status(201).json({
      success: true,
      product: savedProduct,
    });
  } catch (error) {
    console.error("\n=== SCRAPE ERROR ===");
    console.error("Error:", error.message);
    console.error("Error Stack:", error.stack);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    }
    console.error("Request Config:", {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
    });

    return res.status(500).json({
      success: false,
      message: "Scraping failed",
      error: error.message,
      details: error.response?.data || null,
    });
  } finally {
    console.log("\n===== REQUEST COMPLETED =====\n");
  }
});
// ... (keep the rest of your server setup code)

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5001;
server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
