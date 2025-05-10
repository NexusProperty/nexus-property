import { supabase } from '../integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

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
    try {
      // Show loading toast
      toast({
        title: "Generating AI content",
        description: "Please wait while we generate the appraisal content...",
      });
      
      // Call the Edge Function to generate AI content
      const { data, error } = await supabase.functions.invoke('ai-integration', {
        body: { property, comparables, marketTrends, isFullAppraisal }
      });
      
      if (error) {
        toast({
          title: "Error generating AI content",
          description: error.message,
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
      toast({
        title: "Error generating AI content",
        description: "An unexpected error occurred while generating the appraisal content.",
        variant: "destructive"
      });
      throw error;
    }
  }
}; 