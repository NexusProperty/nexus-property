import { supabase } from "@/lib/supabase";
import { Appraisal } from "@/types/appraisal";
import { toast } from "@/components/ui/use-toast";

// Define a type for property details
interface PropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  property_type?: string;
  year_built?: number;
  lot_size?: number;
  features?: string[];
  // Add any other specific properties that might be needed
  additional_features?: string;
  condition?: string;
  renovation_history?: string;
}

export const fetchCustomerAppraisals = async (): Promise<Appraisal[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from("appraisals")
      .select("*")
      .eq("customer_id", user.id)
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

export const fetchAppraisalById = async (id: string): Promise<Appraisal | null> => {
  try {
    const { data, error } = await supabase
      .from("appraisals")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      console.error("Error fetching appraisal:", error);
      toast({
        title: "Error fetching appraisal",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
    
    return data as Appraisal;
  } catch (error) {
    console.error("Unexpected error fetching appraisal:", error);
    toast({
      title: "Error fetching appraisal",
      description: "An unexpected error occurred while fetching the appraisal.",
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

export const createAppraisal = async (
  property_address: string,
  property_details: PropertyDetails,
  additional_notes?: string
): Promise<Appraisal | null> => {
  try {
    // Get the session to include the auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("User not authenticated");
    }
    
    // Call the Edge Function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-appraisal`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          property_address,
          property_details,
          additional_notes,
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create appraisal");
    }
    
    const { data } = await response.json();
    
    toast({
      title: "Appraisal created successfully",
      description: "Your appraisal request has been submitted and is being processed.",
    });
    
    return data as Appraisal;
  } catch (error) {
    console.error("Error creating appraisal:", error);
    toast({
      title: "Error creating appraisal",
      description: error instanceof Error ? error.message : "An unexpected error occurred.",
      variant: "destructive"
    });
    return null;
  }
};

export const claimAppraisal = async (id: string): Promise<boolean> => {
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
      .eq("id", id);
      
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

// Fetch all available appraisals (not claimed)
export const fetchAvailableAppraisals = async (): Promise<Appraisal[]> => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching available appraisals:', error);
    throw error;
  }
};

// Fetch appraisals claimed by the current agent
export const fetchAgentAppraisals = async (agentId: string): Promise<Appraisal[]> => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching agent appraisals:', error);
    throw error;
  }
};

// Create a new appraisal request
export const createAppraisalRequest = async (
  appraisalData: Omit<Appraisal, 'id' | 'created_at' | 'status' | 'agent_id'>
): Promise<Appraisal> => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .insert({
        ...appraisalData,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating appraisal request:', error);
    throw error;
  }
};

// Update an appraisal
export const updateAppraisal = async (
  appraisalId: string,
  updateData: Partial<Appraisal>
): Promise<Appraisal> => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .update(updateData)
      .eq('id', appraisalId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating appraisal:', error);
    throw error;
  }
};

// Complete an appraisal
export const completeAppraisal = async (
  appraisalId: string,
  finalValue: number,
  notes?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('appraisals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        final_value: finalValue,
        completion_notes: notes || null
      })
      .eq('id', appraisalId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error completing appraisal:', error);
    throw error;
  }
};

// Dashboard metrics type
export interface AgentDashboardMetrics {
  totalAppraisals: number;
  newLeads: number;
  completedThisMonth: number;
  monthlyCompleted: { month: string; completed: number }[];
}

// Fetch dashboard metrics for the agent dashboard
export async function fetchAgentDashboardMetrics(): Promise<AgentDashboardMetrics> {
  // Get the current user
  const userResponse = await supabase.auth.getUser();
  const user = userResponse.data.user;
  if (!user) throw new Error("Not authenticated");
  const agentId = user.id;

  // Fetch total appraisals claimed by this agent
  const { data: appraisals, error } = await supabase
    .from("appraisals")
    .select("id, status, completed_at, created_at")
    .eq("agent_id", agentId);
  if (error || !appraisals) throw error || new Error("No data");

  // Total appraisals
  const totalAppraisals = appraisals.length;
  // New leads (status = 'claimed' or 'published' but not completed)
  const newLeads = appraisals.filter(a => a.status === "claimed" || a.status === "published").length;
  // Completed this month
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const completedThisMonth = appraisals.filter(a => {
    if (!a.completed_at) return false;
    const d = new Date(a.completed_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;
  // Monthly completed for chart (last 12 months)
  const monthlyCompleted: { month: string; completed: number }[] = [];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (let i = 0; i < 12; i++) {
    const monthIdx = (thisMonth - i + 12) % 12;
    const year = thisMonth - i < 0 ? thisYear - 1 : thisYear;
    const count = appraisals.filter(a => {
      if (!a.completed_at) return false;
      const d = new Date(a.completed_at);
      return d.getMonth() === monthIdx && d.getFullYear() === year;
    }).length;
    monthlyCompleted.unshift({ month: months[monthIdx], completed: count });
  }
  return {
    totalAppraisals,
    newLeads,
    completedThisMonth,
    monthlyCompleted,
  };
}
