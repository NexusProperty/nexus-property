import React, { useState } from 'react';
import { Button } from './ui/button';
import { Loader2, FileText } from 'lucide-react';
import { reportGenerationService } from '../services/reportGenerationService';

interface ReportGenerationButtonProps {
  appraisalId: string;
  isFullAppraisal?: boolean;
  onSuccess?: (reportUrl: string) => void;
  className?: string;
}

export const ReportGenerationButton: React.FC<ReportGenerationButtonProps> = ({
  appraisalId,
  isFullAppraisal = true,
  onSuccess,
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      
      // Generate the report
      const result = await reportGenerationService.generateReport(appraisalId, isFullAppraisal);
      
      // Call the onSuccess callback if provided
      if (onSuccess && result.data.report_url) {
        onSuccess(result.data.report_url);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateReport}
      disabled={isGenerating}
      className={className}
      variant="outline"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Report...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Generate Report
        </>
      )}
    </Button>
  );
}; 