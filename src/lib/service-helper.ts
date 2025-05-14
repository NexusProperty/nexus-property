/**
 * Base Service Helper
 * 
 * This utility provides common functionality for service operations,
 * including standardized error handling, response formatting, and
 * retry mechanisms.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Standard response format for all service operations
 */
export interface ServiceResponse<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
  metadata?: Record<string, unknown>;
}

/**
 * Error categories for service operations
 */
export enum ErrorCategory {
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown_error'
}

/**
 * Options for service operation execution
 */
export interface ServiceOperationOptions {
  maxRetries?: number;
  retryDelay?: number;
  validateInput?: boolean;
  validateOutput?: boolean;
}

/**
 * Default options for service operations
 */
const DEFAULT_OPTIONS: ServiceOperationOptions = {
  maxRetries: 3,
  retryDelay: 500,
  validateInput: true,
  validateOutput: true
};

/**
 * Format an error into a standardized response
 */
export function formatErrorResponse<T = unknown>(error: unknown): ServiceResponse<T> {
  logger.error('Service operation error:', error);
  
  if (error instanceof Error) {
    // Categorize common errors
    if (error.message.includes('not found') || error.message.includes('404')) {
      return {
        success: false,
        error: error.message,
        data: null,
        metadata: { category: ErrorCategory.NOT_FOUND }
      };
    }
    
    if (error.message.includes('authentication') || error.message.includes('401')) {
      return {
        success: false,
        error: error.message,
        data: null,
        metadata: { category: ErrorCategory.AUTHENTICATION }
      };
    }
    
    if (error.message.includes('permission') || error.message.includes('403')) {
      return {
        success: false,
        error: error.message,
        data: null,
        metadata: { category: ErrorCategory.AUTHORIZATION }
      };
    }
    
    if (error.message.includes('conflict') || error.message.includes('duplicate') || error.message.includes('409')) {
      return {
        success: false,
        error: error.message,
        data: null,
        metadata: { category: ErrorCategory.CONFLICT }
      };
    }
    
    if (error.message.includes('network') || error.message.includes('connection')) {
      return {
        success: false,
        error: error.message,
        data: null,
        metadata: { category: ErrorCategory.NETWORK_ERROR }
      };
    }
    
    // Default error category
    return {
      success: false,
      error: error.message,
      data: null,
      metadata: { category: ErrorCategory.UNKNOWN }
    };
  }
  
  // Handle non-Error objects
  return {
    success: false,
    error: 'An unknown error occurred',
    data: null,
    metadata: { category: ErrorCategory.UNKNOWN }
  };
}

/**
 * Base class for service operations
 * Provides standardized methods for common operations
 */
export abstract class BaseService<T extends Record<string, unknown>> {
  protected client: SupabaseClient;
  protected tableName: string;
  
  constructor(client: SupabaseClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }
  
  /**
   * Get a single record by ID
   */
  async getById(id: string, schema?: z.ZodType<T>): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      return {
        success: true,
        error: null,
        data: data as T
      };
    } catch (error) {
      return formatErrorResponse<T>(error);
    }
  }
  
  /**
   * Get a list of records with pagination
   */
  async list(options: {
    filters?: Record<string, unknown>,
    page?: number,
    pageSize?: number,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc'
  } = {}): Promise<ServiceResponse<T[]>> {
    const { 
      filters = {}, 
      page = 1, 
      pageSize = 10,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = options;
    
    try {
      // Calculate pagination values
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Start building the query
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact' });
      
      // Apply all filters
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      
      // Apply pagination and ordering
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(from, to);
      
      // Execute the query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Calculate pagination metadata
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      return {
        success: true,
        error: null,
        data: data as T[],
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
      return formatErrorResponse<T[]>(error);
    }
  }
  
  /**
   * Create a new record with validation
   */
  async create(item: Partial<T>, schema?: z.ZodType<Partial<T>>): Promise<ServiceResponse<T>> {
    try {
      // Validate input if schema provided
      if (schema) {
        try {
          schema.parse(item);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              success: false,
              error: 'Validation failed',
              data: null,
              metadata: {
                category: ErrorCategory.VALIDATION,
                validationErrors: error.issues
              }
            };
          }
        }
      }
      
      // Insert record
      const { data, error } = await this.client
        .from(this.tableName)
        .insert(item)
        .select('*')
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        error: null,
        data: data as T
      };
    } catch (error) {
      return formatErrorResponse<T>(error);
    }
  }
  
  /**
   * Update a record with validation
   */
  async update(id: string, updates: Partial<T>, schema?: z.ZodType<Partial<T>>): Promise<ServiceResponse<T>> {
    try {
      // Validate input if schema provided
      if (schema) {
        try {
          schema.parse(updates);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              success: false,
              error: 'Validation failed',
              data: null,
              metadata: {
                category: ErrorCategory.VALIDATION,
                validationErrors: error.issues
              }
            };
          }
        }
      }
      
      // Update record
      const { data, error } = await this.client
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        error: null,
        data: data as T
      };
    } catch (error) {
      return formatErrorResponse<T>(error);
    }
  }
  
  /**
   * Delete a record
   */
  async delete(id: string): Promise<ServiceResponse<null>> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return {
        success: true,
        error: null,
        data: null
      };
    } catch (error) {
      return formatErrorResponse<null>(error);
    }
  }
} 