import { supabase } from "@/integrations/supabase/client";
import { Appraisal } from "@/types/appraisal";
import { toast } from "@/components/ui/use-toast";

export const fetchAgentAppraisals = async (): Promise<Appraisal[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from("appraisals")
      .select("*")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching agent appraisals:", error);
      toast({
        title: "Error fetching appraisals",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
    
    return data as Appraisal[];
  } catch (error) {
    console.error("Unexpected error fetching agent appraisals:", error);
    toast({
      title: "Error fetching appraisals",
      description: "An unexpected error occurred while fetching your appraisals.",
      variant: "destructive"
    });
    return [];
  }
};

export const fetchAppraisalFeed = async (): Promise<Appraisal[]> => {
  try {
    const { data, error } = await supabase
      .from("appraisals")
      .select("*")
      .eq("status", "published")
      .is("agent_id", null)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching appraisal feed:", error);
      toast({
        title: "Error fetching appraisal feed",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
    
    return data as Appraisal[];
  } catch (error) {
    console.error("Unexpected error fetching appraisal feed:", error);
    toast({
      title: "Error fetching appraisal feed",
      description: "An unexpected error occurred while fetching the appraisal feed.",
      variant: "destructive"
    });
    return [];
  }
};

export const claimAppraisal = async (appraisalId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { error } = await supabase
      .from("appraisals")
      .update({ 
        agent_id: user.id,
        status: "claimed"
      })
      .eq("id", appraisalId)
      .eq("status", "published")
      .is("agent_id", null);
      
    if (error) {
      console.error("Error claiming appraisal:", error);
      toast({
        title: "Error claiming appraisal",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "Appraisal claimed successfully",
      description: "You have successfully claimed this appraisal.",
    });
    
    return true;
  } catch (error) {
    console.error("Unexpected error claiming appraisal:", error);
    toast({
      title: "Error claiming appraisal",
      description: "An unexpected error occurred while claiming the appraisal.",
      variant: "destructive"
    });
    return false;
  }
}; 