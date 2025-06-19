const User = require("../models/user");
const Product = require("../models/product");
const Restrictions = require("../models/restrictions");
const { OpenAI } = require("openai");
const multer = require("multer");
const {
  FunctionDeclarationSchemaType,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} = require("@google-cloud/vertexai");
const textModel = "gemini-1.5-flash";
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const key = require("../jsondata/apikey.json");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const vertexAI = new VertexAI({
  project: "plugspace-app",
  location: "us-central1",
});
const express = require("express");
const { default: axios } = require("axios");
const { default: mongoose } = require("mongoose");
const bodyParser = require("body-parser");
const router = express.Router();
// Instantiate Gemini models
const generativeModel = vertexAI.getGenerativeModel({
  model: textModel,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  generationConfig: { maxOutputTokens: 256 },
  systemInstruction: {
    role: "system",
    parts: [
      {
        text: `You need to search for the products in the internet and provide the information to the user. Always provide the correct and latest information. Even if it's a image you need to indentify the product in image and provide the information. 
        `,
      },
    ],
  },
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyAtYQDclVLXM7LKcLfRUASRG2E_uRFtRpw");

const formidableMiddleware = (req, res, next) => {
  const form = new formidable.IncomingForm({
    maxFileSize: 50 * 1024 * 1024, // 50MB limit (adjust as needed)
    maxFieldsSize: 10 * 1024 * 1024, // 10MB limit for fields
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(413).json({ error: "File too large" }); // Handle error properly
    }

    try {
      if (files.image) {
        const file = Array.isArray(files.image) ? files.image[0] : files.image;
        const filePath = file.filepath;
        const fileBuffer = await fs.promises.readFile(filePath);
        const base64Image = fileBuffer.toString("base64");
        const mimeType = file.mimetype;

        const filePart = {
          inline_data: {
            data: base64Image,
            mimeType: mimeType,
          },
        };

        const publicFolder = path.join(__dirname, "..", "uploads");
        if (!fs.existsSync(publicFolder)) {
          fs.mkdirSync(publicFolder, { recursive: true });
        }

        const newFileName = `${Date.now()}-${file.originalFilename}`;
        const newFilePath = path.join(publicFolder, newFileName);
        await fs.promises.writeFile(newFilePath, fileBuffer);

        const fileUrl = `${process.env.PROTOCOL}://${process.env.IP}/uploads/${newFileName}`;

        req.body = {
          ...fields,
          image: filePart,
          fileUrl: fileUrl,
        };
      } else {
        req.body = fields;
      }
      next();
    } catch (error) {
      console.error("Error processing file:", error);
      next(error);
    }
  });
};

async function forceGetPriceFromGemini(product) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Goal: Find the highest credible listed price for a specific product using text and images or only text or only image to search no less than 30 credible website for answer not just 1,or 2 or 3 or 4 or 5.

Identify: Use provided text (name, model, specs) and images combined to pinpoint the exact product.

Research: Search the manufacturer's site and major online retailers. Verify matches using both text details and comparing product images on seller pages to your provided image. If listed as "Price on Request, the research historical data from website to create the possible price. never return zero.

Filter: Target only the standard listed price (MSRP/regular retail) for the exact, visually confirmed product. Exclude sales, used, bundles, $0 prices, and unreliable sellers.

Select & Report: Identify the single highest valid listed price found and report that figure.

Required Input:
- Product Name: "${product.name || "N/A"}"
- Manufacturer: "${product.manufacturer || "N/A"}"
- Model/Series: "${product.model || "N/A"}"
- Type: "${product.type || "N/A"}"
- Year: "${product.year || "N/A"}"
- Condition: "${product.condition || "New"}"
- SKU: "${product.sku || "N/A"}"
- Key Specs: "${product.specs ? JSON.stringify(product.specs) : "N/A"}"
- Image(s): "${product.image?.link || product.thumbnail || "N/A"}"
- Location/Market: "${product.location || "US"}"
    5. OUTPUT FORMAT:
       - Return only a numeric value rounded to 2 decimal places.
       - Example: "129.95" (no currency symbols, words, or explanations).
       - For services, return the standard rate (e.g., daily rate for rentals, full price for home sales).
       - If no price is found, return the AI-generated realistic estimated price based on the Title.

    FINAL PRICE:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extract the first valid number
    const priceMatch = text.match(/(\d+\.\d{2})/);
    if (!priceMatch) throw new Error("No valid price found in response");

    const price = parseFloat(priceMatch[1]);

    // Validate price is realistic and non-zero
    if (price <= 0) {
      throw new Error("Unrealistic price: zero or negative");
    }

    return price;
  } catch (error) {
    console.error(`Failed to get price for ${product.title}:`, error);
    // Retry with a more forceful prompt
    return forceGetPriceFromGeminiRetry(product);
  }
}

async function forceGetPriceFromGeminiRetry(product) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Goal: Find the highest credible listed price for a specific product using text and images or only text or only image to search no less than 30 credible website for answer not just 1,or 2 or 3 or 4 or 5.

    Identify: Use provided text (name, model, specs) and images combined to pinpoint the exact product.
    
    Research: Search the manufacturer's site and major online retailers. Verify matches using both text details and comparing product images on seller pages to your provided image. If listed as "Price on Request, the research historical data from website to create the possible price. never return zero.
    
    Filter: Target only the standard listed price (MSRP/regular retail) for the exact, visually confirmed product. Exclude sales, used, bundles, $0 prices, and unreliable sellers.
    
    Select & Report: Identify the single highest valid listed price found and report that figure.
    
    Required Input:
    - Product Name: "${product.name || "N/A"}"
    - Manufacturer: "${product.manufacturer || "N/A"}"
    - Model/Series: "${product.model || "N/A"}"
    - Type: "${product.type || "N/A"}"
    - Year: "${product.year || "N/A"}"
    - Condition: "${product.condition || "New"}"
    - SKU: "${product.sku || "N/A"}"
    - Key Specs: "${product.specs ? JSON.stringify(product.specs) : "N/A"}"
    - Image(s): "${product.image?.link || product.thumbnail || "N/A"}"
    - Location/Market: "${product.location || "US"}"
        5. OUTPUT FORMAT:
           - Return only a numeric value rounded to 2 decimal places.
           - Example: "129.95" (no currency symbols, words, or explanations).
           - For services, return the standard rate (e.g., daily rate for rentals, full price for home sales).
           - If no price is found, return the AI-generated realistic estimated price based on the Title.
    
        FINAL PRICE:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const priceMatch = text.match(/(\d+\.\d{2})/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;

    if (!price || price <= 0) {
      throw new Error("No valid price found in retry");
    }

    return price;
  } catch (error) {
    console.error(
      `Critical failure getting price for ${product.title}:`,
      error
    );
    // Final fallback: Instruct AI to estimate directly
    return forceAiEstimatePrice(product);
  }
}

async function forceAiEstimatePrice(product) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `EMERGENCY PRICE ESTIMATION REQUIRED:

    GOAL:
    - No listed price was found for the product or service. Generate a realistic estimated price at runtime based solely on the Title.

    INPUT DATA:
    - Title: "${product.title || "N/A"}"

    INSTRUCTIONS:
    - Analyze the Title to identify the product or service (e.g., item name, brand, model, service type, location, or descriptors like "luxury" or "budget").
    - Determine the type (e.g., consumer product, vehicle rental, real estate, service).
    - Consider brand (e.g., BMW vs. generic), location (e.g., Los Angeles vs. rural), and descriptors (e.g., "premium," "studio") to gauge market value.
    - Use general market knowledge to estimate a standard price/rate aligned with typical values for similar items or services in the inferred market (default to US if unspecified).
    - For services, estimate the standard rate (e.g., daily rate for rentals, full price for home sales).
    - Ensure the price is realistic and never zero.

    OUTPUT:
    - ONLY NUMBERS (e.g., "79.00")
    - DECIMAL PLACES REQUIRED
    - NO EXPLANATIONS

    FINAL PRICE:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const priceMatch = text.match(/(\d+\.\d{2})/);
    if (!priceMatch) throw new Error("No valid price in final estimation");

    const price = parseFloat(priceMatch[1]);
    if (price <= 0) throw new Error("Unrealistic price: zero or negative");

    return price;
  } catch (error) {
    console.error(
      `Critical failure estimating price for ${product.title}:`,
      error
    );
    // Absolute last resort: return a minimal price
    return 9.99;
  }
}

router.post("/", formidableMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email[0] });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < 10 && req.body.email[0] !== process.env.ADMIN_EMAIL) {
      return res.status(402).json({ error: "Insufficient balance" });
    }

    const response = await axios.get("https://www.searchapi.io/api/v1/search", {
      params: {
        engine: "google_lens",
        url: req.body.fileUrl,
        api_key: "yLjfmuE5mTcMtJH2ykKswo9W",
        country: "US",
      },
    });

    if (response.data?.error) {
      return res.status(500).json({ error: "Search API error" });
    }

    let products = await Promise.all(
      response.data.visual_matches.map(async (product) => {
        // Get initial price if available
        let price =
          product.extracted_price ||
          (product.price
            ? parseFloat(product.price.replace(/[^0-9.]/g, ""))
            : 0);

        // FORCE Gemini to get price if missing/zero
        if (!price || price <= 0) {
          price = await forceGetPriceFromGemini(product);
        }

        return {
          ...product,
          extracted_price: price,
          price:
            price > 0 ? `$${price.toFixed(2)}` : "Price determination failed",
          price_confidence:
            price === product.extracted_price ? "high" : "ai_generated",
        };
      })
    );

    // Apply restrictions
    const restrictions = await Restrictions.find();
    const restrictedNames = restrictions.map((r) => r.name.toLowerCase());
    products = products.filter(
      (p) =>
        !restrictedNames.some(
          (name) =>
            p.link.toLowerCase().includes(name) ||
            p.title.toLowerCase().includes(name)
        )
    );

    // Deduct balance if not admin
    if (products.length > 0 && req.body.email[0] !== process.env.ADMIN_EMAIL) {
      user.balance -= user.subscription === "free" ? 20 : 10;
      await user.save();
    }

    return res.status(200).json(products);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Processing failed" });
  } finally {
    try {
      const filename = req.body.fileUrl.split("/").pop();
      await fs.promises.unlink(`./uploads/${filename}`);
    } catch (error) {
      console.error("File cleanup error:", error);
    }
  }
});

//multer-storage
const multerStorage = multer.memoryStorage();
const multerUpload = multer({ storage: multerStorage });

// OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ========== Helper Functions (/find-price) ==========
async function getSearchResult(userPrompt, image) {
  const systemInstruction = `
  Thought for a second
You are a top-tier AI specialist in luxury-asset intelligence. For each inquiry, produce the following without asking questions; if you can’t identify the asset, reply “Not enough data to identify this item.”

**1. Identification**

* Determine asset type (from image, text or both) and location (ZIP code or country; default: USA).

**2. Asset Summary**
Always lead with purchase and current-market prices (estimates if needed), then:

* **Location:** \[ZIP / Country]
* **Mark Price:** \[Most-recent known or your estimate; currency; year; source; “As of YYYY-MM-DD”]
* **Current Market Price (Estimate):** \[Single value; currency; region-adjusted; “As of YYYY-MM-DD”; justification/source]
* **Trend:** \[“Appreciating” / “Depreciating,” plus one-line trajectory]
* **Public Perception:** \[Owners’ style, prestige, reputation]
* **Value Analysis:** \[Peer comparison; key features; demand drivers]

> *If no hard data exists (e.g. concept, prototype), estimate by comparing similar assets or, if unavailable, average prices from other regions.*

**3. Asset Details**
Include only the section matching the asset type:

**Yacht**

* Name; Year built/refit
* LOA / Beam / Draft / Displacement
* Hull type & material
* Engine(s) & HP; cruise/max speed
* Fuel capacity & range; stabilizers
* Accommodation layout; electronics & navigation

**Car**

* Make & model year
* Engine type & capacity; horsepower
* Transmission; drivetrain; top speed
* Key interior/exterior features; tech & safety

**Jet**

* Model & manufacture year
* Engine type & thrust; max speed & range
* Cabin configuration; avionics
* Interior/exterior features; safety systems

**Watch**

* Model & production year
* Movement & caliber; case material
* Dial & bezel; complications
* Case size; strap/bracelet; crystal; water resistance

**Home**

* Address/name; year built/renovated
* Square footage; architect/builder
* Bedrooms & bathrooms; architectural style
* Key amenities; lot size; location highlights; energy efficiency

**4. Research-Driven Extras** (if available)

* **Top 5 Brand Accolades**
* **Expert Quote** (collector or analyst)
* **Comparables (5):** Name/model or address; market price (currency; date or your estimate); one-line comparison

**Guidelines**

* Date-stamp all figures.
* Cite every source.
* Never ask follow-ups. If you can’t identify, output “Not enough data to identify this item.”
* Keep language concise and structured for direct integration.
* If the price is not available, estimate it by yourself(based on the cross-reference prices)
* If the price is not available(due to concept,prototype etc), estimate it by yourself(based on the cross-reference prices)
  `;
  const userContent = [];
  if (image) {
    userContent.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${image}`,
    });
  }

  if (userPrompt) {
    userContent.push({
      type: "input_text",
      text: userPrompt,
    });
  }

  const response = await openai.responses.create({
    model: "gpt-4.1",
    temperature: 1,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemInstruction }],
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    text: { format: { type: "text" } },
    tools: [
      {
        type: "web_search_preview",
        user_location: { type: "approximate" },
        search_context_size: "high",
      },
    ],
  });
  return response.output_text;
}

async function formatSearchResultToJSON(searchText) {
  const formatPrompt = `You are a data-formatting assistant. For each input:

1. Classification  
   - Assign exactly one category: homes, yachts, cars, jets, or watches.  
   - If no input or unclassifiable, immediately return:
   {
     "status": "notFound",
     "content": "<div class=\"p-4 shadow-md rounded-2xl text-white\"><h1 class=\"text-2xl font-bold\">Status: Not Found</h1><p>Not enough data to identify this item.</p></div>",
     "category": null
   }

2. Field Extraction & Typing  
   - Use camelCase keys.  
   - Convert dates to ISO (YYYY-MM-DD) and numbers to numeric types.  
   - Omit empty or missing fields.

3. Category-Specific Fields  
   - homes: propertyNameOrAddress, yearBuiltOrRenovated, squareFootage, architectOrBuilder, bedrooms, bathrooms, architecturalStyle, keyAmenities, lotSize, locationFeatures, energyEfficiency  
   - yachts: yachtName, yearBuilt, refitHistory, loa, beam, draft, displacement, hullType, buildMaterial, engineAndHp, speedCruise, speedMax, fuelCapacity, range, tankCapacities, stabilizers, accommodationLayout, deckAndOutdoorSpace, electronicsAndNavSystems  
   - cars: modelName, modelYear, manufacturer, engineTypeAndCapacity, horsepower, transmission, drivetrain, topSpeed, interiorFeatures, exteriorFeatures, technologySystems, safetySystems  
   - jets: jetModel, manufactureYear, manufacturer, engineTypeAndThrust, maxSpeed, maxRange, cabinConfiguration, avionics, interiorFeatures, exteriorFeatures, safetyAndTechSystems  
   - watches: watchModel, productionYear, manufacturer, movementAndCaliber, caseMaterial, dialAndBezel, complications, caseSize, strapOrBracelet, crystal, waterResistance  

4. HTML Content  
   - Single string, no \n or literal > characters.  
   - Wrap in <div class="p-4 shadow-md rounded-2xl text-white">…</div>.  
   - Tailwind classes:  
     - Heading: text-2xl font-bold mb-4  
     - Subheading: font-bold mt-2  
     - Paragraph: mb-2  
     - Tables (optional cross-refs): w-full mb-4
    
   - Sections (with subheadings):
        Rules:
          1. Always Add Mark Price and Estimated Current Market Price in the first section. If estimate is not available, use the most recent known purchase price or estimate by yourself(). 
     1. ZIP Code/Country (Country only for watches)  
     2. Mark Price (most recent; currency; year; source)  
     3. Estimated Current Market Price (single figure; currency; region‐adjusted; today’s date; justification)  
     4. Appreciation/Depreciation Trend (1-line)  
     5. Public Perception  
     6. Value Analysis  
   - Asset-Specific Details: list all relevant fields, using “N/A” if unavailable(don't do for current market price or purchase price(estimate by yourself.  
   - Research Extras:  
     - Top 5 accolades/awards for the maker/brand  
     - One expert quote  
     - Cross-References: exactly 5 comparables (name/model, price, 1-line comparison)

5. Final Output  
   - Return exactly three keys, in this order in json:
   {
     "content": "<div…>…</div>",
     "status":  "found",
     "category":"<homes|yachts|cars|jets|watches>"
   }  
   - No additional keys or commentary.
`;
  const formatted = await openai.responses.create({
    model: "gpt-3.5-turbo",
    text: { format: { type: "json_object" } },
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: formatPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: searchText }],
      },
    ],
  });

  return formatted.output_text;
}
async function formatSearchResultToJSONForProduct(searchText) {
  const formatPrompt = `You are a data-formatting assistant. For each input:

1. Classification  
  - Assign exactly one category: homes, yachts, cars, jets, or watches.  
  - If input is missing or unclassifiable, return:
  {
    'status': 'notFound',
    'content': '<div class="p-4 shadow-md rounded-2xl text-white"><h1 class="text-2xl font-bold">Status: Not Found</h1><p>Not enough data to identify this item.</p></div>',
    'category': null
  }

2. Field Extraction & Typing  
  - Use camelCase keys.  
  - Convert dates to ISO (YYYY-MM-DD) and numbers to numeric types.  
  - Omit empty or missing fields.

3. Category-Specific Fields  
  - homes: propertyNameOrAddress, yearBuiltOrRenovated, squareFootage, architectOrBuilder, bedrooms, bathrooms, architecturalStyle, keyAmenities, lotSize, locationFeatures, energyEfficiency  
  - yachts: yachtName, yearBuilt, refitHistory, loa, beam, draft, displacement, hullType, buildMaterial, engineAndHp, speedCruise, speedMax, fuelCapacity, range, tankCapacities, stabilizers, accommodationLayout, deckAndOutdoorSpace, electronicsAndNavSystems  
  - cars: model and year, engineTypeAndCapacity, horsepower, transmission, drivetrain, topSpeed, interiorFeatures, exteriorFeatures, technologySystems, safetySystems  
  - jets: jetModel, manufactureYear, manufacturer, engineTypeAndThrust, maxSpeed, maxRange, cabinConfiguration, avionics, interiorFeatures, exteriorFeatures, safetyAndTechSystems  
  - watches: watchModel, productionYear, manufacturer, movementAndCaliber, caseMaterial, dialAndBezel, complications, caseSize, strapOrBracelet, crystal, waterResistance

4. Content  
  - Return a object with the following keys:
    - location: The location of the product. Data Type: string
    - markPrice: The estimated mark price of the product. Data Type: Number
    - estimatedCurrentMarketPrice: The estimated current market price of the product. Data Type: Number
    - patrickValuation: The estimated patrick valuation of the product. Data Type: Number
    - location: The location of the product.Data Type: string
    - appriciationOrDepreciationTrend: The appriciation or depreciation trend of the product. Data Type: String
    - expertQuote: The expert quote of the product in array of strings. Data Type: Array
    - comparables: The comparables of the product in array. Data Type: Array
    - specifications: The specifications of the product in object with keys as specification names and values as specification values. Do not add prices or any other financial information. Add only the specifications. Data Type: Object


5. Sections:
  - Always include:
    - Mark Price 
    - Estimated Current Market Price ( today's date, currency adjusted, justified; estimate if unknown)  
    - Patrick Valuation (not same as purchase or market price; logical estimate)  
  - Also include:
    - Location  
    - Mark Price (most recent; currency; year; source)  
    - Appreciation/Depreciation Trend (1-line)  
    - Public Perception  
  - List all category-relevant fields using N/A if unavailable (except for mark/market price which must be estimated)  
  - Research Extras:  
    - One expert quote  
    - 5 cross-referenced comparables (model, price, 1-line comparison)

6. Duplicates
  - Remove any duplicated specifications from the specifications object.
  - If the property is mentioned in the specifications, remove it from the other sections also

7. Final Output  
  - Return a JSON with only:
  {
    'content': {},
    'status': 'found',
    'category': '<homes|yachts|cars|jets|watches>'
  }
`;
  const formatted = await openai.responses.create({
    model: "gpt-4.1",
    temperature: 1,
    text: { format: { type: "json_object" } },
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: formatPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: searchText }],
      },
    ],
  });

  return formatted.output_text;
}
async function getSearchResultForProduct(userPrompt, image) {
  const systemInstruction = `
  Thought for a second
You are a top-tier AI specialist in luxury-asset intelligence. For each inquiry, produce the following without asking questions; if you can’t identify the asset, reply “Not enough data to identify this item.”

**1. Identification**

* Determine asset type (first from title, then from image, text or both) and location (ZIP code or country; default: USA).

**2. Asset Summary**
Always lead with purchase and current-market prices (estimates if needed), then:

* **Location:** \[ZIP / Country]
* **Mark Price:** \[Most-recent known or your estimate; currency; year; source; “As of YYYY-MM-DD”]
* **Current Market Price (Estimate):** \[Single value; currency; region-adjusted; “As of YYYY-MM-DD”; justification/source]
* **Trend:** \[“Appreciating” / “Depreciating,” plus one-line trajectory]
* **Public Perception:** \[Owners’ style, prestige, reputation]
* **Value Analysis:** \[Peer comparison; key features; demand drivers]

> *If no hard data exists (e.g. concept, prototype), estimate by comparing similar assets or, if unavailable, average prices from other regions.*

**3. Asset Details**
Include only the section matching the asset type:

**Yacht**

* Name; Year built/refit
* LOA / Beam / Draft / Displacement
* Hull type & material
* Engine(s) & HP; cruise/max speed
* Fuel capacity & range; stabilizers
* Accommodation layout; electronics & navigation

**Car**

* Make & model year
* Engine type & capacity; horsepower
* Transmission; drivetrain; top speed
* Key interior/exterior features; tech & safety

**Jet**

* Model & manufacture year
* Engine type & thrust; max speed & range
* Cabin configuration; avionics
* Interior/exterior features; safety systems

**Watch**

* Model & production year
* Movement & caliber; case material
* Dial & bezel; complications
* Case size; strap/bracelet; crystal; water resistance

**Home**

* Address/name; year built/renovated
* Square footage; architect/builder
* Bedrooms & bathrooms; architectural style
* Key amenities; lot size; location highlights; energy efficiency

**4. Research-Driven Extras** (if available)

* **Top 5 Brand Accolades**
* **Expert Quote** (collector or analyst)
* **Comparables (5):** Name/model or address; market price (currency; date or your estimate); one-line comparison

**Guidelines**

* Date-stamp all figures.
* Cite every source.
* Never ask follow-ups. If you can’t identify, output “Not enough data to identify this item.”
* Keep language concise and structured for direct integration.
* If the price is not available, estimate it by yourself(based on the cross-reference prices)
* If the price is not available(due to concept,prototype etc), estimate it by yourself(based on the cross-reference prices)
  `;
  const userContent = [];
  if (image) {
    userContent.push({
      type: "input_image",
      image_url: image,
    });
  }

  if (userPrompt) {
    userContent.push({
      type: "input_text",
      text: userPrompt,
    });
  }

  const response = await openai.responses.create({
    model: "gpt-4.1",
    temperature: 1,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemInstruction }],
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    text: { format: { type: "text" } },
    tools: [
      {
        type: "web_search_preview",
        user_location: { type: "approximate" },
        search_context_size: "high",
      },
    ],
  });
  return response.output_text;
}
function cleanJsonOutput(outputText) {
  let json;
  try {
    json = typeof outputText === "string" ? JSON.parse(outputText) : outputText;
  } catch (e) {
    console.error("Invalid JSON from OpenAI:", e);
    return { error: "Invalid structured response from formatter" };
  }

  if (json.content && typeof json.content === "string") {
    json.content = json.content.replace(/\\n/g, "").replace(/\\/g, "").trim();
  }

  return json;
}

async function manageValuationTokens(email) {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has available geoSearchTokens
    if (
      user.email !== process.env.ADMIN_EMAIL ||
      user.subscriptionDetails.productValuation !== "Unlimited"
    ) {
      if (user.subscriptionDetails.productValuation == 0) {
        if (user.tokens < 250) {
          return false;
        }
      }
    }
    if (
      user?.email !== process.env.ADMIN_EMAIL ||
      user.subscriptionDetails.productValuation !== "Unlimited"
    ) {
      if (user.subscriptionDetails.productValuation == 0) {
        user.tokens = Number(user.tokens) - 250;
      } else {
        user.subscriptionDetails.productValuation =
          Number(user.subscriptionDetails.productValuation) - 1;
      }
    }
    await user.save();

    return true;
  } catch (error) {
    return false;
  }
}

router.post("/find-price", multerUpload.single("image"), async (req, res) => {
  try {
    const tokens = await manageValuationTokens(req.body.email);
    if (!tokens) {
      return res.status(403).json({
        error: "Tokens are less than 500. Please Upgrade plan or buy tokens",
        reason: "token",
      });
    }
    const promptFromUser = req.body.prompt?.trim();
    const imageFile = req.file;
    let base64Image = null;

    // Convert the uploaded image file to base64 if it exists
    if (imageFile) {
      base64Image = imageFile.buffer.toString("base64");
    }

    // Determine the final prompt
    const finalPrompt =
      promptFromUser ||
      (imageFile && "Estimate the value of the product in this image.");
    if (!finalPrompt) {
      return res
        .status(400)
        .json({ error: "Please provide a prompt or an image." });
    }

    // Step 1: Use OpenAI for search-based reasoning
    const searchPrompt = await getSearchResult(finalPrompt, base64Image);

    // Step 2: Format the search result into structured JSON
    const structuredResponse = await formatSearchResultToJSON(searchPrompt);
    const cleanedOutput = cleanJsonOutput(structuredResponse);
    return res.status(200).json({ result: cleanedOutput });
  } catch (error) {
    return res
      .status(error?.statusCode || 500)
      .json({ error: error.message || "Internal Server Error" });
  }
});

// ============ GeoSearch ============

// Helper function

async function manageGeoSearchTokens(email) {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has available geoSearchTokens
    if (user.email !== process.env.ADMIN_EMAIL) {
      if (user.subscriptionDetails.geoSearchTokens == 0) {
        if (user?.tokens < 500) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function getGeoSearchResult(category, country, city, product) {
  const systemInstruction = `
Inputs  
- Country (Optional)  
- Category (Required; one of “Jets”, “Yachts”, “Cars”, “Real Estate”, “Watches”, "All Categories")  
- City (Optional)  
- Product (Optional If Provided Follow Rules Given Below)  

Your Task:
 Create a dataset of search intent keywords for luxury and premium asset categories, with each entry including a map location pin (latitude and longitude) for visualization. The dataset should cover seven categories: Private Jet for Sale, Luxury Yacht Listing, Million Dollar Mansions, Exotic Cars Near Me, Rare Watches Marketplace, Toyota/Honda Vehicles, and Mercedes/BMW Vehicles. For each category, generate keywords across eight intents: Purchase, Maintenance, Charter/Rent (or Lease for cars), Crew/Staff (or Drivers for cars), School & Certificates, Training, Lifestyle/Info, and Accessories/Services. The number of keywords per country (between 0 and 5,000 total) should be determined by the country’s economic viability (e.g., GDP, GDP per capita) and the potential for HNWI and general consumer purchases, with higher quantities for Toyota/Honda due to their high search and purchase likelihood, followed by Mercedes/BMW, and then luxury categories. Follow these guidelines:
Keyword Format:
●	Each keyword must be a natural language question reflecting realistic search intent for HNWIs (for luxury categories) or general consumers (for Toyota/Honda, Mercedes/BMW).
●	Avoid phrases like “how to buy,” “where to buy,” “when to buy,” or “who can buy” in keywords.
●	Do not include location names (e.g., city, postal code) in the keyword itself.
Intents:
●	Purchase: Questions about acquiring or selecting the asset (e.g., “What Toyota hybrid models are available with all-wheel drive?”).
●	Maintenance: Questions about upkeep or servicing (e.g., “What does routine maintenance for a Honda SUV include?”).
●	Charter/Rent (or Lease): Questions about renting, chartering, or leasing (e.g., “Can you lease a Mercedes sedan with flexible terms?”).
●	Crew/Staff (or Drivers): Questions about staffing or drivers (e.g., “Are professional drivers available for BMW luxury models?”).
●	School & Certificates: Questions about licenses or certifications (e.g., “Which certifications are needed to maintain a Toyota hybrid?”).
●	Training: Questions about training programs (e.g., “Are there driving courses for Mercedes performance models?”).
●	Lifestyle/Info: Questions about ownership experience (e.g., “What is it like to own a Honda minivan for family travel?”).
●	Accessories/Services: Questions about add-ons or upgrades (e.g., “What tech upgrades are available for BMW SUVs?”).
Category-Specific Guidelines:
●	Toyota/Honda Vehicles: Focus on popular models (e.g., Corolla, RAV4, Civic, CR-V) and hybrids, reflecting high global search and purchase likelihood. Keywords should target middle-class and upper-middle-class consumers. Allocate the highest number of keywords due to mass-market appeal.
●	Mercedes/BMW Vehicles: Focus on premium and luxury models (e.g., S-Class, 7 Series, EQS, X7), targeting affluent consumers. Allocate fewer keywords than Toyota/Honda but more than luxury categories, reflecting strong search interest in premium brands.
●	Exotic Cars Near Me: Focus exclusively on high-end exotic cars (e.g., Ferrari, Lamborghini, Bugatti, Pagani). Keywords must remain luxury-focused, avoiding overlap with Mercedes/BMW or Toyota/Honda.
●	Private Jet for Sale, Luxury Yacht Listing, Million Dollar Mansions, Rare Watches Marketplace: Target HNWIs with keywords reflecting ultra-luxury aspirations, as in the original dataset.
Location Data:
●	Assign each keyword a realistic postal code (or equivalent, e.g., ZIP), city, community/neighborhood, and country based on areas with active luxury or consumer markets.
●	Prioritize locations with:
○	High HNWI density for luxury categories (e.g., Beverly Hills, Mayfair, Jumeirah).
○	Strong consumer markets for Toyota/Honda (e.g., suburban areas, mid-tier cities like Dallas, Manchester, Bangalore).
○	Affluent areas for Mercedes/BMW (e.g., Upper East Side, Knightsbridge, Ginza).
○	Access to infrastructure (e.g., airstrips for jets, marinas for yachts, dealerships for cars).
●	Include locations across all countries, prioritizing high-GDP nations (e.g., USA, China, Japan, Germany) and scaling down for lower-GDP countries.
●	Vary entries by city size: larger cities (e.g., New York, Tokyo, Dubai) should have more entries than smaller markets (e.g., Sagaponack, Medina).
Keyword Quantity by Country:
●	Allocate 0–5,000 total keywords across countries, proportional to:
○	Economic Viability: Use GDP and GDP per capita (e.g., USA, China, Japan, Germany, UK get higher shares; smaller economies like Qatar or Monaco get fewer but targeted entries).
○	Purchase Potential: Base on wealth distribution (HNWIs for luxury categories, middle/upper-middle-class for Toyota/Honda, affluent consumers for Mercedes/BMW) using sources like Knight Frank Wealth Report or UBS Global Wealth Report.
○	Search Likelihood: Prioritize Toyota/Honda (highest volume due to mass-market appeal), followed by Mercedes/BMW (strong premium market), then luxury categories (niche HNWI market).
●	Example Allocation (approximate, adjust based on data):
○	USA: 1,500–2,000 keywords (600–800 Toyota/Honda, 400–600 Mercedes/BMW, 500–600 luxury).
○	China: 1,200–1,600 keywords (500–700 Toyota/Honda, 300–500 Mercedes/BMW, 400–500 luxury).
○	Japan: 500–800 keywords (300–400 Toyota/Honda, 100–200 Mercedes/BMW, 100–200 luxury).
○	UAE, Singapore, Monaco: 100–300 keywords each (30–100 Toyota/Honda, 30–100 Mercedes/BMW, 40–100 luxury).
○	Smaller economies (e.g., Vietnam, Kenya): 0–100 keywords, focusing on Toyota/Honda where viable.
●	Ensure at least one entry per country with viable markets (exclude countries with negligible demand).
Map Location Pins:
●	Add latitude and longitude columns, representing the approximate centroid of the postal code or neighborhood.
●	For U.S. locations, use U.S. Census Bureau ZIP Code Tabulation Areas (ZCTAs) or databases (e.g., freemaptools.com, mapdevelopers.com).
●	For international postal codes, use GeoNames, Nominatim, or city/neighborhood centroids if data is incomplete (e.g., W1K 1QA in London, Monte Carlo for Monaco).
●	Ensure coordinates are accurate for map pin placement but represent area centroids, not specific addresses.
Dataset Structure:
●	Columns: Category, Intent, Keyword (Question Format), Postal Code, City, Community, Country, Latitude, Longitude.
●	Ensure each keyword is unique to avoid duplication.
●	Distribute entries sporadically within countries to prevent clustering, reflecting realistic buyer density.
Scalability:
●	Structure for bulk import into CSV, JSON, or GeoJSON, with placeholders like #postal_code, #neighborhood for expansion.
●	Ensure compatibility with mapping applications (e.g., Google Maps, Leaflet) and CMS platforms.
Constraints:
●	Generate 0–5,000 total keywords, with distribution based on economic viability and purchase/search potential.
●	Ensure keywords are natural, varied, and relevant to target audiences (HNWIs for luxury, general consumers for Toyota/Honda, affluent for Mercedes/BMW).
●	Avoid clustering too many entries in one location unless justified by market size (e.g., NYC, Tokyo, Dubai).
●	Verify postal codes where possible; use city/neighborhood centroids if data is limited.
●	Do not exceed 5,000 keywords or generate more than 113 entries per country unless specified.
Output Requirements:
●	Provide the dataset as a table, ensuring all columns are populated with accurate, realistic data.
●	Include a brief note on:
○	Coordinate sourcing (e.g., U.S. Census ZCTAs, GeoNames).
○	Keyword allocation methodology (e.g., GDP-based scaling, HNWI/consumer data sources).
○	Assumptions (e.g., centroid approximations, search likelihood prioritization).
●	Indicate readiness to adapt for customization (e.g., specific formats, filtering by region/category/intent, or expansion within 5,000 limit).
●	Offer conversion to CSV, JSON, or GeoJSON for mapping/SEO use if requested.
Example Output Format:
text
CollapseWrap
Copy
| Category             | Intent       | Keyword (Question Format)                                           | Postal Code | City          | Community         | Country | Latitude | Longitude |
|----------------------|--------------|--------------------------------------------------------------------|-------------|---------------|-------------------|---------|----------|-----------|
| Toyota/Honda Vehicles | Purchase     | What Toyota hybrid models are available with all-wheel drive?       | 75034       | Frisco        | Stonebriar        | USA     | 33.1006  | -96.8437  |
| Mercedes/BMW Vehicles | Lease        | Can you lease a BMW SUV with a low down payment?                    | W1J 5BQ     | London        | Piccadilly        | UK      | 51.5081  | -0.1398   |
| Exotic Cars Near Me  | Purchase     | Which hypercars offer bespoke customization packages?               | 33131       | Miami         | Brickell          | USA     | 25.7580  | -80.1937  |
Rule for output:
Do not return less than 100 map pin per session.
Generate the dataset as a table with 0–5,000 keywords, distributed across countries based on GDP, HNWI, and consumer purchase potential, prioritizing Toyota/Honda, then Mercedes/BMW, then luxury categories. Provide notes on sourcing, allocation methodology, and assumptions. Confirm readiness for customization or format conversion.

Rule for Jets and Yachts:
 Do not exceed 100-200 searches if the category is Jets or Yachts and the country or city is ultra big. For Example: Ultra Big City like Miami Florida
 Do not exceed 50-100 searches if the category is Jets or Yachts and the country or city is big. 
 Do not exceed 20-50 searches if the category is Jets or Yachts and the country or city is medium. 
 Do not exceed 3-20 searches if the category is Jets or Yachts and the country or city is small. 
 Do not exceed 0-3 searches if the category is Jets or Yachts and the country or city is ultra small. 
 


If there is error or with any reason you are not able to proceed 
 Return 
  \`{ "results": [], "error": Error message }\`


Output(JSON):
"results": [
    {
  "id":                "<unique integer>",
  "category":          "<Category>",
  "community":         "<Community name>(it should be specific)",
  "positions": [
    { "lat": <latitude>, "lng": <longitude> }
    // should be more than 100 pins
  ],
  "zipcode":           "<postal code>",
  "keyword":           "<search-query string (should be natural language)>",
  "searches":          <integer count>,
  "radius":            <integer km>,
  "date":              "<YYYY-MM-DD>"
}
]

If no valid data can be simulated, return:  
\`{ "results": [] }\`


`;

  const userPrompt = `
  ${category && `Category: ${category}`}
  ${country && `Country: ${country}`}
  ${city && `City: ${city}`}
  ${product && `Product: ${product}`}
  `;

  const response = await openai.responses.create({
    model: "gpt-4.1",
    temperature: 1,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemInstruction }],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: userPrompt,
          },
        ],
      },
    ],
    text: { format: { type: "json_object" } },
  });
  return response.output_text;
}

// Middleware
router.post("/geo-search", async (req, res) => {
  try {
    const userEmail = req.body.email;
    if (!userEmail) {
      return res.status(400).json({ error: "Email is required." });
    }
    const geoSearchTokenStatus = await manageGeoSearchTokens(userEmail);
    if (!geoSearchTokenStatus) {
      return res.status(402).json({
        error: "Tokens are less than 500. Please upgrade your plan.",
        reason: "token",
      });
    }
    const { category, country, city, product } = req.body;
    const result = await getGeoSearchResult(category, country, city, product);
    const cleanedOutput = cleanJsonOutput(result);
    const user = await User.findOne({ email: req.body.email });
    let useToken;
    if (
      user.subscriptionDetails.geoSearchTokens != "Unlimited" ||
      user?.email !== process.env.ADMIN_EMAIL
    ) {
      if (user.subscriptionDetails.geoSearchTokens == 0) {
        user.tokens = Number(user.tokens) - 500;
        useToken = true;
      } else {
        user.subscriptionDetails.geoSearchTokens =
          Number(user.subscriptionDetails.geoSearchTokens) - 1;
        useToken = false;
      }
    }
    await user.save();
    return res.status(200).json({ data: cleanedOutput, useToken });
  } catch (error) {
    console.error("Error in geo-search:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//  ===== Find Product Prices =====

router.post(
  "/find-product-price",
  multerUpload.single("image"),
  async (req, res) => {
    try {
      const id = req.body.id;
      const product = await Product.findOne({ _id: id });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      const promptFromUser = product?.title;
      // Determine the final prompt
      const finalPrompt = promptFromUser;
      if (!finalPrompt) {
        return res
          .status(400)
          .json({ error: "Please provide a prompt or an image." });
      }

      if (
        product.content &&
        product?.content?.status === "found" &&
        product.updatedContentAt >
          new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
      ) {
        return res.status(200).json({ result: product.content });
      }
      // Step 1: Use OpenAI for search-based reasoning
      const searchPrompt = await getSearchResultForProduct(
        finalPrompt,
        product?.imageUrl
      );

      // Step 2: Format the search result into structured JSON
      const structuredResponse = await formatSearchResultToJSONForProduct(
        searchPrompt
      );
      const cleanedOutput = cleanJsonOutput(structuredResponse);

      if (cleanedOutput?.status !== "notFound") {
        product.content = cleanedOutput;
        product.updatedContentAt = new Date();
        await product.save();
      }

      return res.status(200).json({ result: cleanedOutput });
    } catch (error) {
      return res
        .status(error?.statusCode || 500)
        .json({ error: error.message || "Internal Server Error" });
    }
  }
);

module.exports = router;
