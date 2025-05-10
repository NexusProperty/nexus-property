import { User } from "@/types/auth";

export type AppraisalStatus = 
  | "draft" 
  | "processing" 
  | "published" 
  | "claimed" 
  | "completed" 
  | "cancelled";

export interface PropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  property_type?: string;
  year_built?: number;
  lot_size?: number;
  features?: string[];
  additional_features?: string[];
  condition?: string;
  renovation_history?: string;
}

export interface ComparableProperty {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  sold_date: string;
  distance_from_subject?: number;
  year_built?: number;
  lot_size?: number;
  property_type?: string;
}

export interface MarketAnalysis {
  median_price?: number;
  price_change_3_months?: number;
  price_change_12_months?: number;
  average_days_on_market?: number;
  local_market_trend?: string;
  demand_level?: string;
  analysis_text?: string;
}

export interface Appraisal {
  id: string;
  property_address: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  land_size: number;
  created_at: string;
  status: 'pending' | 'claimed' | 'completed' | 'cancelled';
  estimated_value_min: number;
  estimated_value_max: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  agent_id?: string;
  claimed_at?: string;
  completed_at?: string;
  final_value?: number;
  agent_notes?: string;
  completion_notes?: string;
}

export interface AppraisalFormData {
  property_address: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  land_size: number;
  estimated_value_min: number;
  estimated_value_max: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
}
