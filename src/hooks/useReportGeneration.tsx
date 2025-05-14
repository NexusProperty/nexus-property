import { useState } from 'react';
import { generateAppraisalReport, getReportDownloadUrl, trackReportDownload } from '@/services/reportGeneration';
import { useToast } from '@/components/ui/use-toast';

interface UseReportGenerationProps {
  appraisalId: string;
  initialReportUrl?: string | null;
  onReportGenerated?: (reportUrl: string) => void;
}

interface UseReportGenerationReturn {
  isGenerating: boolean;
  reportUrl: string | null;
  generateReport: () => Promise<void>;
  error: string | null;
}

/**
 * Custom hook for handling report generation and download logic
 * 
 * @param appraisalId - The ID of the appraisal to generate a report for
 * @param initialReportUrl - Optional initial report URL if already generated
 * @param onReportGenerated - Optional callback for when a report is generated
 */
export function useReportGeneration({
  appraisalId,
  initialReportUrl = null,
  onReportGenerated,
}: UseReportGenerationProps): UseReportGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(initialReportUrl || null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateReport = async (): Promise<void> => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      if (reportUrl) {
        // If report already exists, get a signed URL for download
        const result = await getReportDownloadUrl(reportUrl);
        
        if (!result.success || !result.data?.downloadUrl) {
          throw new Error(result.error || 'Failed to get report download URL');
        }

        // Track the download
        await trackReportDownload(appraisalId);
        
        // Open in new tab
        window.open(result.data.downloadUrl, '_blank');
      } else {
        // Generate a new report
        toast({
          title: 'Generating Report',
          description: 'Please wait while we generate your PDF report...',
        });
        
        const result = await generateAppraisalReport(appraisalId);
        
        if (!result.success || !result.data?.downloadUrl) {
          throw new Error(result.error || 'Failed to generate report');
        }
        
        // Update internal state
        if (result.data.reportUrl) {
          setReportUrl(result.data.reportUrl);
        }
        
        // Notify the parent component
        if (onReportGenerated && result.data.reportUrl) {
          onReportGenerated(result.data.reportUrl);
        }
        
        toast({
          title: 'Report Generated',
          description: 'Your PDF report has been generated successfully.',
        });
        
        // Open in new tab
        window.open(result.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error with report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process report';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    reportUrl,
    generateReport,
    error
  };
} 