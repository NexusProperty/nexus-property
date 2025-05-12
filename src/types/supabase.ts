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
          avatar_url: string | null
          role: 'agent' | 'customer' | 'admin'
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
          role?: 'agent' | 'customer' | 'admin'
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
          role?: 'agent' | 'customer' | 'admin'
          phone?: string | null
          organization?: string | null
          settings?: Json
        }
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
          property_type: 'house' | 'apartment' | 'townhouse' | 'land' | 'commercial' | 'other'
          bedrooms: number | null
          bathrooms: number | null
          land_size: number | null
          floor_area: number | null
          year_built: number | null
          features: string[] | null
          images: string[] | null
          is_public: boolean
          status: 'active' | 'archived' | 'draft'
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
          property_type: 'house' | 'apartment' | 'townhouse' | 'land' | 'commercial' | 'other'
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          floor_area?: number | null
          year_built?: number | null
          features?: string[] | null
          images?: string[] | null
          is_public?: boolean
          status?: 'active' | 'archived' | 'draft'
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
          property_type?: 'house' | 'apartment' | 'townhouse' | 'land' | 'commercial' | 'other'
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          floor_area?: number | null
          year_built?: number | null
          features?: string[] | null
          images?: string[] | null
          is_public?: boolean
          status?: 'active' | 'archived' | 'draft'
          metadata?: Json
        }
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
          status: 'pending' | 'processing' | 'completed' | 'failed'
          valuation_low: number | null
          valuation_high: number | null
          market_analysis: string | null
          property_description: string | null
          comparables_commentary: string | null
          report_url: string | null
          is_public: boolean
          metadata: Json
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
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          valuation_low?: number | null
          valuation_high?: number | null
          market_analysis?: string | null
          property_description?: string | null
          comparables_commentary?: string | null
          report_url?: string | null
          is_public?: boolean
          metadata?: Json
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
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          valuation_low?: number | null
          valuation_high?: number | null
          market_analysis?: string | null
          property_description?: string | null
          comparables_commentary?: string | null
          report_url?: string | null
          is_public?: boolean
          metadata?: Json
        }
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
          sale_date: string | null
          sale_price: number | null
          property_type: string
          bedrooms: number | null
          bathrooms: number | null
          land_size: number | null
          year_built: number | null
          distance_km: number | null
          similarity_score: number | null
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
          sale_date?: string | null
          sale_price?: number | null
          property_type: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          year_built?: number | null
          distance_km?: number | null
          similarity_score?: number | null
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
          sale_date?: string | null
          sale_price?: number | null
          property_type?: string
          bedrooms?: number | null
          bathrooms?: number | null
          land_size?: number | null
          year_built?: number | null
          distance_km?: number | null
          similarity_score?: number | null
          image_url?: string | null
          metadata?: Json
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
