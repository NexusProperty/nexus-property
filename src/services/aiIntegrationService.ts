import { supabase } from '@/lib/supabase';
import { toast } from "@/components/ui/use-toast";

// Define the return type for the Supabase function invoke
interface SupabaseFunctionResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Service for integrating with Google Cloud Vertex AI (Gemini)
 */
export const aiIntegrationService = {
  /**
   * Generate AI content for an appraisal
   * @param property The property data
   * @param comparables The comparable properties data
   * @param marketTrends The market trends data
   * @param isFullAppraisal Whether this is a full appraisal or a limited one
   * @returns The AI-generated content
   */
  async generateAIContent(
    property: {
      address: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      landSize: number;
      yearBuilt?: number;
      title?: string;
      zoning?: string;
      council?: string;
      condition?: string;
      features?: string[];
    },
    comparables: Array<{
      address: string;
      salePrice: number;
      saleDate: string;
      bedrooms: number;
      bathrooms: number;
      landSize: number;
      buildingSize?: number;
      distanceFromSubject: number;
      features?: string[];
    }>,
    marketTrends: {
      medianPrice?: number;
      priceChange3Months?: number;
      priceChange12Months?: number;
      averageDaysOnMarket?: number;
      demandLevel?: string;
      suburbName?: string;
      regionName?: string;
    },
    isFullAppraisal: boolean = true
  ) {
    // Maximum number of retry attempts
    const maxRetries = 3;
    // Delay between retries in milliseconds
    const retryDelay = 1000;
    
    // Retry function
    const retry = async <T>(fn: () => Promise<SupabaseFunctionResponse<T>>, retries: number): Promise<SupabaseFunctionResponse<T>> => {
      try {
        return await fn();
      } catch (error) {
        if (retries <= 0) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Retry with one less retry attempt
        return retry(fn, retries - 1);
      }
    };
    
    try {
      // Show loading toast
      toast({
        title: "Generating AI content",
        description: "Please wait while we generate the appraisal content...",
      });
      
      // Call the Edge Function to generate AI content with retry mechanism
      const { data, error } = await retry(async () => {
        return await supabase.functions.invoke('ai-integration', {
          body: { property, comparables, marketTrends, isFullAppraisal }
        });
      }, maxRetries);
      
      if (error) {
        console.error('Error from Supabase function:', error);
        
        // Provide more specific error messages based on the error type
        let errorMessage = "An error occurred while generating the appraisal content.";
        
        if (error.message.includes('timeout')) {
          errorMessage = "The request timed out. Please try again.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes('permission')) {
          errorMessage = "You don't have permission to perform this action.";
        }
        
        toast({
          title: "Error generating AI content",
          description: errorMessage,
          variant: "destructive"
        });
        throw error;
      }
      
      // Show success toast
      toast({
        title: "AI content generated",
        description: "The appraisal content has been generated successfully.",
      });
      
      return data;
    } catch (error) {
      console.error('Error generating AI content:', error);
      
      // Handle different types of errors
      let errorMessage = "An unexpected error occurred while generating the appraisal content.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error generating AI content",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }
}; 