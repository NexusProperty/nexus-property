export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          role: 'agent' | 'customer' | 'admin'
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          role?: 'agent' | 'customer' | 'admin'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          role?: 'agent' | 'customer' | 'admin'
        }
      }
      teams: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          owner_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          owner_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          owner_id?: string
        }
      }
      team_members: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          team_id: string
          user_id: string
          role: 'member' | 'admin'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          team_id: string
          user_id: string
          role?: 'member' | 'admin'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          team_id?: string
          user_id?: string
          role?: 'member' | 'admin'
        }
      }
      appraisals: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          property_address: string
          property_suburb: string
          property_city: string
          property_type: string
          bedrooms: number | null
          bathrooms: number | null
          land_size: number | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          valuation_low: number | null
          valuation_high: number | null
          market_analysis: string | null
          property_description: string | null
          comparables_commentary: string | null
          report_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          property_address: string
          property_suburb: string
          property_city: string
          property_type: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          valuation_low?: number | null
          valuation_high?: number | null
          market_analysis?: string | null
          property_description?: string | null
          comparables_commentary?: string | null
          report_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          property_address?: string
          property_suburb?: string
          property_city?: string
          property_type?: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          valuation_low?: number | null
          valuation_high?: number | null
          market_analysis?: string | null
          property_description?: string | null
          comparables_commentary?: string | null
          report_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 