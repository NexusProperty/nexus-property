import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';

/**
 * Service for processing appraisals using AI
 */
export const appraisalProcessingService = {
  /**
   * Process an appraisal using AI
   * @param appraisalId The ID of the appraisal to process
   * @param isFullAppraisal Whether this is a full appraisal or a limited one
   * @returns The updated appraisal data
   */
  async processAppraisal(appraisalId: string, isFullAppraisal: boolean = true) {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Processing appraisal...');
      
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('process-appraisal', {
        body: { appraisal_id: appraisalId, is_full_appraisal: isFullAppraisal }
      });
      
      if (error) {
        toast.error(`Error processing appraisal: ${error.message}`, { id: loadingToast });
        throw error;
      }
      
      // Show success toast
      toast.success('Appraisal processed successfully!', { id: loadingToast });
      
      return data;
    } catch (error) {
      console.error('Error processing appraisal:', error);
      toast.error('Failed to process appraisal. Please try again.');
      throw error;
    }
  },
  
  /**
   * Get the status of an appraisal
   * @param appraisalId The ID of the appraisal to check
   * @returns The current status of the appraisal
   */
  async getAppraisalStatus(appraisalId: string) {
    try {
      const { data, error } = await supabase
        .from('appraisals')
        .select('status')
        .eq('id', appraisalId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data.status;
    } catch (error) {
      console.error('Error getting appraisal status:', error);
      throw error;
    }
  },
  
  /**
   * Poll for appraisal status changes
   * @param appraisalId The ID of the appraisal to poll
   * @param onStatusChange Callback function when status changes
   * @param interval Polling interval in milliseconds
   * @param maxAttempts Maximum number of polling attempts
   * @returns A function to stop polling
   */
  pollAppraisalStatus(
    appraisalId: string,
    onStatusChange: (status: string) => void,
    interval: number = 5000,
    maxAttempts: number = 60
  ) {
    let attempts = 0;
    let currentStatus = '';
    
    const poll = async () => {
      try {
        const status = await this.getAppraisalStatus(appraisalId);
        
        if (status !== currentStatus) {
          currentStatus = status;
          onStatusChange(status);
        }
        
        attempts++;
        
        if (status === 'completed' || status === 'cancelled' || attempts >= maxAttempts) {
          return;
        }
        
        setTimeout(poll, interval);
      } catch (error) {
        console.error('Error polling appraisal status:', error);
        setTimeout(poll, interval);
      }
    };
    
    poll();
    
    // Return a function to stop polling
    return () => {
      attempts = maxAttempts;
    };
  }
}; 