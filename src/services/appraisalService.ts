
import { supabase } from "@/integrations/supabase/client";
import { Appraisal } from "@/types/appraisal";
import { toast } from "@/components/ui/use-toast";

export const fetchCustomerAppraisals = async (): Promise<Appraisal[]> => {
  try {
    const { data, error } = await supabase
      .from("appraisals")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching appraisals:", error);
      toast({
        title: "Error fetching appraisals",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
    
    return data as Appraisal[];
  } catch (error) {
    console.error("Unexpected error fetching appraisals:", error);
    toast({
      title: "Error fetching appraisals",
      description: "An unexpected error occurred while fetching your appraisals.",
      variant: "destructive"
    });
    return [];
  }
};

export const getAppraisalById = async (id: string): Promise<Appraisal | null> => {
  try {
    const { data, error } = await supabase
      .from("appraisals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching appraisal:", error);
      toast({
        title: "Error fetching appraisal details",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
    
    return data as Appraisal;
  } catch (error) {
    console.error("Unexpected error fetching appraisal:", error);
    toast({
      title: "Error fetching appraisal details",
      description: "An unexpected error occurred while fetching the appraisal details.",
      variant: "destructive"
    });
    return null;
  }
};

export const publishAppraisal = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("appraisals")
      .update({ status: "published" })
      .eq("id", id);
      
    if (error) {
      console.error("Error publishing appraisal:", error);
      toast({
        title: "Error publishing appraisal",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "Appraisal published successfully",
      description: "Your appraisal is now visible to agents.",
    });
    
    return true;
  } catch (error) {
    console.error("Unexpected error publishing appraisal:", error);
    toast({
      title: "Error publishing appraisal",
      description: "An unexpected error occurred while publishing the appraisal.",
      variant: "destructive"
    });
    return false;
  }
};
