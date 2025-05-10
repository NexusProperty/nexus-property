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

// Type guard for appraisal data
function isValidAppraisalData(data: unknown): data is Record<string, unknown> {
  return (
    typeof data === 'object' && 
    data !== null && 
    'id' in data && 
    'property_address' in data
  );
}

// Helper to narrow status to allowed values for Supabase
function getAllowedStatus(status: AppraisalStatus | undefined): "draft" | "processing" | "published" | "claimed" | "completed" | undefined {
  const allowedStatuses = ["draft", "processing", "published", "claimed", "completed"];
  if (status && allowedStatuses.includes(status)) {
    return status as "draft" | "processing" | "published" | "claimed" | "completed";
  }
  return undefined;
}

// Helper to map raw Supabase data to Appraisal type
function mapToAppraisal(raw: Record<string, unknown>): Appraisal {
  if (!isValidAppraisalData(raw)) {
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
    status: raw.status as Appraisal["status"],
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

// Helper to handle Supabase errors
function handleSupabaseError(error: unknown, operation: string): never {
  console.error(`Error ${operation}:`, error);
  
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
  
  toast({
    title: `Error ${operation}`,
    description: errorMessage,
    variant: "destructive"
  });
  
  throw error;
}

// Helper to filter and map appraisal data
function processAppraisalData(data: unknown): Appraisal[] {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data
    .filter(isValidAppraisalData)
    .map(mapToAppraisal);
}

/**
 * Fetch appraisals for the current customer
 */
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
      return handleSupabaseError(error, "fetching appraisals");
    }
    
    return processAppraisalData(data);
  } catch (error) {
    return handleSupabaseError(error, "fetching appraisals");
  }
};

/**
 * Fetch a single appraisal by ID
 */
export const fetchAppraisalById = async (id: string): Promise<Appraisal | null> => {
  try {
    const { data, error } = await supabase
      .from("appraisals")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      return handleSupabaseError(error, "fetching appraisal");
    }
    
    return isValidAppraisalData(data) ? mapToAppraisal(data) : null;
  } catch (error) {
    return handleSupabaseError(error, "fetching appraisal");
  }
};

/**
 * Publish an appraisal to make it visible to agents
 */
export const publishAppraisal = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("appraisals")
      .update({ status: "published" })
      .eq("id", id);
      
    if (error) {
      return handleSupabaseError(error, "publishing appraisal");
    }
    
    toast({
      title: "Appraisal published successfully",
      description: "Your appraisal is now visible to agents.",
    });
    
    return true;
  } catch (error) {
    return handleSupabaseError(error, "publishing appraisal");
  }
};

/**
 * Create a new appraisal request
 */
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

/**
 * Claim an appraisal as an agent
 */
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
      return handleSupabaseError(error, "claiming appraisal");
    }
    
    toast({
      title: "Appraisal claimed successfully",
      description: "You have successfully claimed this appraisal.",
    });
    
    return true;
  } catch (error) {
    return handleSupabaseError(error, "claiming appraisal");
  }
};

/**
 * Fetch available appraisals for agents to claim
 */
export const fetchAvailableAppraisals = async (): Promise<Appraisal[]> => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      return handleSupabaseError(error, "fetching available appraisals");
    }
    
    return processAppraisalData(data);
  } catch (error) {
    return handleSupabaseError(error, "fetching available appraisals");
  }
};

/**
 * Fetch appraisals claimed by a specific agent
 */
export const fetchAgentAppraisals = async (agentId: string): Promise<Appraisal[]> => {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      return handleSupabaseError(error, "fetching agent appraisals");
    }
    
    return processAppraisalData(data);
  } catch (error) {
    return handleSupabaseError(error, "fetching agent appraisals");
  }
};

/**
 * Create a new appraisal request
 */
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
      return handleSupabaseError(error, "creating appraisal request");
    }
    
    if (!isValidAppraisalData(data)) {
      throw new Error('Invalid appraisal data returned');
    }
    
    return mapToAppraisal(data);
  } catch (error) {
    return handleSupabaseError(error, "creating appraisal request");
  }
};

/**
 * Update an existing appraisal
 */
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
      return handleSupabaseError(error, "updating appraisal");
    }
    
    if (!isValidAppraisalData(data)) {
      throw new Error('Invalid appraisal data returned');
    }
    
    return mapToAppraisal(data);
  } catch (error) {
    return handleSupabaseError(error, "updating appraisal");
  }
};

/**
 * Complete an appraisal with final value and notes
 */
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
      return handleSupabaseError(error, "completing appraisal");
    }

    return true;
  } catch (error) {
    return handleSupabaseError(error, "completing appraisal");
  }
};

// Dashboard metrics type
export interface AgentDashboardMetrics {
  totalAppraisals: number;
  newLeads: number;
  completedThisMonth: number;
  monthlyCompleted: { month: string; completed: number }[];
}

/**
 * Fetch dashboard metrics for the agent dashboard
 */
export async function fetchAgentDashboardMetrics(): Promise<AgentDashboardMetrics> {
  try {
    // Get the current user
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;
    
    if (!user) {
      throw new Error("Not authenticated");
    }
    
    const agentId = user.id;
    
    // Fetch total appraisals claimed by this agent
    const { data, error } = await supabase
      .from("appraisals")
      .select("id, status, completed_at, created_at")
      .eq("agent_id", agentId);
      
    if (error) {
      return handleSupabaseError(error, "fetching dashboard metrics");
    }
    
    if (!data) {
      throw new Error("No data returned");
    }
    
    // Define the expected structure of our data
    interface AppraisalSummary {
      id: string;
      status: string;
      completed_at?: string;
      created_at: string;
    }
    
    // Process the data with explicit type casting
    const rawData = Array.isArray(data) ? data : [];
    const appraisals: AppraisalSummary[] = [];
    
    // Define a type for the raw item
    type RawAppraisalItem = {
      id: string;
      status: string;
      completed_at?: string;
      created_at: string;
      [key: string]: unknown;
    };
    
    // Manually filter and cast each item
    for (const item of rawData) {
      if (
        typeof item === 'object' && 
        item !== null && 
        'id' in item && 
        'status' in item && 
        'created_at' in item
      ) {
        appraisals.push({
          id: (item as RawAppraisalItem).id,
          status: (item as RawAppraisalItem).status,
          completed_at: 'completed_at' in item ? (item as RawAppraisalItem).completed_at : undefined,
          created_at: (item as RawAppraisalItem).created_at
        });
      }
    }
    
    const totalAppraisals = appraisals.length;
    const newLeads = appraisals.filter(a => a.status === "claimed" || a.status === "published").length;
    
    // Calculate monthly metrics
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const completedThisMonth = appraisals.filter(a => {
      if (!a.completed_at) return false;
      const d = new Date(a.completed_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;
    
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
  } catch (error) {
    return handleSupabaseError(error, "fetching dashboard metrics");
  }
}
