import { supabase } from '@/lib/supabase';
import { Appraisal, AppraisalStatus } from "@/types/appraisal";
import { toast } from "@/components/ui/use-toast";

// Helper to map raw Supabase data to Appraisal type
function mapToAppraisal(raw: Record<string, unknown>): Appraisal {
  const allowedStatuses: AppraisalStatus[] = ["draft", "processing", "published", "claimed", "completed", "cancelled"];
  const statusRaw = raw.status as string;
  const status = allowedStatuses.includes(statusRaw as AppraisalStatus)
    ? (statusRaw as AppraisalStatus)
    : "draft";
  return {
    id: (raw.id as string) ?? "",
    property_address: (raw.property_address as string) ?? "",
    property_type: (raw.property_type as string) ?? "Unknown",
    bedrooms: (raw.bedrooms as number) ?? 0,
    bathrooms: (raw.bathrooms as number) ?? 0,
    land_size: (raw.land_size as number) ?? 0,
    created_at: (raw.created_at as string) ?? "",
    status,
    estimated_value_min: (raw.estimated_value_min as number) ?? 0,
    estimated_value_max: (raw.estimated_value_max as number) ?? 0,
    customer_name: (raw.customer_name as string) ?? "",
    customer_email: (raw.customer_email as string) ?? "",
    customer_phone: (raw.customer_phone as string) ?? "",
    agent_id: (raw.agent_id as string) ?? null,
    claimed_at: (raw.claimed_at as string) ?? null,
    agent_notes: (raw.agent_notes as string) ?? "",
    completed_at: (raw.completed_at as string) ?? null,
    final_value: (raw.final_value as number) ?? null,
    completion_notes: (raw.completion_notes as string) ?? "",
    // Add any additional fields as needed, with safe defaults
    // ...
  };
}

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
    
    return (data ?? []).map(mapToAppraisal);
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
    
    return (data ?? []).map(mapToAppraisal);
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
