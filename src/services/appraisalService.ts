import { supabase } from "@/lib/supabase";
import { Appraisal, AppraisalStatus } from "@/types/appraisal";
import { toast } from "@/components/ui/use-toast";
// import type { Json } from "@/types/supabase";
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

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
    
    // Use mapToAppraisal for each item and cast as unknown as Appraisal[]
    return ((Array.isArray(data) ? data : []).filter(d => d && typeof d === 'object' && 'id' in d).map(mapToAppraisal)) as unknown as Appraisal[];
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
    
    // Use mapToAppraisal if data is valid, else return null
    return data && typeof data === 'object' && 'id' in data ? mapToAppraisal(data) : null;
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

// Helper to map raw Supabase data to Appraisal type
function mapToAppraisal(raw: Record<string, unknown>): Appraisal {
  // Only map if required fields are present
  if (!raw || typeof raw !== 'object' || !('id' in raw) || !('property_address' in raw)) {
    throw new Error('Invalid appraisal data');
  }
  // Runtime checks for fields that may be {} or null
  const report_url = typeof raw.report_url === 'string' ? raw.report_url : null;
  const customer_id = typeof raw.customer_id === 'string' ? raw.customer_id : null;
  const comparable_properties = Array.isArray(raw.comparable_properties) ? raw.comparable_properties : null;
  const market_analysis = typeof raw.market_analysis === 'object' && raw.market_analysis !== null ? raw.market_analysis : null;
  const property_details = typeof raw.property_details === 'object' && raw.property_details !== null ? raw.property_details : null;
  return {
    id: raw.id as string,
    property_address: raw.property_address as string,
    property_type: raw.property_type as string,
    bedrooms: raw.bedrooms as number,
    bathrooms: raw.bathrooms as number,
    land_size: raw.land_size as number,
    created_at: raw.created_at as string,
    status: raw.status as Appraisal["status"], // AppraisalStatus includes 'cancelled'
    estimated_value_min: raw.estimated_value_min as number,
    estimated_value_max: raw.estimated_value_max as number,
    customer_name: raw.customer_name as string,
    customer_email: raw.customer_email as string,
    customer_phone: raw.customer_phone as string,
    agent_id: raw.agent_id as string | undefined,
    claimed_at: raw.claimed_at as string | undefined,
    completed_at: raw.completed_at as string | undefined,
    final_value: raw.final_value as number | undefined,
    agent_notes: raw.agent_notes as string | undefined,
    completion_notes: raw.completion_notes as string | undefined,
    property_details,
    report_url,
    customer_id,
    comparable_properties,
    market_analysis,
  };
}

export const fetchAvailableAppraisals = async (): Promise<Appraisal[]> => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    // Filter out any non-object results, then cast as Appraisal[]
    // TypeScript can't guarantee the shape, but our runtime check in mapToAppraisal ensures it
    return ((Array.isArray(data) ? data : []).filter(d => d && typeof d === 'object' && 'id' in d).map(mapToAppraisal)) as unknown as Appraisal[];
  } catch (error) {
    console.error('Error fetching available appraisals:', error);
    throw error;
  }
};

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
    // Filter out any non-object results, then cast as Appraisal[]
    // TypeScript can't guarantee the shape, but our runtime check in mapToAppraisal ensures it
    return ((Array.isArray(data) ? data : []).filter(d => d && typeof d === 'object' && 'id' in d).map(mapToAppraisal)) as unknown as Appraisal[];
  } catch (error) {
    console.error('Error fetching agent appraisals:', error);
    throw error;
  }
};

export const createAppraisalRequest = async (
  appraisalData: Omit<Appraisal, 'id' | 'created_at' | 'status' | 'agent_id'>
): Promise<Appraisal> => {
  try {
    // Always set status to 'published' for new appraisal requests
    const { data, error } = await supabase
      .from('appraisals')
      .insert({
        ...appraisalData,
        comparable_properties: appraisalData.comparable_properties as Json,
        market_analysis: appraisalData.market_analysis as Json,
        property_details: appraisalData.property_details as Json,
        status: 'published',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) {
      throw error;
    }
    if (!data || typeof data !== 'object' || !('id' in data)) {
      throw new Error('Invalid appraisal data returned');
    }
    return mapToAppraisal(data);
  } catch (error) {
    console.error('Error creating appraisal request:', error);
    throw error;
  }
};

// Helper to narrow status to allowed values for Supabase
function getAllowedStatus(status: AppraisalStatus | undefined): "draft" | "processing" | "published" | "claimed" | "completed" | undefined {
  const allowedStatuses = ["draft", "processing", "published", "claimed", "completed"];
  if (status && allowedStatuses.includes(status)) {
    return status as "draft" | "processing" | "published" | "claimed" | "completed";
  }
  return undefined;
}

export const updateAppraisal = async (
  appraisalId: string,
  updateData: Partial<Appraisal>
): Promise<Appraisal> => {
  try {
    // Omit status from the spread if not allowed
    const { status, ...rest } = updateData;
    const allowedStatus = getAllowedStatus(status);
    const updatePayload = {
      ...rest,
      comparable_properties: updateData.comparable_properties as Json,
      market_analysis: updateData.market_analysis as Json,
      property_details: updateData.property_details as Json,
      ...(allowedStatus ? { status: allowedStatus } : {})
    };
    const { data, error } = await supabase
      .from('appraisals')
      .update(updatePayload)
      .eq('id', appraisalId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    if (!data || typeof data !== 'object' || !('id' in data)) {
      throw new Error('Invalid appraisal data returned');
    }
    return mapToAppraisal(data);
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

// Type guard for dashboard metrics
function isAppraisalSummary(a: unknown): a is { status: string; completed_at?: string } {
  return typeof a === 'object' && a !== null && 'status' in a;
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
  // Use type guard in all relevant filters/maps
  const totalAppraisals = (Array.isArray(appraisals) ? appraisals : []).filter(isAppraisalSummary).length;
  const newLeads = (Array.isArray(appraisals) ? appraisals : []).filter(a => isAppraisalSummary(a) && (a.status === "claimed" || a.status === "published")).length;
  // Restore these declarations before usage
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const completedThisMonth = (Array.isArray(appraisals) ? appraisals : []).filter(a => isAppraisalSummary(a) && a.completed_at && (() => { const d = new Date(a.completed_at as string); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })()).length;
  const monthlyCompleted: { month: string; completed: number }[] = [];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (let i = 0; i < 12; i++) {
    const monthIdx = (thisMonth - i + 12) % 12;
    const year = thisMonth - i < 0 ? thisYear - 1 : thisYear;
    const count = (Array.isArray(appraisals) ? appraisals : []).filter(a => isAppraisalSummary(a) && a.completed_at && (() => { const d = new Date(a.completed_at as string); return d.getMonth() === monthIdx && d.getFullYear() === year; })()).length;
    monthlyCompleted.unshift({ month: months[monthIdx], completed: count });
  }
  return {
    totalAppraisals,
    newLeads,
    completedThisMonth,
    monthlyCompleted,
  };
}
