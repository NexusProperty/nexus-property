import { supabase } from '../integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

/**
 * Service for generating and managing appraisal reports
 */
export const reportGenerationService = {
  /**
   * Generate a PDF report for an appraisal
   * @param appraisalId The ID of the appraisal to generate a report for
   * @param isFullAppraisal Whether this is a full appraisal or a limited one
   * @returns The updated appraisal data with the report URL
   */
  async generateReport(appraisalId: string, isFullAppraisal: boolean = true) {
    try {
      // Show loading toast
      toast({
        title: "Generating report...",
        description: "Please wait while we generate your report.",
      });
      
      // Call the Edge Function to generate the report
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { appraisal_id: appraisalId, is_full_appraisal: isFullAppraisal }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to generate report: " + error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      // Show success toast
      toast({
        title: "Success",
        description: "Report generated successfully!",
      });
      
      return data;
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
      throw error;
    }
  },
  
  /**
   * Download a report for an appraisal
   * @param reportUrl The URL of the report to download
   * @param fileName Optional custom filename for the downloaded file
   */
  async downloadReport(reportUrl: string, fileName?: string) {
    try {
      // Show loading toast
      toast({
        title: "Downloading report...",
        description: "Please wait while we download your report.",
      });
      
      // Fetch the report
      const response = await fetch(reportUrl);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // Set the download attribute with the filename
      link.download = fileName || 'appraisal-report.pdf';
      
      // Append the link to the document
      document.body.appendChild(link);
      
      // Click the link to trigger the download
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Report downloaded successfully!",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
      throw error;
    }
  },
  
  /**
   * Get the report URL for an appraisal
   * @param appraisalId The ID of the appraisal to get the report URL for
   * @returns The report URL or null if no report exists
   */
  async getReportUrl(appraisalId: string) {
    try {
      const { data, error } = await supabase
        .from('appraisals')
        .select('report_url')
        .eq('id', appraisalId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data.report_url;
    } catch (error) {
      console.error('Error getting report URL:', error);
      return null;
    }
  }
}; 