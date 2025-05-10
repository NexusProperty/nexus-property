
import { User } from "@/types/auth";

export type AppraisalStatus = 'draft' | 'processing' | 'completed' | 'published' | 'claimed';

export interface PropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  buildingSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  features?: string[];
  [key: string]: any;
}

export interface ComparableProperty {
  address: string;
  salePrice: number;
  saleDate: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  buildingSize?: number;
  yearBuilt?: number;
  distanceFromSubject?: number;
  imageUrl?: string;
  [key: string]: any;
}

export interface MarketAnalysis {
  medianPrice?: number;
  priceChange3Months?: number;
  priceChange12Months?: number;
  averageDaysOnMarket?: number;
  localMarketTrend?: string;
  demandLevel?: string;
  [key: string]: any;
}

export interface Appraisal {
  id: string;
  property_address: string;
  property_details?: PropertyDetails;
  estimated_value_min?: number;
  estimated_value_max?: number;
  comparable_properties?: ComparableProperty[];
  market_analysis?: MarketAnalysis;
  status: AppraisalStatus;
  customer_id?: string;
  agent_id?: string | null;
  report_url?: string | null;
  created_at: string;
  updated_at: string;
}
