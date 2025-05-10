import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Integration object structure (for documentation only):
 * {
 *   id: string;
 *   user_id: string | null;
 *   team_id: string | null;
 *   name: string;
 *   provider: string;
 *   config: any;
 *   created_at: string;
 *   updated_at: string;
 * }
 */
// NOTE: Type annotations are omitted in this file due to a TypeScript bug with recursive types (e.g., Json). See: https://github.com/microsoft/TypeScript/issues/34933
// Cast to the correct type at the usage boundary (UI/business logic) if needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToIntegration(raw) {
  return {
    id: (raw.id) ?? "",
    user_id: (raw.user_id) ?? null,
    team_id: (raw.team_id) ?? null,
    name: (raw.name) ?? "",
    provider: (raw.provider) ?? "",
    config: raw.config ?? {},
    created_at: (raw.created_at) ?? "",
    updated_at: (raw.updated_at) ?? "",
  };
}

// Fetch all integrations for the current user (including team integrations)
export async function fetchUserIntegrations() {
  try {
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;
    if (!user) throw new Error("Not authenticated");

    // Fetch user's own integrations
    const { data: userIntegrations, error: userError } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id);
    if (userError) throw userError;

    // Fetch team IDs where user is a member
    interface TeamMember {
      team_id: string;
    }
    
    // Use a type assertion to bypass the TypeScript error
    // @ts-expect-error - Type instantiation is excessively deep and possibly infinite
    const { data: teamMemberships, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('profile_id', user.id);
    
    if (teamError) throw teamError;
    const teamIds = (teamMemberships as TeamMember[] || []).map((tm) => tm.team_id);

    // Fetch integrations for those teams
    let teamIntegrations = [];
    if (teamIds.length > 0) {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .in("team_id", teamIds);
      if (error) throw error;
      teamIntegrations = (data ?? []).map(mapToIntegration);
    }

    return [
      ...((userIntegrations ?? []).map(mapToIntegration)),
      ...teamIntegrations
    ];
  } catch (error) {
    console.error("Error fetching integrations:", error);
    toast({
      title: "Error fetching integrations",
      description: "An error occurred while fetching integrations.",
      variant: "destructive"
    });
    return [];
  }
}

// Create a new integration
export async function createIntegration(integration) {
  try {
    const { data, error } = await supabase
      .from("integrations")
      .insert([integration])
      .select()
      .single();
    if (error) throw error;
    toast({ title: "Integration created" });
    return data ? mapToIntegration(data) : null;
  } catch (error) {
    console.error("Error creating integration:", error);
    toast({
      title: "Error creating integration",
      description: "An error occurred while creating the integration.",
      variant: "destructive"
    });
    return null;
  }
}

// Update an integration
export async function updateIntegration(id, updates) {
  try {
    const { data, error } = await supabase
      .from("integrations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    toast({ title: "Integration updated" });
    return data ? mapToIntegration(data) : null;
  } catch (error) {
    console.error("Error updating integration:", error);
    toast({
      title: "Error updating integration",
      description: "An error occurred while updating the integration.",
      variant: "destructive"
    });
    return null;
  }
}

// Delete an integration
export async function deleteIntegration(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("id", id);
    if (error) throw error;
    toast({ title: "Integration deleted" });
    return true;
  } catch (error) {
    console.error("Error deleting integration:", error);
    toast({
      title: "Error deleting integration",
      description: "An error occurred while deleting the integration.",
      variant: "destructive"
    });
    return false;
  }
} 