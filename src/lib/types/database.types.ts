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
      team_members: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          team_id: string
          user_id: string
          role: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          team_id: string
          user_id: string
          role?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          team_id?: string
          user_id?: string
          role?: string
        }
      },
      teams: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          logo_url: string | null
          owner_id: string
          settings: Json | null
          agency_logo_url: string | null
          agency_primary_color: string | null
          agency_disclaimer_text: string | null
          agency_contact_details: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          logo_url?: string | null
          owner_id: string
          settings?: Json | null
          agency_logo_url?: string | null
          agency_primary_color?: string | null
          agency_disclaimer_text?: string | null
          agency_contact_details?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          owner_id?: string
          settings?: Json | null
          agency_logo_url?: string | null
          agency_primary_color?: string | null
          agency_disclaimer_text?: string | null
          agency_contact_details?: string | null
        }
      },
      profiles: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
          updated_at: string
          agent_photo_url: string | null
          agent_license_number: string | null
          phone: string | null
          address: string | null
          website: string | null
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
          agent_photo_url?: string | null
          agent_license_number?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
          agent_photo_url?: string | null
          agent_license_number?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          address: string
          owner_id: string
          bedrooms: number
          bathrooms: number
          land_area: number
          floor_area: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          address: string
          owner_id: string
          bedrooms: number
          bathrooms: number
          land_area: number
          floor_area: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          address?: string
          owner_id?: string
          bedrooms?: number
          bathrooms?: number
          land_area?: number
          floor_area?: number
          created_at?: string
          updated_at?: string
        }
      }
      appraisals: {
        Row: {
          id: string
          property_id: string
          created_by: string
          status: string
          valuation: number
          created_at: string
          updated_at: string
          corelogic_property_id: string | null
          ai_market_overview: string | null
          ai_property_description: string | null
          ai_comparable_analysis_text: string | null
          corelogic_avm_estimate: number | null
          corelogic_avm_range_low: number | null
          corelogic_avm_range_high: number | null
          corelogic_avm_confidence: string | null
          reinz_avm_estimate: number | null
          property_activity_summary: Json | null
          market_statistics_corelogic: Json | null
          market_statistics_reinz: Json | null
        }
        Insert: {
          id?: string
          property_id: string
          created_by: string
          status?: string
          valuation?: number
          created_at?: string
          updated_at?: string
          corelogic_property_id?: string | null
          ai_market_overview?: string | null
          ai_property_description?: string | null
          ai_comparable_analysis_text?: string | null
          corelogic_avm_estimate?: number | null
          corelogic_avm_range_low?: number | null
          corelogic_avm_range_high?: number | null
          corelogic_avm_confidence?: string | null
          reinz_avm_estimate?: number | null
          property_activity_summary?: Json | null
          market_statistics_corelogic?: Json | null
          market_statistics_reinz?: Json | null
        }
        Update: {
          id?: string
          property_id?: string
          created_by?: string
          status?: string
          valuation?: number
          created_at?: string
          updated_at?: string
          corelogic_property_id?: string | null
          ai_market_overview?: string | null
          ai_property_description?: string | null
          ai_comparable_analysis_text?: string | null
          corelogic_avm_estimate?: number | null
          corelogic_avm_range_low?: number | null
          corelogic_avm_range_high?: number | null
          corelogic_avm_confidence?: string | null
          reinz_avm_estimate?: number | null
          property_activity_summary?: Json | null
          market_statistics_corelogic?: Json | null
          market_statistics_reinz?: Json | null
        }
      }
      comparable_properties: {
        Row: {
          id: string
          appraisal_id: string
          address: string
          sale_price: number
          sale_date: string
          bedrooms: number
          bathrooms: number
          land_area: number
          floor_area: number
          created_at: string
        }
        Insert: {
          id?: string
          appraisal_id: string
          address: string
          sale_price: number
          sale_date: string
          bedrooms: number
          bathrooms: number
          land_area: number
          floor_area: number
          created_at?: string
        }
        Update: {
          id?: string
          appraisal_id?: string
          address?: string
          sale_price?: number
          sale_date?: string
          bedrooms?: number
          bathrooms?: number
          land_area?: number
          floor_area?: number
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          appraisal_id: string
          created_by: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          appraisal_id: string
          created_by: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          appraisal_id?: string
          created_by?: string
          url?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_test_schema: {
        Args: {
          schema_name: string
        }
        Returns: void
      }
      clone_schema_structure: {
        Args: {
          source_schema: string
          target_schema: string
        }
        Returns: void
      }
      drop_test_schema: {
        Args: {
          schema_name: string
        }
        Returns: void
      }
      test_create_user: {
        Args: {
          user_id: string
          email: string
          role: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 