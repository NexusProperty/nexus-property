import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface Integration {
  id: string;
  user_id: string | null;
  team_id: string | null;
  name: string;
  provider: string;
  config: Json;
  created_at: string;
  updated_at: string;
}

// Fetch all integrations for the current user (including team integrations)
export async function fetchUserIntegrations(): Promise<Integration[]> {
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
    const { data: teamMemberships, error: teamError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("profile_id", user.id);
    if (teamError) throw teamError;
    const teamIds = (teamMemberships || []).map((tm: { team_id: string }) => tm.team_id);

    // Fetch integrations for those teams
    let teamIntegrations: Integration[] = [];
    if (teamIds.length > 0) {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .in("team_id", teamIds);
      if (error) throw error;
      teamIntegrations = (data as Integration[]) || [];
    }

    return [...((userIntegrations as Integration[]) || []), ...teamIntegrations];
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
export async function createIntegration(integration: Omit<Integration, "id" | "created_at" | "updated_at">): Promise<Integration | null> {
  try {
    const { data, error } = await supabase
      .from("integrations")
      .insert([integration])
      .select()
      .single();
    if (error) throw error;
    toast({ title: "Integration created" });
    return data as Integration;
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
export async function updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | null> {
  try {
    const { data, error } = await supabase
      .from("integrations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    toast({ title: "Integration updated" });
    return data as Integration;
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