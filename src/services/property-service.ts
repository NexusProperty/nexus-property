import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, ServiceResponse } from '@/lib/service-helper';
import { Database } from '@/types/supabase';
import { 
  createPropertySchema, 
  updatePropertySchema, 
  propertySearchSchema 
} from '@/types/property-schema';
import { z } from 'zod';

// Database types
type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

/**
 * Property Service Class
 * Uses the BaseService utility for common database operations
 */
export class PropertyService extends BaseService<Property> {
  constructor(client: SupabaseClient) {
    super(client, 'properties');
  }
  
  /**
   * Get properties for a specific user with pagination
   */
  async getUserProperties(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<ServiceResponse<Property[]>> {
    const { 
      page = 1, 
      pageSize = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;
    
    return this.list({
      filters: { owner_id: userId },
      page,
      pageSize,
      orderBy: sortBy,
      orderDirection: sortOrder
    });
  }
  
  /**
   * Search properties by address terms
   */
  async searchProperties(
    searchTerm: string,
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ServiceResponse<Property[]>> {
    const { page = 1, pageSize = 10 } = options;
    
    try {
      // Validate input
      const validationResult = propertySearchSchema.safeParse({ searchTerm, userId });
      
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Input validation failed',
          data: null,
          metadata: {
            validationErrors: validationResult.error.issues
          }
        };
      }
      
      // Use the client directly as this is a more complex query
      // that our BaseService doesn't directly support
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Get total count
      const countQuery = await this.client
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .or(`address.ilike.%${searchTerm}%,suburb.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
        
      if (countQuery.error) throw countQuery.error;
      
      const totalCount = countQuery.count || 0;
      
      // Get the data
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('owner_id', userId)
        .or(`address.ilike.%${searchTerm}%,suburb.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / pageSize);
      
      return {
        success: true,
        error: null,
        data,
        metadata: {
          pagination: {
            currentPage: page,
            pageSize,
            totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1
          }
        }
      };
    } catch (error) {
      console.error('Error searching properties:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        data: null
      };
    }
  }
  
  /**
   * Create a new property with input validation
   */
  async createProperty(property: PropertyInsert): Promise<ServiceResponse<Property>> {
    return this.create(property, createPropertySchema);
  }
  
  /**
   * Update a property with input validation
   */
  async updateProperty(id: string, updates: PropertyUpdate): Promise<ServiceResponse<Property>> {
    return this.update(id, updates, updatePropertySchema);
  }
  
  /**
   * Get similar properties based on location and property type
   */
  async getSimilarProperties(
    propertyId: string,
    limit: number = 3
  ): Promise<ServiceResponse<Property[]>> {
    try {
      // First get the property details to match against
      const propertyResult = await this.getById(propertyId);
      
      if (!propertyResult.success || !propertyResult.data) {
        return {
          success: false,
          error: propertyResult.error || 'Failed to fetch property details',
          data: null
        };
      }
      
      const property = propertyResult.data;
      
      // Find similar properties in the same suburb with the same property type
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('suburb', property.suburb)
        .eq('property_type', property.property_type)
        .neq('id', propertyId) // Exclude the current property
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return {
        success: true,
        error: null,
        data
      };
    } catch (error) {
      console.error('Error fetching similar properties:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        data: null
      };
    }
  }
  
  /**
   * Upload a property image
   */
  async uploadPropertyImage(
    propertyId: string,
    file: File
  ): Promise<ServiceResponse<{ path: string }>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
  
      const { error: uploadError } = await this.client.storage
        .from('property-images')
        .upload(filePath, file);
  
      if (uploadError) throw uploadError;
  
      // Get the public URL
      const { data } = this.client.storage.from('property-images').getPublicUrl(filePath);
  
      return {
        success: true,
        error: null,
        data: { path: data.publicUrl }
      };
    } catch (error) {
      console.error('Error uploading property image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        data: null
      };
    }
  }
  
  /**
   * Get properties by team
   */
  async getTeamProperties(teamId: string): Promise<ServiceResponse<Property[]>> {
    try {
      // Using a stored procedure to get properties owned by members of the team
      const { data, error } = await this.client
        .rpc('get_team_properties', { team_id: teamId });
      
      if (error) throw error;
      
      return {
        success: true,
        error: null,
        data: data as Property[]
      };
    } catch (error) {
      console.error('Error fetching team properties:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        data: null
      };
    }
  }
} 