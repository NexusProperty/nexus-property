import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { generateAppraisalReport, getReportDownloadUrl, trackReportDownload } from '@/services/reportGeneration';
import { useToast } from './ui/use-toast';

interface ReportGenerationButtonProps {
  appraisalId: string;
  reportUrl?: string | null;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  className?: string;
  onReportGenerated?: (reportUrl: string) => void;
}

/**
 * Button component for generating and downloading PDF reports
 */
export default function ReportGenerationButton({
  appraisalId,
  reportUrl,
  variant = 'default',
  size = 'default',
  label = 'Download Report',
  className = '',
  onReportGenerated
}: ReportGenerationButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
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
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
} 