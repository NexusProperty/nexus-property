"/**
 * Test script for the enhanced report generation
 * 
 * This script tests the enhanced report generation with branding and CoreLogic data
 * 
 * Usage: node test-enhanced-report.js [appraisalId]
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Get the appraisal ID from command line arguments or use a default
const appraisalId = process.argv[2] || 'test-appraisal-id';

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define test branding configuration
const testBrandingConfig = {
  colors: {
    primary: '#E53E3E',
    secondary: '#FC8181',
    accent: '#FFF5F5',
    textPrimary: '#1A202C',
    textSecondary: '#718096',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F7FAFC',
  },
  logo: 'https://via.placeholder.com/200x80?text=Test+Agency',
  fonts: {
    primaryFont: 'Arial, sans-serif',
    headingFont: 'Georgia, serif',
  },
  disclaimer: 'This is a test disclaimer for the agency. All rights reserved.',
  contactDetails: 'Phone: 123-456-7890 | Email: test@example.com',
  agentPhoto: 'https://via.placeholder.com/150x150?text=Test+Agent',
};

// Function to test the report generation
async function testReportGeneration() {
  try {
    console.log(`Testing enhanced report generation for appraisal ID: ${appraisalId}`);

    // Get auth token for API requests
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }

    if (!session) {
      throw new Error('No active session found. Please login first.');
    }

    const token = session.access_token;

    // Request parameters
    const requestData = {
      appraisalId,
      brandingConfig: testBrandingConfig,
      preview: true, // Generate preview instead of saving to storage
      includeAIContent: true,
      includeCoreLogicData: true,
      includeREINZData: true,
    };

    // Call the report generation endpoint
    console.log('Calling report generation endpoint...');
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate report: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Get the content type
    const contentType = response.headers.get('content-type');

    if (contentType === 'application/pdf') {
      // For PDF responses (preview mode)
      console.log('Received PDF response. Saving to file...');
      const buffer = await response.arrayBuffer();
      const outputPath = path.join(process.cwd(), `test-report-${appraisalId}.pdf`);
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      console.log(`Report saved to: ${outputPath}`);
    } else {
      // For JSON responses (normal mode)
      const data = await response.json();
      console.log('Report generation response:', data);
      
      if (data.success && data.data.downloadUrl) {
        console.log(`Report available for download at: ${data.data.downloadUrl}`);
      }
    }

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error testing report generation:', error);
    process.exit(1);
  }
}

// Run the test
testReportGeneration();" 
