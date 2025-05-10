// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/hello_world

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the structure for the report data
interface ReportData {
  appraisal: {
    id: string;
    property_address: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    land_size: number;
    created_at: string;
    status: string;
    estimated_value_min: number;
    estimated_value_max: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    agent_id?: string;
    claimed_at?: string;
    completed_at?: string;
    final_value?: number;
    agent_notes?: string;
    completion_notes?: string;
    property_details?: any;
    report_url?: string | null;
    customer_id?: string | null;
    comparable_properties?: any[] | null;
    market_analysis?: any | null;
  };
  agent?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    company_name: string;
    logo_url?: string;
    address?: string;
    website?: string;
  };
}

// Function to generate the HTML template for the report
function generateReportHTML(data: ReportData, isFullAppraisal: boolean): string {
  const { appraisal, agent } = data;
  const propertyDetails = appraisal.property_details || {};
  const marketAnalysis = appraisal.market_analysis || {};
  const comparableProperties = appraisal.comparable_properties || [];
  
  // Format dates
  const createdDate = new Date(appraisal.created_at).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const completedDate = appraisal.completed_at 
    ? new Date(appraisal.completed_at).toLocaleDateString('en-NZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Not completed';
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Generate the HTML template
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Appraisal Report - ${appraisal.property_address}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
    }
    .logo {
      max-width: 200px;
      margin-bottom: 10px;
    }
    .agent-info {
      margin-top: 10px;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .property-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .property-detail {
      margin-bottom: 5px;
    }
    .property-detail-label {
      font-weight: bold;
    }
    .value-range {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      text-align: center;
      margin: 20px 0;
    }
    .comparable {
      margin-bottom: 20px;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 5px;
    }
    .comparable-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .comparable-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      font-size: 14px;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    .disclaimer {
      font-size: 12px;
      color: #6b7280;
      margin-top: 30px;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 5px;
    }
    ${isFullAppraisal ? `
    .market-analysis {
      margin-bottom: 20px;
    }
    .value-factors {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .value-factor-section {
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 5px;
    }
    .value-factor-title {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .value-factor-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
    .value-factor-item {
      margin-bottom: 5px;
      padding-left: 20px;
      position: relative;
    }
    .value-factor-item:before {
      content: "•";
      position: absolute;
      left: 0;
    }
    .positive:before {
      color: #10b981;
    }
    .negative:before {
      color: #ef4444;
    }
    ` : ''}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${agent?.logo_url ? `<img src="${agent.logo_url}" alt="${agent.company_name}" class="logo">` : ''}
      <h1>Property Appraisal Report</h1>
      <div class="agent-info">
        ${agent ? `
        <p>${agent.full_name}</p>
        <p>${agent.company_name}</p>
        <p>${agent.phone} | ${agent.email}</p>
        ${agent.website ? `<p>${agent.website}</p>` : ''}
        ` : ''}
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Property Information</div>
      <h2>${appraisal.property_address}</h2>
      <div class="property-details">
        <div class="property-detail">
          <span class="property-detail-label">Property Type:</span> ${appraisal.property_type}
        </div>
        <div class="property-detail">
          <span class="property-detail-label">Bedrooms:</span> ${appraisal.bedrooms}
        </div>
        <div class="property-detail">
          <span class="property-detail-label">Bathrooms:</span> ${appraisal.bathrooms}
        </div>
        <div class="property-detail">
          <span class="property-detail-label">Land Size:</span> ${appraisal.land_size} m²
        </div>
        ${propertyDetails.yearBuilt ? `
        <div class="property-detail">
          <span class="property-detail-label">Year Built:</span> ${propertyDetails.yearBuilt}
        </div>
        ` : ''}
        ${propertyDetails.title ? `
        <div class="property-detail">
          <span class="property-detail-label">Title:</span> ${propertyDetails.title}
        </div>
        ` : ''}
        ${propertyDetails.zoning ? `
        <div class="property-detail">
          <span class="property-detail-label">Zoning:</span> ${propertyDetails.zoning}
        </div>
        ` : ''}
        ${propertyDetails.council ? `
        <div class="property-detail">
          <span class="property-detail-label">Council:</span> ${propertyDetails.council}
        </div>
        ` : ''}
      </div>
      
      ${propertyDetails.description ? `
      <div class="section">
        <div class="section-title">Property Description</div>
        <p>${propertyDetails.description}</p>
      </div>
      ` : ''}
    </div>
    
    <div class="section">
      <div class="section-title">Valuation</div>
      <div class="value-range">
        ${formatCurrency(appraisal.estimated_value_min)} - ${formatCurrency(appraisal.estimated_value_max)}
      </div>
      ${appraisal.final_value ? `
      <p><strong>Final Value:</strong> ${formatCurrency(appraisal.final_value)}</p>
      ` : ''}
    </div>
    
    ${isFullAppraisal && marketAnalysis.analysisText ? `
    <div class="section">
      <div class="section-title">Market Analysis</div>
      <div class="market-analysis">
        <p>${marketAnalysis.analysisText}</p>
      </div>
      <div class="property-details">
        ${marketAnalysis.medianPrice ? `
        <div class="property-detail">
          <span class="property-detail-label">Suburb Median Price:</span> ${formatCurrency(marketAnalysis.medianPrice)}
        </div>
        ` : ''}
        ${marketAnalysis.priceChange3Months ? `
        <div class="property-detail">
          <span class="property-detail-label">3-Month Price Change:</span> ${marketAnalysis.priceChange3Months}%
        </div>
        ` : ''}
        ${marketAnalysis.priceChange12Months ? `
        <div class="property-detail">
          <span class="property-detail-label">12-Month Price Change:</span> ${marketAnalysis.priceChange12Months}%
        </div>
        ` : ''}
        ${marketAnalysis.averageDaysOnMarket ? `
        <div class="property-detail">
          <span class="property-detail-label">Average Days on Market:</span> ${marketAnalysis.averageDaysOnMarket} days
        </div>
        ` : ''}
        ${marketAnalysis.demandLevel ? `
        <div class="property-detail">
          <span class="property-detail-label">Demand Level:</span> ${marketAnalysis.demandLevel}
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    ${isFullAppraisal && marketAnalysis.valueFactors ? `
    <div class="section">
      <div class="section-title">Value Factors</div>
      <div class="value-factors">
        <div class="value-factor-section">
          <div class="value-factor-title">Positive Factors</div>
          <ul class="value-factor-list">
            ${marketAnalysis.valueFactors.positive.map((factor: string) => `
            <li class="value-factor-item positive">${factor}</li>
            `).join('')}
          </ul>
        </div>
        <div class="value-factor-section">
          <div class="value-factor-title">Negative Factors</div>
          <ul class="value-factor-list">
            ${marketAnalysis.valueFactors.negative.map((factor: string) => `
            <li class="value-factor-item negative">${factor}</li>
            `).join('')}
          </ul>
        </div>
      </div>
    </div>
    ` : ''}
    
    ${comparableProperties.length > 0 ? `
    <div class="section">
      <div class="section-title">Comparable Properties</div>
      ${comparableProperties.map((comp: any, index: number) => `
      <div class="comparable">
        <div class="comparable-title">Comparable ${index + 1}: ${comp.address}</div>
        <div class="comparable-details">
          <div class="property-detail">
            <span class="property-detail-label">Sale Price:</span> ${formatCurrency(comp.salePrice)}
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Sale Date:</span> ${new Date(comp.saleDate).toLocaleDateString('en-NZ')}
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Bedrooms:</span> ${comp.bedrooms}
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Bathrooms:</span> ${comp.bathrooms}
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Land Size:</span> ${comp.landSize} m²
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Building Size:</span> ${comp.buildingSize} m²
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Distance:</span> ${comp.distanceFromSubject} km
          </div>
        </div>
        ${comp.commentary ? `<p>${comp.commentary}</p>` : ''}
      </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${appraisal.agent_notes ? `
    <div class="section">
      <div class="section-title">Agent Notes</div>
      <p>${appraisal.agent_notes}</p>
    </div>
    ` : ''}
    
    ${appraisal.completion_notes ? `
    <div class="section">
      <div class="section-title">Completion Notes</div>
      <p>${appraisal.completion_notes}</p>
    </div>
    ` : ''}
    
    <div class="disclaimer">
      <p><strong>Disclaimer:</strong> This appraisal report is provided for informational purposes only and should not be considered as a formal valuation. The estimated value range is based on available data and market conditions at the time of the appraisal. For a formal valuation, please consult with a licensed property valuer.</p>
    </div>
    
    <div class="footer">
      <p>Report generated on ${completedDate}</p>
      <p>Appraisal ID: ${appraisal.id}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Function to convert HTML to PDF using a third-party service
// In a real implementation, this would use a PDF generation library
// For now, we'll return a mock PDF as base64
async function convertHTMLToPDF(html: string): Promise<string> {
  // In a real implementation, this would use a PDF generation library
  // For now, we'll return a mock PDF as base64
  return "mock-pdf-base64-data";
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the user that called the function.
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user from the auth context
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the request body
    const { appraisal_id, is_full_appraisal } = await req.json();

    // Validate the request body
    if (!appraisal_id) {
      return new Response(
        JSON.stringify({ error: "Appraisal ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the appraisal record
    const { data: appraisal, error: appraisalError } = await supabaseClient
      .from("appraisals")
      .select("*")
      .eq("id", appraisal_id)
      .single();

    if (appraisalError) {
      return new Response(
        JSON.stringify({ error: "Error fetching appraisal" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the appraisal is in the correct status
    if (appraisal.status !== "completed") {
      return new Response(
        JSON.stringify({ error: "Appraisal is not completed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the agent information if available
    let agent = null;
    if (appraisal.agent_id) {
      const { data: agentData, error: agentError } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", appraisal.agent_id)
        .single();

      if (!agentError && agentData) {
        agent = agentData;
      }
    }

    // Prepare the report data
    const reportData: ReportData = {
      appraisal,
      agent
    };

    // Generate the HTML template
    const html = generateReportHTML(reportData, is_full_appraisal);

    // Convert HTML to PDF
    const pdfBase64 = await convertHTMLToPDF(html);

    // Upload the PDF to Supabase Storage
    const fileName = `appraisal-${appraisal_id}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from("appraisal-reports")
      .upload(fileName, base64Encode(pdfBase64), {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: "Error uploading report" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from("appraisal-reports")
      .getPublicUrl(fileName);

    // Update the appraisal record with the report URL
    const { data: updatedAppraisal, error: updateError } = await supabaseClient
      .from("appraisals")
      .update({
        report_url: publicUrl
      })
      .eq("id", appraisal_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Error updating appraisal" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ data: updatedAppraisal }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 