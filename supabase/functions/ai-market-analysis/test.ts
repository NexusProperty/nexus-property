// Test script for ai-market-analysis function
// This script tests the Google Vertex AI/Gemini integration directly

// Import the function to test
import { generateMarketAnalysis } from './test-util.ts';

// Mock request data
const testRequest = {
  appraisalId: "test-appraisal-1",
  propertyType: "House",
  suburb: "Ponsonby",
  city: "Auckland",
  marketTrends: {
    medianPrice: 1250000,
    annualGrowth: 4.5,
    salesVolume: 78,
    daysOnMarket: 25
  },
  recentSales: [
    { price: 1350000, date: "2023-10-15" },
    { price: 1190000, date: "2023-11-02" },
    { price: 1275000, date: "2023-09-20" }
  ]
};

// Run the test
async function runTest() {
  console.log("Testing AI Market Analysis with Google Vertex AI/Gemini...");
  console.log("Request:", JSON.stringify(testRequest, null, 2));
  
  try {
    const result = await generateMarketAnalysis(testRequest);
    
    console.log("\nResponse:");
    console.log(JSON.stringify(result, null, 2));
    
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Execute the test
runTest(); 