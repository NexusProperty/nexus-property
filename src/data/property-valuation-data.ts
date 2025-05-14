import { supabase } from '@/lib/supabase';
import { Database, Json } from '@/types/supabase';

// Define types for database operations
type Appraisal = Database['public']['Tables']['appraisals']['Row'];
type AppraisalUpdate = Database['public']['Tables']['appraisals']['Update'];
type AppraisalHistory = Database['public']['Tables']['appraisal_history']['Insert'];

/**
 * Data access layer for property valuation operations
 * This class handles all database operations related to property valuations
 */
export class PropertyValuationData {
  /**
   * Update the appraisal with valuation results
   * @param appraisalId - The ID of the appraisal to update
   * @param valuationData - The valuation data to update
   * @returns Whether the update was successful
   */
  async updateValuationResults(
    appraisalId: string,
    valuationData: {
      valuationLow: number;
      valuationHigh: number;
      valuationConfidence: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('appraisals')
        .update({
          valuation_low: valuationData.valuationLow,
          valuation_high: valuationData.valuationHigh,
          valuation_confidence: valuationData.valuationConfidence,
          updated_at: new Date().toISOString()
        })
        .eq('id', appraisalId);
        
      if (error) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Error updating appraisal with valuation results',
          error: error.message,
          appraisalId
        }));
        
        return {
          success: false,
          error: `Failed to update valuation results: ${error.message}`
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Exception updating appraisal with valuation results',
        error: error instanceof Error ? error.message : 'Unknown error',
        appraisalId
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }
  
  /**
   * Update the status of an appraisal
   * @param appraisalId - The ID of the appraisal to update
   * @param status - The new status
   * @param statusInfo - Additional status information
   * @returns Whether the update was successful
   */
  async updateAppraisalStatus(
    appraisalId: string,
    status: string,
    statusInfo: {
      reason: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update the appraisal status
      const { error: updateError } = await supabase
        .from('appraisals')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', appraisalId);
        
      if (updateError) {
        throw new Error(`Failed to update appraisal status: ${updateError.message}`);
      }
      
      // Add entry to status history using appraisal_history table
      const historyEntry: AppraisalHistory = {
        appraisal_id: appraisalId,
        user_id: 'system', // Using 'system' as user ID for automated updates
        action: `STATUS_CHANGE_TO_${status}`,
        changes: {
          status,
          reason: statusInfo.reason,
          metadata: statusInfo.metadata || {}
        } as Json
      };
      
      const { error: historyError } = await supabase
        .from('appraisal_history')
        .insert(historyEntry);
        
      if (historyError) {
        throw new Error(`Failed to insert status history: ${historyError.message}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Exception updating appraisal status',
        error: error instanceof Error ? error.message : 'Unknown error',
        appraisalId,
        status
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  /**
   * Get the eligibility of an appraisal for valuation
   * @param appraisalId - The ID of the appraisal to check
   * @returns The eligibility status and reasons
   */
  async getValuationEligibility(
    appraisalId: string
  ): Promise<{ 
    eligible: boolean; 
    reasons: string[];
    error?: string;
  }> {
    try {
      // Get the appraisal
      const { data: appraisal, error: appraisalError } = await supabase
        .from('appraisals')
        .select('*')
        .eq('id', appraisalId)
        .single();
        
      if (appraisalError) {
        return {
          eligible: false,
          reasons: [`Failed to fetch appraisal: ${appraisalError.message}`],
          error: appraisalError.message
        };
      }
      
      // Count comparable properties
      const { count, error: countError } = await supabase
        .from('comparable_properties')
        .select('*', { count: 'exact', head: true })
        .eq('appraisal_id', appraisalId);
        
      if (countError) {
        return {
          eligible: false,
          reasons: [`Failed to count comparable properties: ${countError.message}`],
          error: countError.message
        };
      }
      
      // Check eligibility criteria
      const reasons: string[] = [];
      
      // Check required property details
      if (!appraisal.property_address) {
        reasons.push('Property address is missing');
      }
      
      if (!appraisal.property_suburb) {
        reasons.push('Property suburb is missing');
      }
      
      if (!appraisal.property_city) {
        reasons.push('Property city is missing');
      }
      
      if (!appraisal.property_type) {
        reasons.push('Property type is missing');
      }
      
      // Check if there are enough comparable properties
      if ((count || 0) < 3) {
        reasons.push(`Not enough comparable properties (${count || 0}/3 minimum)`);
      }
      
      return {
        eligible: reasons.length === 0,
        reasons
      };
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Exception checking valuation eligibility',
        error: error instanceof Error ? error.message : 'Unknown error',
        appraisalId
      }));
      
      return {
        eligible: false,
        reasons: [error instanceof Error ? error.message : 'An unknown error occurred'],
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }
} 