import { User } from "@/types/auth";

export type TeamRole = "owner" | "admin" | "member";

export interface Team {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  profile_id: string;
  role: TeamRole;
  created_at: string;
  updated_at: string;
  profiles?: User;
} 