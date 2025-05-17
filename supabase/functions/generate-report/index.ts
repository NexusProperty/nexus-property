import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import puppeteer from 'https://esm.sh/puppeteer-core@21.6.1';
import Handlebars from 'https://esm.sh/handlebars@4.7.8';
import { format } from 'https://deno.land/std@0.177.0/datetime/mod.ts';

interface ReportRequest {
  appraisalId: string;
  brandingConfig?: BrandingConfig;
  preview?: boolean;
  skipAuth?: boolean;
  includeAIContent?: boolean;
  includeCoreLogicData?: boolean;
  includeREINZData?: boolean;
}

interface BrandingConfig {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    textPrimary?: string;
    textSecondary?: string;
    bgPrimary?: string;
    bgSecondary?: string;
  };
  logo?: string;
  fonts?: {
    primaryFont?: string;
    headingFont?: string;
  };
  disclaimer?: string;
  contactDetails?: string;
  agentPhoto?: string;
  showTeamInfo?: boolean;
}

interface Property {
  id: string;
  address: string;
  suburb: string;
  city: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  land_size: number;
  floor_area: number;
  year_built: number;
  features: string;
  condition: string;
  construction_type: string;
  zoning: string;
  image_url: string;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  agency_id: string;
  title: string;
  license_number: string;
  photo_url: string;
}

interface Agency {
  id: string;
  name: string;
  contact_details: string;
  logo_url: string;
}

interface ComparableProperty {
  id: string;
  appraisal_id: string;
  address: string;
  suburb: string;
  sale_price: number;
  sale_date: string;
  bedrooms: number;
  bathrooms: number;
  land_size: number;
  property_type: string;
  similarity_score: number;
  image_url: string;
}

interface MarketStatistics {
  id: string;
  suburb: string;
  median_price: number;
  annual_growth_percent: number;
  average_days_on_market: number;
  date: string;
}

interface CoreLogicData {
  id: string;
  property_id: string;
  estimated_value: number;
  confidence_score: string;
  range_low: number;
  range_high: number;
  last_updated: string;
}

interface AppraisalData {
  id: string;
  user_id: string;
  property_id: string;
  agent_id: string;
  valuation_low: number;
  valuation_high: number;
  confidence: number;
  status: string;
  ai_enhanced: boolean;
  ai_content?: {
    property_description?: string;
    market_overview?: string;
    comparable_analysis?: string;
  };
  created_at: string;
  updated_at: string;
  report_url?: string;
  report_generated_at?: string;
  properties: Property;
  agents: Agent;
  agencies?: Agency;
}

// Get the template from file
const templatePath = new URL('./templates/report-template.html', import.meta.url);
let templateContent: string;

try {
  templateContent = await Deno.readTextFile(templatePath);
} catch (error) {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Failed to read template file',
    error: error.message,
    path: templatePath.toString()
  }));
  // Provide a fallback minimal template in case the file can't be read
  templateContent = `<!DOCTYPE html>
  <html>
  <head>
    <title>{{property_address}} - Property Appraisal</title>
    <style>
      body { font-family: Arial, sans-serif; }
      h1 { color: #2563EB; }
    </style>
  </head>
  <body>
    <h1>Property Appraisal Report</h1>
    <h2>{{property_address}}</h2>
    <p>Estimated Value: {{valuation_currency}}{{valuation_low}} - {{valuation_currency}}{{valuation_high}}</p>
    <p>Generated on {{generation_date}}</p>
  </body>
  </html>`;
}

// Compile the template
const template = Handlebars.compile(templateContent);

// PDF generation function
async function generatePDF(
  appraisalData: any, 
  comparables: any[] = [], 
  corelogicData: any = null, 
  marketStats: any = null, 
  brandingConfig: any = {}
): Promise<Uint8Array> {
  try {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Generating enhanced PDF for appraisal',
      appraisalId: appraisalData.id
    }));

    // Format helper function
    const formatCurrency = (value: number): string => {
      return value.toLocaleString();
    };

    // Extract data
    const property = appraisalData.properties;
    const agent = appraisalData.agents;
    const agency = appraisalData.agencies || {};

    // Generate AI content if configured
    let aiPropertyDescription = "";
    let aiMarketOverview = "";
    let aiComparableAnalysis = "";

    if (appraisalData.ai_enhanced && appraisalData.ai_content) {
      // Use stored AI content or generate new if needed
      aiPropertyDescription = appraisalData.ai_content.property_description || 
        "This property offers a unique opportunity in a desirable location. With its combination of features and position in the market, it represents good value for potential buyers.";
      
      aiMarketOverview = appraisalData.ai_content.market_overview || 
        "The local market has shown steady growth over the past year, with increased demand for properties in this area. Supply remains somewhat constrained, supporting stable price growth.";
      
      aiComparableAnalysis = appraisalData.ai_content.comparable_analysis || 
        "The comparable properties demonstrate similar characteristics to the subject property. Recent sales suggest the market values these features consistently.";
    }

    // Default branding colors and customizations
    const branding = {
      colors: {
        primary: brandingConfig?.colors?.primary || '#2563EB',
        secondary: brandingConfig?.colors?.secondary || '#3B82F6',
        accent: brandingConfig?.colors?.accent || '#DBEAFE',
        textPrimary: brandingConfig?.colors?.textPrimary || '#1F2937',
        textSecondary: brandingConfig?.colors?.textSecondary || '#6B7280',
        bgPrimary: brandingConfig?.colors?.bgPrimary || '#FFFFFF',
        bgSecondary: brandingConfig?.colors?.bgSecondary || '#F3F4F6',
      },
      logo: brandingConfig?.logo || 'https://via.placeholder.com/200x80?text=Agency+Logo',
      fonts: brandingConfig?.fonts || {
        primaryFont: 'Arial, sans-serif',
        headingFont: 'Arial, sans-serif',
      },
      disclaimer: brandingConfig?.disclaimer || 'Standard disclaimer text for the agency.',
    };

    // Prepare the data for template
    const templateData = {
      // Branding
      agency_logo_url: branding.logo,
      agency_name: agency?.name || "Nexus Property",
      agency_contact_details: branding.contactDetails || agency?.contact_details || "contact@nexusproperty.com",
      agency_disclaimer_text: branding.disclaimer,
      
      // Custom styling variables will be injected with CSS
      brand_colors: branding.colors,
      brand_fonts: branding.fonts,
      
      // Report details
      generation_date: format(new Date(), "yyyy-MM-dd"),
      current_year: new Date().getFullYear(),
      
      // Property details
      property_address: property.address,
      property_suburb: property.suburb,
      property_city: property.city,
      property_image_url: property.image_url || 'https://via.placeholder.com/600x400?text=Property+Image',
      property_type: property.property_type || 'Residential',
      property_land_size: property.land_size ? `${property.land_size} m²` : 'Not specified',
      property_bedrooms: property.bedrooms || 'Not specified',
      property_bathrooms: property.bathrooms || 'Not specified',
      property_parking: property.parking || 'Not specified',
      property_year_built: property.year_built || 'Not specified',
      
      // Additional property details as key-value pairs for the table
      property_details: {
        'Floor Area': property.floor_area ? `${property.floor_area} m²` : 'Not specified',
        'Zoning': property.zoning || 'Not specified',
        'Construction': property.construction_type || 'Not specified',
        'Condition': property.condition || 'Not specified',
        'Features': property.features || 'None specified',
      },
      
      // Valuation details
      valuation_currency: '$',
      valuation_low: formatCurrency(appraisalData.valuation_low),
      valuation_high: formatCurrency(appraisalData.valuation_high),
      valuation_confidence: appraisalData.confidence || 85,
      
      // CoreLogic data if available
      corelogic_avm_estimate: corelogicData?.estimated_value ? formatCurrency(corelogicData.estimated_value) : 'Not available',
      corelogic_avm_confidence: corelogicData?.confidence_score || 'Medium',
      corelogic_avm_range_low: corelogicData?.range_low ? formatCurrency(corelogicData.range_low) : 'Not available',
      corelogic_avm_range_high: corelogicData?.range_high ? formatCurrency(corelogicData.range_high) : 'Not available',
      
      // CoreLogic & REINZ data
      corelogic_logo_url: 'https://via.placeholder.com/200x50?text=CoreLogic',
      reinz_logo_url: 'https://via.placeholder.com/200x50?text=REINZ',
      corelogic_market_statistics: corelogicMarketStats ? formatMarketStatistics(corelogicMarketStats) : null,
      reinz_market_statistics: reinzMarketStats ? formatMarketStatistics(reinzMarketStats) : null,
      property_activity_summary: propertyActivitySummary || null,
      
      // Market statistics
      market_statistics: {
        median_price: marketStats?.median_price ? formatCurrency(marketStats.median_price) : '750,000',
        annual_growth: marketStats?.annual_growth_percent || 5.2,
        days_on_market: marketStats?.average_days_on_market || 28,
      },
      
      // Charts and graphs (would be generated or fetched URLs)
      market_chart_url: 'https://via.placeholder.com/800x400?text=Market+Trends+Chart',
      comparables_map_url: 'https://via.placeholder.com/800x400?text=Comparable+Properties+Map',
      
      // Agent details
      agent_name: `${agent.first_name} ${agent.last_name}`,
      agent_title: agent.title || 'Licensed Real Estate Agent',
      agent_license_number: agent.license_number || 'License #12345',
      agent_phone: agent.phone || '123-456-7890',
      agent_email: agent.email || 'agent@nexusproperty.com',
      agent_photo_url: brandingConfig?.agentPhoto || agent.photo_url || 'https://via.placeholder.com/150x150?text=Agent',
      
      // AI enhanced content
      ai_property_description: aiPropertyDescription,
      ai_market_overview: aiMarketOverview,
      ai_comparable_analysis_text: aiComparableAnalysis,
      
      // Comparable properties
      comparables: comparables ? comparables.map(comp => ({
        address: comp.address,
        image_url: comp.image_url || 'https://via.placeholder.com/300x200?text=Comparable',
        sale_price: formatCurrency(comp.sale_price),
        sale_date: comp.sale_date,
        similarity_score: comp.similarity_score,
        bedrooms: comp.bedrooms,
        bathrooms: comp.bathrooms,
      })) : [],
      
      // Page numbering (will be handled by PDF generation)
      page_number: '{{page}}',
      total_pages: '{{pages}}',
    };
    
    // Helper function to format market statistics for display
    function formatMarketStatistics(stats) {
      if (!stats) return null;
      
      const formattedStats = {};
      
      // Format and transform the statistics for display
      Object.entries(stats).forEach(([key, value]) => {
        // Format numeric values
        if (typeof value === 'number') {
          // Format as currency if the key suggests it's a price/value
          if (key.toLowerCase().includes('price') || key.toLowerCase().includes('value')) {
            formattedStats[formatLabel(key)] = `$${formatCurrency(value)}`;
          } 
          // Format as percentage if the key suggests it's a percentage
          else if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('growth')) {
            formattedStats[formatLabel(key)] = `${value.toFixed(1)}%`;
          }
          // Otherwise just format as number
          else {
            formattedStats[formatLabel(key)] = value.toString();
          }
        } else {
          formattedStats[formatLabel(key)] = value;
        }
      });
      
      return formattedStats;
    }
    
    // Helper to format keys into readable labels
    function formatLabel(key) {
      // Convert camelCase or snake_case to Title Case With Spaces
      return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    }

    // Generate HTML using template
    const html = template(templateData);

    // Setup browser
    const browser = await puppeteer.launch({
      // Use Chrome installed in the execution environment or fallback to default
      executablePath: Deno.env.get('CHROME_PATH') || '/usr/bin/google-chrome-stable',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set content and wait for all resources to load
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.5cm', right: '0.5cm', bottom: '0.5cm', left: '0.5cm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; color: #6B7280; text-align: center; padding: 5px 20px;">
          Report generated by AppraisalHub | Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      footerHeight: 30,
    });
    
    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to generate PDF',
      error: error.message,
      stack: error.stack
    }));
    throw error;
  }
}

// Handle incoming HTTP requests
serve(async (req: Request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };
  
  // Headers for PDF response
  const pdfHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/pdf',
  };
  
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }
    
    // Parse request body
    const requestData = await req.json();
    
    // Validate request data
    if (!requestData.appraisalId) {
      throw new Error('Missing required field: appraisalId');
    }
    
    // Get branding config if provided
    const brandingConfig = requestData.brandingConfig || {};
    
    // Determine if this is a preview or full generation
    const isPreview = requestData.preview === true;
    
    // Create Supabase client using environment variables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Authentication handling
    let userId = null;
    
    // If not in preview mode or explicitly requires auth
    if (!isPreview || !requestData.skipAuth) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing Authorization header');
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError || !user) {
        throw new Error('Unauthorized: Invalid token');
      }
      
      userId = user.id;
      
      // Log authenticated user
      console.log(JSON.stringify({
        level: 'info',
        message: 'Authenticated user generating report',
        userId,
        appraisalId: requestData.appraisalId,
        isPreview
      }));
    }
    
    // Fetch appraisal data with expanded joins
    const { data: appraisalData, error: appraisalError } = await supabaseClient
      .from('appraisals')
      .select(`
        *,
        properties:property_id(*),
        agents:agent_id(*),
        agencies:agents:agent_id(agency_id(*))
      `)
      .eq('id', requestData.appraisalId)
      // Only apply user filter if we have a user ID and it's not preview mode
      .when(!isPreview && userId, query => query.eq('user_id', userId), query => query)
      .single();
    
    if (appraisalError || !appraisalData) {
      throw new Error(`Appraisal not found or access denied: ${appraisalError?.message}`);
    }
    
    // Fetch comparable properties
    const { data: comparables, error: comparablesError } = await supabaseClient
      .from('comparable_properties')
      .select('*')
      .eq('appraisal_id', requestData.appraisalId)
      .order('similarity_score', { ascending: false })
      .limit(6);
    
    if (comparablesError) {
      console.error(JSON.stringify({
        level: 'warning',
        message: 'Error fetching comparables',
        error: comparablesError.message
      }));
      // Continue without comparables
    }
    
    // Fetch CoreLogic data if available and requested
    let corelogicData = null;
    let corelogicMarketStats = null;
    let propertyActivitySummary = null;
    
    if (requestData.includeCoreLogicData !== false) {
      // Fetch CoreLogic AVM data
      const { data: clData, error: corelogicError } = await supabaseClient
        .from('corelogic_property_data')
        .select('*')
        .eq('property_id', appraisalData.property_id)
        .maybeSingle();
      
      if (corelogicError) {
        console.error(JSON.stringify({
          level: 'warning',
          message: 'Error fetching CoreLogic AVM data',
          error: corelogicError.message
        }));
        // Continue without CoreLogic data
      } else {
        corelogicData = clData;
      }
      
      // Fetch CoreLogic market statistics
      const { data: clMarketStats, error: marketStatsError } = await supabaseClient
        .from('appraisals')
        .select('market_statistics_corelogic')
        .eq('property_id', appraisalData.property_id)
        .maybeSingle();
      
      if (marketStatsError) {
        console.error(JSON.stringify({
          level: 'warning',
          message: 'Error fetching CoreLogic market statistics',
          error: marketStatsError.message
        }));
      } else {
        corelogicMarketStats = clMarketStats?.market_statistics_corelogic || null;
      }
      
      // Fetch property activity summary
      const { data: activityData, error: activityError } = await supabaseClient
        .from('appraisals')
        .select('property_activity_summary')
        .eq('property_id', appraisalData.property_id)
        .maybeSingle();
      
      if (activityError) {
        console.error(JSON.stringify({
          level: 'warning',
          message: 'Error fetching property activity summary',
          error: activityError.message
        }));
      } else {
        propertyActivitySummary = activityData?.property_activity_summary || null;
        
        // Format activity data for the report
        if (propertyActivitySummary) {
          propertyActivitySummary = Object.entries(propertyActivitySummary).map(([period, data]) => {
            const priceChange = data.price_change || 0;
            return {
              period,
              sales_count: data.sales_count,
              median_price: data.median_price,
              price_change: priceChange.toFixed(1),
              change_class: priceChange >= 0 ? 'positive-change' : 'negative-change'
            };
          });
        }
      }
    }
    
    // Fetch market statistics
    const { data: marketStats, error: marketStatsError } = await supabaseClient
      .from('market_statistics')
      .select('*')
      .eq('suburb', appraisalData.properties.suburb)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (marketStatsError) {
      console.error(JSON.stringify({
        level: 'warning',
        message: 'Error fetching market statistics',
        error: marketStatsError.message
      }));
      // Continue without market statistics
    }
    
    // Fetch REINZ market statistics if requested
    let reinzMarketStats = null;
    
    if (requestData.includeREINZData !== false) {
      const { data: reinzData, error: reinzError } = await supabaseClient
        .from('appraisals')
        .select('market_statistics_reinz')
        .eq('property_id', appraisalData.property_id)
        .maybeSingle();
      
      if (reinzError) {
        console.error(JSON.stringify({
          level: 'warning',
          message: 'Error fetching REINZ market statistics',
          error: reinzError.message
        }));
      } else {
        reinzMarketStats = reinzData?.market_statistics_reinz || null;
      }
    }
    
    // Generate PDF with enhanced template
    const pdfBuffer = await generatePDF(
      appraisalData, 
      comparables || [], 
      corelogicData, 
      marketStats, 
      brandingConfig
    );
    
    // For preview mode, just return the PDF directly
    if (isPreview) {
      return new Response(pdfBuffer, {
        headers: {
          ...pdfHeaders,
          'Content-Disposition': `inline; filename="appraisal-preview-${requestData.appraisalId}.pdf"`
        }
      });
    }
    
    // For full generation, save to storage
    // Save PDF to Supabase Storage
    const filename = `appraisal_${requestData.appraisalId}_${Date.now()}.pdf`;
    const filePath = `reports/${userId}/${filename}`;
    
    const { error: uploadError } = await supabaseClient
      .storage
      .from('reports')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }
    
    // Update appraisal record with report URL
    const { error: updateError } = await supabaseClient
      .from('appraisals')
      .update({ 
        report_url: filePath,
        report_generated_at: new Date().toISOString()
      })
      .eq('id', requestData.appraisalId);
    
    if (updateError) {
      throw new Error(`Failed to update appraisal record: ${updateError.message}`);
    }
    
    // Create a signed URL for immediate download
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('reports')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
    
    if (signedUrlError) {
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }
    
    // Return success response with signed URL
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reportUrl: filePath,
          downloadUrl: signedUrlData.signedUrl
        }
      }),
      { headers }
    );
  } catch (error) {
    // Log error
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error generating report',
      error: error.message,
      stack: error.stack
    }));
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 400, 
        headers 
      }
    );
  }
}); 