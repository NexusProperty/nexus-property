import { supabase } from '../lib/supabase';

export interface ReportGenerationResult {
  success: boolean;
  error: string | null;
  data: {
    reportUrl?: string;
    downloadUrl?: string;
  } | null;
}

/**
 * Generate a PDF report for an appraisal
 * This calls the Supabase Edge Function to generate and store the report
 */
export async function generateAppraisalReport(appraisalId: string): Promise<ReportGenerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: { appraisalId },
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate report');
    }

    return {
      success: true,
      error: null,
      data: {
        reportUrl: data.data.reportUrl,
        downloadUrl: data.data.downloadUrl,
      },
    };
  } catch (error) {
    const err = error as Error;
    console.error('Error generating report:', err.message);
    
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Get a download URL for an existing report
 * This creates a signed URL with temporary access to the report
 */
export async function getReportDownloadUrl(reportPath: string): Promise<ReportGenerationResult> {
  try {
    if (!reportPath) {
      throw new Error('No report path provided');
    }

    const { data, error } = await supabase.storage
      .from('reports')
      .createSignedUrl(reportPath, 60); // 60 seconds expiry

    if (error) throw error;

    return {
      success: true,
      error: null,
      data: {
        reportUrl: reportPath,
        downloadUrl: data.signedUrl,
      },
    };
  } catch (error) {
    const err = error as Error;
    console.error('Error getting report download URL:', err.message);
    
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Track report download event
 * This is useful for analytics and can be expanded later
 */
export async function trackReportDownload(appraisalId: string): Promise<void> {
  try {
    // Add analytics tracking here if needed
    console.log(`Report downloaded for appraisal ${appraisalId}`);
  } catch (error) {
    console.error('Error tracking report download:', error);
  }
} 