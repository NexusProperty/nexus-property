import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import * as pdfMake from 'https://esm.sh/pdfmake@0.2.7';
import { TDocumentDefinitions, StyleDictionary } from 'https://esm.sh/pdfmake@0.2.7';

interface ReportRequest {
  appraisalId: string;
}

interface AppraisalData {
  id: string;
  property_address: string;
  property_suburb: string;
  property_city: string;
  property_type: string;
  valuation_low: number;
  valuation_high: number;
  valuation_confidence: number;
  property_details: Record<string, any>;
  market_analysis: Record<string, any>;
  comparables: Array<Record<string, any>>;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: string;
}

// PDF generation function
async function generatePDF(appraisalData: AppraisalData): Promise<Uint8Array> {
  try {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Generating PDF for appraisal',
      appraisalId: appraisalData.id
    }));

    // Define document styles
    const styles: StyleDictionary = {
      header: {
        fontSize: 22,
        bold: true,
        color: '#2563EB',
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        color: '#3B82F6',
        margin: [0, 15, 0, 5]
      },
      section: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: '#1F2937',
        fillColor: '#F3F4F6'
      },
      propertyDetail: {
        margin: [0, 5, 0, 5],
        fontSize: 12
      },
      footer: {
        alignment: 'center',
        fontSize: 10,
        margin: [0, 10, 0, 0],
        color: '#6B7280'
      }
    };

    // Format currency
    const formatCurrency = (value: number): string => {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    // Format date
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Create document definition
    const docDefinition: TDocumentDefinitions = {
      info: {
        title: `Property Appraisal Report - ${appraisalData.property_address}`,
        author: 'AppraisalHub',
        subject: 'Property Appraisal',
        keywords: 'appraisal, property, valuation',
        creator: 'AppraisalHub'
      },
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      header: {
        text: 'AppraisalHub',
        style: 'footer',
        margin: [40, 20, 40, 0]
      },
      footer: (currentPage, pageCount) => ({
        text: `Page ${currentPage} of ${pageCount} | Report generated on ${formatDate(new Date().toISOString())}`,
        style: 'footer',
        margin: [40, 0, 40, 20]
      }),
      content: [
        // Title
        {
          text: 'Property Appraisal Report',
          style: 'header'
        },
        
        // Property Information
        {
          text: 'Property Information',
          style: 'subheader'
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Address:', bold: true },
                { text: 'Property Type:', bold: true },
                { text: 'Generated On:', bold: true }
              ],
              style: 'propertyDetail'
            },
            {
              width: '50%',
              stack: [
                { text: `${appraisalData.property_address}, ${appraisalData.property_suburb}, ${appraisalData.property_city}` },
                { text: appraisalData.property_type },
                { text: formatDate(new Date().toISOString()) }
              ],
              style: 'propertyDetail'
            }
          ]
        },
        
        // Valuation Summary
        {
          text: 'Valuation Summary',
          style: 'subheader',
          pageBreak: 'before'
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Estimated Value Range:', bold: true },
                { text: 'Confidence Level:', bold: true }
              ],
              style: 'propertyDetail'
            },
            {
              width: '50%',
              stack: [
                { text: `${formatCurrency(appraisalData.valuation_low)} - ${formatCurrency(appraisalData.valuation_high)}` },
                { text: `${Math.round(appraisalData.valuation_confidence * 100)}%` }
              ],
              style: 'propertyDetail'
            }
          ]
        },
        
        // Property Details
        {
          text: 'Property Details',
          style: 'subheader'
        },
        {
          table: {
            widths: ['40%', '60%'],
            body: [
              [
                { text: 'Attribute', style: 'tableHeader' },
                { text: 'Value', style: 'tableHeader' }
              ],
              ...(appraisalData.property_details ? 
                Object.entries(appraisalData.property_details).map(([key, value]) => [
                  { text: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), style: 'propertyDetail' },
                  { text: value !== null ? String(value) : 'N/A', style: 'propertyDetail' }
                ]) 
                : [['No property details available', '']])
            ]
          }
        },
        
        // Comparable Properties
        {
          text: 'Comparable Properties',
          style: 'subheader',
          pageBreak: 'before'
        },
        ...(appraisalData.comparables && appraisalData.comparables.length > 0 ? [
          {
            table: {
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Address', style: 'tableHeader' },
                  { text: 'Sale Price', style: 'tableHeader' },
                  { text: 'Sale Date', style: 'tableHeader' },
                  { text: 'Similarity', style: 'tableHeader' }
                ],
                ...appraisalData.comparables.map(comp => [
                  { text: comp.address || 'N/A', style: 'propertyDetail' },
                  { text: comp.sale_price ? formatCurrency(comp.sale_price) : 'N/A', style: 'propertyDetail' },
                  { text: comp.sale_date ? formatDate(comp.sale_date) : 'N/A', style: 'propertyDetail' },
                  { text: comp.similarity_score ? `${Math.round(comp.similarity_score)}%` : 'N/A', style: 'propertyDetail' }
                ])
              ]
            }
          }
        ] : [
          { text: 'No comparable properties available', style: 'propertyDetail' }
        ]),
        
        // Market Analysis
        {
          text: 'Market Analysis',
          style: 'subheader',
          pageBreak: 'before'
        },
        ...(appraisalData.market_analysis ? [
          {
            columns: [
              {
                width: '50%',
                stack: [
                  { text: 'Median Price:', bold: true },
                  { text: 'Annual Growth:', bold: true },
                  { text: 'Days on Market:', bold: true }
                ],
                style: 'propertyDetail'
              },
              {
                width: '50%',
                stack: [
                  { text: appraisalData.market_analysis.median_price ? formatCurrency(appraisalData.market_analysis.median_price) : 'N/A' },
                  { text: appraisalData.market_analysis.annual_growth ? `${appraisalData.market_analysis.annual_growth}%` : 'N/A' },
                  { text: appraisalData.market_analysis.days_on_market ? String(appraisalData.market_analysis.days_on_market) : 'N/A' }
                ],
                style: 'propertyDetail'
              }
            ]
          },
          {
            text: 'Market Insights',
            style: 'section',
            margin: [0, 15, 0, 5]
          },
          {
            text: appraisalData.market_analysis.insights || 'No market insights available',
            style: 'propertyDetail'
          }
        ] : [
          { text: 'No market analysis available', style: 'propertyDetail' }
        ]),
        
        // Disclaimer
        {
          text: 'Disclaimer',
          style: 'subheader',
          pageBreak: 'before'
        },
        {
          text: [
            'This report is for informational purposes only and should not be considered as financial or legal advice. ',
            'The valuation provided is an estimate based on current market data and comparable properties. ',
            'Actual property values may vary depending on various factors including but not limited to property condition, market changes, and individual buyer preferences. ',
            'AppraisalHub does not guarantee the accuracy of this valuation for any specific transaction. ',
            'We recommend consulting with a licensed real estate professional before making any financial decisions.'
          ],
          style: 'propertyDetail'
        }
      ],
      styles: styles
    };

    // Generate PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);
    return await new Promise<Uint8Array>((resolve, reject) => {
      pdfDoc.getBuffer((buffer) => {
        resolve(buffer);
      }, reject);
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to generate PDF',
      error: error.message
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
    const requestData = await req.json() as ReportRequest;
    
    // Validate request data
    if (!requestData.appraisalId) {
      throw new Error('Missing required field: appraisalId');
    }
    
    // Create Supabase client using environment variables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Verify JWT token (authentication)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }
    
    // Log authenticated user
    console.log(JSON.stringify({
      level: 'info',
      message: 'Authenticated user generating report',
      userId: user.id,
      appraisalId: requestData.appraisalId
    }));
    
    // Fetch appraisal data
    const { data: appraisalData, error: appraisalError } = await supabaseClient
      .from('appraisals')
      .select('*, comparables:comparable_properties(*)')
      .eq('id', requestData.appraisalId)
      .eq('user_id', user.id)
      .single();
    
    if (appraisalError || !appraisalData) {
      throw new Error(`Appraisal not found or access denied: ${appraisalError?.message}`);
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDF(appraisalData);
    
    // Save PDF to Supabase Storage
    const filename = `appraisal_${requestData.appraisalId}_${Date.now()}.pdf`;
    const filePath = `reports/${user.id}/${filename}`;
    
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
      .update({ report_url: filePath })
      .eq('id', requestData.appraisalId);
    
    if (updateError) {
      throw new Error(`Failed to update appraisal record: ${updateError.message}`);
    }
    
    // Create a signed URL for immediate download
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('reports')
      .createSignedUrl(filePath, 60); // 60 seconds expiry
    
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