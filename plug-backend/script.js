// const mongoose = ('mongoose');
// const axios = require('axios');
// const cheerio = require('cheerio');
// require('dotenv').config();

const axios = require("axios");



// // Fetch HTML content from URL
// async function fetchHtml(url) {
//   try {
//     const response = await axios.get(url, {
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
//       }
//     });
//     return response.data;
//   } catch (error) {
//     console.error(`Error fetching URL ${url}:`, error.message);
//     return null;
//   }
// }

// // Extract relevant data from HTML
// function extractDataFromHtml(html, url) {
//   const $ = cheerio.load(html);
  
//   // Basic data extraction - this will vary based on the website structure
//   const title = $('h1').first().text().trim();
//   const priceText = $('[itemprop="price"]').attr('content') || 
//                     $('.price').first().text().trim();
//   const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
//   const imageUrl = $('[itemprop="image"]').attr('src') || 
//                    $('img.product-image').first().attr('src');
  
//   // Get all text content for GPT processing
//   const allText = $('body').text().replace(/\s+/g, ' ').trim();
  
//   return {
//     url,
//     title,
//     price,
//     imageUrl,
//     rawText: allText
//   };
// }

// // Process data with GPT API
// async function processWithGpt(rawData) {
//   const prompt = `
//   Extract product information from the following data and return it in JSON format with these fields:
//   - productId (generate a unique ID based on product name)
//   - title
//   - price (as number)
//   - imageUrl
//   - seller
//   - category
//   - subcategory
//   - description (concise product description)
//   - colors (array of available colors if mentioned)
//   - sizes (array of available sizes if mentioned)
//   - images (array of additional image URLs if available)
  
//   Here is the raw data to process:
//   ${JSON.stringify(rawData, null, 2)}
  
//   Return ONLY the JSON object, no additional text or explanation.
//   `;

//   try {
//     const response = await axios.post(
//       'https://api.openai.com/v1/chat/completions',
//       {
//         model: 'gpt-4', // or 'gpt-3.5-turbo' for faster/cheaper processing
//         messages: [
//           {
//             role: 'system',
//             content: 'You are a helpful assistant that extracts product information from raw data and returns structured JSON.'
//           },
//           {
//             role: 'user',
//             content: prompt
//           }
//         ],
//         temperature: 0.3,
//         max_tokens: 2000
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     const content = response.data.choices[0].message.content;
//     // Extract JSON from the response (GPT might wrap it in markdown)
//     const jsonMatch = content.match(/\{[\s\S]*\}/);
//     if (!jsonMatch) {
//       throw new Error('No JSON found in GPT response');
//     }
    
//     return JSON.parse(jsonMatch[0]);
//   } catch (error) {
//     console.error('Error processing with GPT:', error.message);
//     return null;
//   }
// }

// // Save product to database
// async function saveProduct(productData) {
//   try {
//     // Add additional fields
//     const completeProduct = {
//       ...productData,
//       detailUrl: productData.url,
//       withVendor: [{
//         imageUrl: productData.imageUrl,
//         sourceUrl: productData.url
//       }],
//       createdAt: new Date(),
//       savedBy: 'admin'
//     };

   
//     console.log(`Product saved: ${completeProduct}`);
//     return product;
//   } catch (error) {
//     if (error.code === 11000) {
//       console.log(`Product already exists: ${productData.title}`);
//     } else {
//       console.error('Error saving product:', error.message);
//     }
//     return null;
//   }
// }

// // Main function to process product URLs
// async function processProductUrls(urls) {
// //   await connectToDatabase();
  
//   for (const url of urls) {
//     try {
//       console.log(`Processing URL: ${url}`);
      
//       // Step 1: Fetch HTML
//       const html = await fetchHtml(url);
//       if (!html) continue;
      
//       // Step 2: Extract basic data
//       const rawData = extractDataFromHtml(html, url);
      
//       // Step 3: Process with GPT
//       const processedData = await processWithGpt(rawData);
//       if (!processedData) continue;
      
//       // Step 4: Save to database
//       await saveProduct(processedData);
      
//     } catch (error) {
//       console.error(`Error processing URL ${url}:`, error.message);
//     }
//   }
  
//  // mongoose.disconnect();
//   console.log('Processing complete');
// }

// // Example usage
// const productUrls = [
//   'https://example.com/product1',
//   'https://example.com/product2'
//   // Add your product URLs here
// ];

// // Start processing
// processProductUrls(productUrls).catch(console.error);




// const axios = require('axios');
// const cheerio = require('cheerio');

// // Schema structure (for reference, without Mongoose)
// const productSchema = {
//   productId: { type: String, unique: true },
//   title: { type: String, required: true },
//   price: { type: Number },
//   imageUrl: { type: String },
//   withVendor: [{ imageUrl: { type: String }, sourceUrl: { type: String } }],
//   seller: { type: String },
//   shopId: { type: String },
//   detailUrl: { type: String },
//   category: { type: String },
//   subcategory: { type: String },
//   description: { type: String },
//   colors: { type: Array },
//   sizes: { type: Array },
//   images: { type: Array },
//   createdAt: { type: Date, default: Date.now },
//   isActive: { type: Boolean, default: true },
//   savedBy: { type: String, default: "admin" }
// };

// // Function to fetch data using Oxylabs Web Scraper API
// async function fetchDataWithOxylabs(url) {
//   const username = 'sbangash184@gmail.com'; // Replace with your Oxylabs username
//   const password = ' icDb2EPBKhZMvLb'; // Replace with your Oxylabs password
//   const apiUrl = 'https://realtime.oxylabs.io/v1/queries';

//   const payload = {
//     source: 'universal', // Use 'universal' for any website
//     url: url,
//     geo_location: 'United States', // Optional: adjust as needed
//     render: 'html', // Ensure JavaScript-rendered HTML is returned
//     parse: false // Get raw HTML (set to true if structured JSON is available)
//   };

//   try {
//     const response = await axios.post(apiUrl, payload, {
//       auth: { username, password },
//       headers: { 'Content-Type': 'application/json', Authorization:
//         "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
//  }
//     });

//     const result = response.data.results[0];
//     return result.content; // Raw HTML content
//   } catch (error) {
//     console.error('Error fetching data with Oxylabs:', error.message);
//     throw error;
//   }
// }

// // Function to process Oxylabs response into your schema
// function processOxylabsData(data, url) {
//   const $ = cheerio.load(data);

//   const productId = url.match(/\/([^\/]+)\/?$/)?.[1] || '';
//   const title = $('h1').first().text().trim() || $('title').text().trim();
//   const price = $('*[class*="price"], *[id*="price"]').text().replace(/[^0-9.]/g, '') || '';
//   const mainImage = $('img').first().attr('src') || '';
//   const images = $('img').map((i, el) => $(el).attr('src')).get().filter(src => src);
//   const sizes = $('*[class*="size"], *[id*="size"]').map((i, el) => $(el).text().trim()).get().filter(Boolean);
//   const isActive = data.toLowerCase().includes('for sale') || data.toLowerCase().includes('in stock');

//   return {
//     productId,
//     title,
//     price: price ? parseFloat(price) : null,
//     imageUrl: mainImage,
//     withVendor: [{ imageUrl: mainImage, sourceUrl: url }],
//     seller: 'Unknown', // Infer or set manually
//     shopId: 'generic_001', // Hypothetical; adjust as needed
//     detailUrl: url,
//     category: 'Unknown', // Infer from context or site
//     subcategory: 'Unknown',
//     description: $('meta[name="description"]').attr('content') || $('p').first().text().trim() || '',
//     colors: [],
//     sizes,
//     images,
//     createdAt: new Date(),
//     isActive,
//     savedBy: 'admin'
//   };
// }

// // Main function to process a URL and return data
// async function processProduct(url) {
//   try {
//     const rawData = await fetchDataWithOxylabs(url);
//     const extractedData = processOxylabsData(rawData, url);
//     console.log('Product processed successfully:', extractedData.title);
//     return extractedData;
//   } catch (error) {
//     console.error('Error processing product:', error.message);
//     return null;
//   }
// }

// // Example usage
// const productUrl = 'https://www.zillow.com/homedetails/5100-Park-Ln-Dallas-TX-75220/96509507_zpid/';
// processProduct(productUrl)
//   .then(data => console.log('Extracted Data:', data))
//   .catch(err => console.error('Process failed:', err));



// import fetch from 'node-fetch';

// const username = 'Valuevault_ax99C';
// const password = '1414Peaceful1';
// const body = {
//  'source': 'universal',
//  'url': 'https://www.zillow.com/homedetails/5100-Park-Ln-Dallas-TX-75220/96509507_zpid/',
// };
// const response = await fetch('https://realtime.oxylabs.io/v1/queries', {
//   method: 'post',
//   body: JSON.stringify(body),
//   headers: {
//       'Content-Type': 'application/json',
//       'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
//   }
// });

// console.log(await response.json());


//support@dashmee.com , password @1414Peaceful1

// const username = 'valuevault_YZucD'; // Your Oxylabs username
// const password = '=1414Peaceful1'; // Your Oxylabs password
// const apiUrl = 'https://realtime.oxylabs.io/v1/queries';
// const cheerio = require('cheerio');

// // Replace with your actual xAI Grok API key
// const GROK_API_KEY = 'xai-DK9QzaqIEEIYSMLHpcX4EisWZD6g5Y8daKkp3U9zTEheoCeqsnVJWAfU48AIvZpoYlIdPLpUx5JFKOoH';
// const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// // Function to call Grok API for field extraction
// async function extractFieldsWithGrok(htmlContent, targetUrl) {
//   try {
//     const prompt = `
//       Given this HTML content from ${targetUrl}, extract the following fields and return them in **valid JSON format only** (no additional text or explanations, just the JSON object):
//       - productId (unique identifier)
//       - title (main title or heading)
//       - price (numeric value, remove currency symbols)
//       - imageUrl (main image URL)
//       - withVendor (array of objects with imageUrl and sourceUrl)
//       - seller (seller name)
//       - shopId (shop identifier)
//       - detailUrl (URL of the detail page)
//       - category (main category)
//       - subcategory (sub category)
//       - description (text description)
//       - colors (array of color options)
//       - sizes (array of size options)
//       - images (array of image URLs)
//       - createdAt (current timestamp)

//       HTML Content:
//       ${htmlContent.slice(0, 4000)}
//     `;

//     const response = await axios.post(
//       GROK_API_URL,
//       {
//         model: 'grok-2', // or 'grok-3' if available
//         messages: [
//           { role: 'system', content: 'You are an expert data extractor.' },
//           { role: 'user', content: prompt }
//         ],
//         temperature: 0.2,
//         max_tokens: 1000
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${GROK_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     const rawContent = response.data.choices[0].message.content;
//     console.log('Raw Grok API Response:', rawContent); // Log for debugging

//     // Extract JSON from the response if it’s wrapped in text
//     const jsonMatch = rawContent.match(/\{[\s\S]*\}/); // Match the first JSON object
//     if (!jsonMatch) {
//       throw new Error('No valid JSON found in Grok response');
//     }

//     const result = JSON.parse(jsonMatch[0]); // Parse the extracted JSON
//     result.createdAt = new Date(); // Add timestamp locally
//     return result;
//   } catch (error) {
//     console.error('Grok API Error:', error.message);
//     throw error;
//   }
// }

// // Main scraping function
// async function scrapeWebsite(targetUrl, renderJavascript = false) {
//   try {
//     const response = await axios.post(
//       apiUrl,
//       {
//         source: 'universal',
//         url: targetUrl,
//         ...(renderJavascript && { render: 'html' }),
//         context: [
//           { key: 'geo_location', value: 'United States' },
//           { key: 'user_agent_type', value: 'desktop_chrome' }
//         ]
//       },
//       {
//         auth: { username, password },
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         }
//       }
//     );

//     const htmlContent = response.data.results[0].content;
//     const productData = await extractFieldsWithGrok(htmlContent, targetUrl);
    
//     console.log('Extracted Product Data:', JSON.stringify(productData, null, 2));
//     return productData;

//   } catch (error) {
//     console.error('Scraping Error:', error.response ? error.response.data : error.message);
//     throw error;
//   }
// }

// // Example usage
// const targetUrl = 'https://www.zillow.com/homedetails/5100-Park-Ln-Dallas-TX-75220/96509507_zpid/';
// const needsJsRendering = true;

// scrapeWebsite(targetUrl, needsJsRendering)
//   .then(() => console.log('Scraping completed successfully'))
//   .catch(error => console.error('Scraping failed:', error));



const https = require("https");

// Oxylabs credentials
const USERNAME = "valuevault_YZucD";
const PASSWORD = "=1414Peaceful1";

// OxyCopilot API endpoint
const OXYCOPILOT_API = "https://api.oxylabs.io/v1/oxycopilot";

// Target URL to scrape
const targetUrl = "https://www.zillow.com/homedetails/5100-Park-Ln-Dallas-TX-75220/96509507_zpid/";

// Define the fields to extract
const payload = {
  url: targetUrl,
  parser: "auto", // OxyCopilot AI automatically detects data
  fields: {
    productId: "string",
    title: "string",
    price: "number",
    imageUrl: "string",
    withVendor: [
      {
        imageUrl: "string",
        sourceUrl: "string",
      },
    ],
    seller: "string",
    shopId: "string",
    detailUrl: "string",
    category: "string",
    subcategory: "string",
    description: "string",
    colors: "array",
    sizes: "array",
    images: "array",
    createdAt: "date",
  },
};

// Function to scrape product data
async function scrapeProductData() {
  try {
    const response = await axios.post(OXYCOPILOT_API, payload, {
      auth: {
        username: USERNAME,
        password: PASSWORD,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Handles SSL issues
    });

    console.log("Scraped Data:", response.data);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
}

// Run the scraper
scrapeProductData();
