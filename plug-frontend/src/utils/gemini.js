// src/utils/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI('AIzaSyCAGTnmPKPHYrrp6yVGttiZvNiami_8V8w');

export async function generateMockSearchData(category, country) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    Generate realistic mock search data for luxury ${category} in ${country} with the following structure:
    - Return only a JSON array
    - Each item should have: id, position (lat/lng), keyword, area, searches (10-50), city, zipcode, community
    - Include 50-70 varied locations within the country
    - Make keywords specific to luxury ${category} searches
    - For coordinates, use realistic locations within the country
    
    Example format:
    [{
      "id": 1,
      "position": { "lat": 34.0522, "lng": -118.2437 },
      "keyword": "Luxury yacht charter",
      "area": "Marina del Rey",
      "searches": 25,
      "country": "United States",
      "city": "Los Angeles",
      "zipcode": "90292",
      "community": "Marina del Rey",
      "radius": 2500
    }]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean the response (Gemini sometimes adds markdown syntax)
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generating data with Gemini:", error);
    return []; // Fallback to empty array
  }
}