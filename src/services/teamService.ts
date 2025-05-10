import { supabase } from "@/lib/supabase";
import { Team, TeamMember } from "@/types/team";

/**
 * Fetches all teams for the current user
 */
export const fetchUserTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching teams:", error);
    throw error;
  }

  return data || [];
};

/**
 * Fetches a single team by ID
 */
export const fetchTeamById = async (teamId: string): Promise<Team | null> => {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (error) {
    console.error(`Error fetching team ${teamId}:`, error);
    throw error;
  }

  return data;
};

/**
 * Fetches all members of a team
 */
export const fetchTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  const { data, error } = await supabase
    .from("team_members")
    .select(`
      *,
      profiles:profile_id (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`Error fetching members for team ${teamId}:`, error);
    throw error;
  }

  return data || [];
};

/**
 * Creates a new team
 */
export const createTeam = async (teamData: Partial<Team>): Promise<Team> => {
  const { data, error } = await supabase
    .from("teams")
    .insert(teamData)
    .select()
    .single();

  if (error) {
    console.error("Error creating team:", error);
    throw error;
  }

  return data;
};

/**
 * Updates an existing team
 */
export const updateTeam = async (teamId: string, teamData: Partial<Team>): Promise<Team> => {
  const { data, error } = await supabase
    .from("teams")
    .update(teamData)
    .eq("id", teamId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating team ${teamId}:`, error);
    throw error;
  }

  return data;
};

/**
 * Deletes a team
 */
export const deleteTeam = async (teamId: string): Promise<void> => {
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (error) {
    console.error(`Error deleting team ${teamId}:`, error);
    throw error;
  }
};

/**
 * Adds a member to a team
 */
export const addTeamMember = async (teamId: string, profileId: string, role: string = "member"): Promise<TeamMember> => {
  const { data, error } = await supabase
    .from("team_members")
    .insert({
      team_id: teamId,
      profile_id: profileId,
      role
    })
    .select()
    .single();

  if (error) {
    console.error(`Error adding member to team ${teamId}:`, error);
    throw error;
  }

  return data;
};

/**
 * Updates a team member's role
 */
export const updateTeamMemberRole = async (teamId: string, profileId: string, role: string): Promise<TeamMember> => {
  const { data, error } = await supabase
    .from("team_members")
    .update({ role })
    .eq("team_id", teamId)
    .eq("profile_id", profileId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating member role in team ${teamId}:`, error);
    throw error;
  }

  return data;
};

/**
 * Removes a member from a team
 */
export const removeTeamMember = async (teamId: string, profileId: string): Promise<void> => {
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("profile_id", profileId);

  if (error) {
    console.error(`Error removing member from team ${teamId}:`, error);
    throw error;
  }
}; 