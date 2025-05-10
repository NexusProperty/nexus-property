import React, { useState } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { appraisalProcessingService } from '../services/appraisalProcessingService';
import { useNavigate } from 'react-router-dom';

interface AppraisalProcessingButtonProps {
  appraisalId: string;
  isFullAppraisal?: boolean;
  onSuccess?: () => void;
  className?: string;
}

export const AppraisalProcessingButton: React.FC<AppraisalProcessingButtonProps> = ({
  appraisalId,
  isFullAppraisal = true,
  onSuccess,
  className
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleProcessAppraisal = async () => {
    try {
      setIsProcessing(true);
      
      // Start polling for status changes
      const stopPolling = appraisalProcessingService.pollAppraisalStatus(
        appraisalId,
        (status) => {
          if (status === 'completed') {
            setIsProcessing(false);
            stopPolling();
            
            // Call the onSuccess callback if provided
            if (onSuccess) {
              onSuccess();
            }
            
            // Navigate to the appraisal detail page
            navigate(`/appraisals/${appraisalId}`);
          } else if (status === 'cancelled') {
            setIsProcessing(false);
            stopPolling();
          }
        }
      );
      
      // Process the appraisal
      await appraisalProcessingService.processAppraisal(appraisalId, isFullAppraisal);
    } catch (error) {
      console.error('Error processing appraisal:', error);
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleProcessAppraisal}
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Process Appraisal'
      )}
    </Button>
  );
}; 