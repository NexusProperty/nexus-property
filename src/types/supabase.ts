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
      appraisal_history: {
        Row: {
          id: string
          created_at: string
          appraisal_id: string
          user_id: string
          action: string
          changes: Json
        }
        Insert: {
          id?: string
          created_at?: string
          appraisal_id: string
          user_id: string
          action: string
          changes?: Json
        }
        Update: {
          id?: string
          created_at?: string
          appraisal_id?: string
          user_id?: string
          action?: string
          changes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_history_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisal_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      appraisals: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          property_id: string | null
          property_address: string
          property_suburb: string
          property_city: string
          property_type: string
          bedrooms: number | null
          bathrooms: number | null
          land_size: number | null
          floor_area: number | null
          year_built: number | null
          valuation_low: number | null
          valuation_high: number | null
          valuation_confidence: number | null
          status: string
          report_url: string | null
          team_id: string | null
          metadata: Json
          ai_content: Json
          // CoreLogic integration fields
          corelogic_property_id: string | null
          // AI-generated text fields
          ai_market_overview: string | null
          ai_property_description: string | null
          ai_comparable_analysis_text: string | null
          // CoreLogic data fields
          corelogic_avm_estimate: number | null
          corelogic_avm_range_low: number | null
          corelogic_avm_range_high: number | null
          corelogic_avm_confidence: string | null
          reinz_avm_estimate: number | null
          property_activity_summary: Json
          market_statistics_corelogic: Json
          market_statistics_reinz: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          property_id?: string | null
          property_address: string
          property_suburb: string
          property_city: string
          property_type: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          floor_area?: number | null
          year_built?: number | null
          valuation_low?: number | null
          valuation_high?: number | null
          valuation_confidence?: number | null
          status?: string
          report_url?: string | null
          team_id?: string | null
          metadata?: Json
          ai_content?: Json
          // CoreLogic integration fields
          corelogic_property_id?: string | null
          // AI-generated text fields
          ai_market_overview?: string | null
          ai_property_description?: string | null
          ai_comparable_analysis_text?: string | null
          // CoreLogic data fields
          corelogic_avm_estimate?: number | null
          corelogic_avm_range_low?: number | null
          corelogic_avm_range_high?: number | null
          corelogic_avm_confidence?: string | null
          reinz_avm_estimate?: number | null
          property_activity_summary?: Json
          market_statistics_corelogic?: Json
          market_statistics_reinz?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          property_id?: string | null
          property_address?: string
          property_suburb?: string
          property_city?: string
          property_type?: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          floor_area?: number | null
          year_built?: number | null
          valuation_low?: number | null
          valuation_high?: number | null
          valuation_confidence?: number | null
          status?: string
          report_url?: string | null
          team_id?: string | null
          metadata?: Json
          ai_content?: Json
          // CoreLogic integration fields
          corelogic_property_id?: string | null
          // AI-generated text fields
          ai_market_overview?: string | null
          ai_property_description?: string | null
          ai_comparable_analysis_text?: string | null
          // CoreLogic data fields
          corelogic_avm_estimate?: number | null
          corelogic_avm_range_low?: number | null
          corelogic_avm_range_high?: number | null
          corelogic_avm_confidence?: string | null
          reinz_avm_estimate?: number | null
          property_activity_summary?: Json
          market_statistics_corelogic?: Json
          market_statistics_reinz?: Json
        }
        Relationships: [
          {
            foreignKeyName: "appraisals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comparable_properties: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          appraisal_id: string
          address: string
          suburb: string
          city: string
          property_type: string
          bedrooms: number | null
          bathrooms: number | null
          land_size: number | null
          floor_area: number | null
          year_built: number | null
          sale_date: string | null
          sale_price: number | null
          similarity_score: number | null
          adjustment_factor: number | null
          adjusted_price: number | null
          notes: string | null
          image_url: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          appraisal_id: string
          address: string
          suburb: string
          city: string
          property_type: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          floor_area?: number | null
          year_built?: number | null
          sale_date?: string | null
          sale_price?: number | null
          similarity_score?: number | null
          adjustment_factor?: number | null
          adjusted_price?: number | null
          notes?: string | null
          image_url?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          appraisal_id?: string
          address?: string
          suburb?: string
          city?: string
          property_type?: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          floor_area?: number | null
          year_built?: number | null
          sale_date?: string | null
          sale_price?: number | null
          similarity_score?: number | null
          adjustment_factor?: number | null
          adjusted_price?: number | null
          notes?: string | null
          image_url?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "comparable_properties_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          phone: string | null
          organization: string | null
          settings: Json
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          phone?: string | null
          organization?: string | null
          settings?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          phone?: string | null
          organization?: string | null
          settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      properties: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          owner_id: string
          address: string
          suburb: string
          city: string
          postcode: string | null
          property_type: string
          bedrooms: number | null
          bathrooms: number | null
          land_size: number | null
          floor_area: number | null
          year_built: number | null
          features: string[] | null
          images: string[] | null
          is_public: boolean | null
          status: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          owner_id: string
          address: string
          suburb: string
          city: string
          postcode?: string | null
          property_type: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          floor_area?: number | null
          year_built?: number | null
          features?: string[] | null
          images?: string[] | null
          is_public?: boolean | null
          status?: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          owner_id?: string
          address?: string
          suburb?: string
          city?: string
          postcode?: string | null
          property_type?: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          floor_area?: number | null
          year_built?: number | null
          features?: string[] | null
          images?: string[] | null
          is_public?: boolean | null
          status?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          appraisal_id: string
          user_id: string
          file_path: string
          file_size: number | null
          version: number
          is_current: boolean | null
          status: string
          error_message: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          appraisal_id: string
          user_id: string
          file_path: string
          file_size?: number | null
          version?: number
          is_current?: boolean | null
          status?: string
          error_message?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          appraisal_id?: string
          user_id?: string
          file_path?: string
          file_size?: number | null
          version?: number
          is_current?: boolean | null
          status?: string
          error_message?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "reports_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          logo_url: string | null
          owner_id: string
          settings: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          logo_url?: string | null
          owner_id: string
          settings?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          owner_id?: string
          settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
