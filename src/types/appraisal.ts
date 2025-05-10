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
  buildingSize?: number;
  propertyType?: string;
  yearBuilt?: number;
  landSize?: number;
  features?: string[];
  additional_features?: string[];
  condition?: string;
  renovation_history?: string;
}

export interface ComparableProperty {
  address: string;
  salePrice: number;
  bedrooms: number;
  bathrooms: number;
  buildingSize: number;
  saleDate: string;
  distanceFromSubject?: number;
  yearBuilt?: number;
  landSize?: number;
  propertyType?: string;
}

export interface MarketAnalysis {
  medianPrice?: number;
  priceChange3Months?: number;
  priceChange12Months?: number;
  averageDaysOnMarket?: number;
  localMarketTrend?: string;
  demandLevel?: string;
  analysisText?: string;
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
  property_details?: PropertyDetails | null;
  report_url?: string | null;
  customer_id?: string | null;
  comparable_properties?: ComparableProperty[] | null;
  market_analysis?: MarketAnalysis | null;
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
