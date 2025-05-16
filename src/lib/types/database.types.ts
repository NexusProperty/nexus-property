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
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
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
        }
        Insert: {
          id?: string
          property_id: string
          created_by: string
          status?: string
          valuation?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          created_by?: string
          status?: string
          valuation?: number
          created_at?: string
          updated_at?: string
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