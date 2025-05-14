/**
 * Custom hook for report generation
 * 
 * Separates business logic from UI components.
 * Handles report generation, downloading, and tracking.
 */
import { useState, useCallback } from 'react';

// Mock interfaces for example purposes
// In a real application, these would be imported from the actual implementation
interface Toast {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

interface ToastAPI {
  toast: (props: Toast) => void;
}

interface ReportResult {
  success: boolean;
  error: string | null;
  data: {
    downloadUrl?: string;
    reportUrl?: string;
  } | null;
}

// Mock service functions
// In a real application, these would be imported from the actual services
const useToast = (): ToastAPI => {
  const toast = (props: Toast) => {
    console.log('Toast:', props);
  };
  return { toast };
};

const generateAppraisalReport = async (appraisalId: string): Promise<ReportResult> => {
  // Mock implementation
  return {
    success: true,
    error: null,
    data: {
      downloadUrl: `https://example.com/reports/${appraisalId}`,
      reportUrl: `reports/${appraisalId}`
    }
  };
};

const getReportDownloadUrl = async (reportUrl: string): Promise<ReportResult> => {
  // Mock implementation
  return {
    success: true,
    error: null,
    data: {
      downloadUrl: `https://example.com/${reportUrl}`
    }
  };
};

const trackReportDownload = async (appraisalId: string): Promise<void> => {
  // Mock implementation
  console.log(`Tracking download for appraisal: ${appraisalId}`);
};

interface UseReportGenerationOptions {
  onSuccess?: (reportUrl: string) => void;
  onError?: (error: Error) => void;
}

interface UseReportGenerationReturn {
  isGenerating: boolean;
  hasError: boolean;
  errorMessage: string | null;
  generateReport: (appraisalId: string) => Promise<void>;
  downloadReport: (appraisalId: string, reportUrl: string) => Promise<void>;
}

/**
 * Hook for managing report generation and downloading
 */
export function useReportGeneration(options: UseReportGenerationOptions = {}): UseReportGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  /**
   * Reset error state
   */
  const resetErrorState = useCallback(() => {
    setHasError(false);
    setErrorMessage(null);
  }, []);
  
  /**
   * Handle error
   */
  const handleError = useCallback((error: unknown) => {
    setHasError(true);
    
    const message = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    setErrorMessage(message);
    
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
    
    if (options.onError && error instanceof Error) {
      options.onError(error);
    }
  }, [options, toast]);
  
  /**
   * Generate a new report
   */
  const generateReport = useCallback(async (appraisalId: string) => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      resetErrorState();
      
      toast({
        title: 'Generating Report',
        description: 'Please wait while we generate your PDF report...',
      });
      
      const result = await generateAppraisalReport(appraisalId);
      
      if (!result.success || !result.data?.downloadUrl) {
        throw new Error(result.error || 'Failed to generate report');
      }
      
      toast({
        title: 'Report Generated',
        description: 'Your PDF report has been generated successfully.',
      });
      
      // Open in new tab
      if (result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank');
      }
      
      // Notify via callback
      if (options.onSuccess && result.data.reportUrl) {
        options.onSuccess(result.data.reportUrl);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, resetErrorState, toast, options, handleError]);
  
  /**
   * Download an existing report
   */
  const downloadReport = useCallback(async (appraisalId: string, reportUrl: string) => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      resetErrorState();
      
      const result = await getReportDownloadUrl(reportUrl);
      
      if (!result.success || !result.data?.downloadUrl) {
        throw new Error(result.error || 'Failed to get report download URL');
      }
      
      // Track the download
      await trackReportDownload(appraisalId);
      
      // Open in new tab
      window.open(result.data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, resetErrorState, handleError]);
  
  return {
    isGenerating,
    hasError,
    errorMessage,
    generateReport,
    downloadReport
  };
} 