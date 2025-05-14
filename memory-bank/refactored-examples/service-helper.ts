/**
 * Base Service Helper
 * 
 * This utility provides common functionality for service operations,
 * including standardized error handling, response formatting, and
 * retry mechanisms.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

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
 * Execute a service operation with standardized error handling and retries
 */
export async function executeServiceOperation<TInput, TOutput>(
  operation: (input: TInput) => Promise<TOutput>,
  input: TInput,
  inputSchema?: z.ZodType<TInput>,
  outputSchema?: z.ZodType<TOutput>,
  options: ServiceOperationOptions = DEFAULT_OPTIONS
): Promise<ServiceResponse<TOutput>> {
  const { maxRetries = 3, retryDelay = 500, validateInput = true, validateOutput = true } = options;
  
  // Validate input if schema provided and validation enabled
  if (inputSchema && validateInput) {
    try {
      inputSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Input validation failed',
          data: null,
          metadata: {
            category: ErrorCategory.VALIDATION,
            details: error.errors
          }
        };
      }
    }
  }
  
  // Execute the operation with retries
  let attempts = 0;
  let lastError: unknown = null;
  
  while (attempts <= maxRetries!) {
    try {
      const result = await operation(input);
      
      // Validate output if schema provided and validation enabled
      if (outputSchema && validateOutput) {
        try {
          outputSchema.parse(result);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error('Output validation failed:', error.errors);
            return {
              success: false,
              error: 'Output validation failed',
              data: null,
              metadata: {
                category: ErrorCategory.SERVER_ERROR,
                details: error.errors
              }
            };
          }
        }
      }
      
      return {
        success: true,
        error: null,
        data: result
      };
    } catch (error) {
      lastError = error;
      attempts++;
      
      // If we've reached max retries, break
      if (attempts > maxRetries!) {
        break;
      }
      
      // Exponential backoff for retries
      const delay = retryDelay! * Math.pow(2, attempts - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Handle the error
  return formatErrorResponse(lastError);
}

/**
 * Format an error into a standardized response
 */
export function formatErrorResponse<T = unknown>(error: unknown): ServiceResponse<T> {
  console.error('Service operation error:', error);
  
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
    return executeServiceOperation(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        return data as T;
      },
      {},
      undefined,
      schema
    );
  }
  
  /**
   * Get a list of records
   */
  async list(options: {
    filters?: Record<string, unknown>,
    page?: number,
    pageSize?: number,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc'
  } = {}, schema?: z.ZodType<T[]>): Promise<ServiceResponse<T[]>> {
    const { filters = {}, page = 1, pageSize = 10, orderBy = 'created_at', orderDirection = 'desc' } = options;
    
    return executeServiceOperation(
      async () => {
        let query = this.client
          .from(this.tableName)
          .select('*')
          .order(orderBy, { ascending: orderDirection === 'asc' });
          
        // Apply pagination
        const start = (page - 1) * pageSize;
        query = query.range(start, start + pageSize - 1);
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        
        const { data, error } = await query;
        if (error) throw error;
        return data as T[];
      },
      {},
      undefined,
      schema
    );
  }
  
  /**
   * Create a new record
   */
  async create(item: Partial<T>, schema?: z.ZodType<T>): Promise<ServiceResponse<T>> {
    return executeServiceOperation(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .insert([item])
          .select()
          .single();
          
        if (error) throw error;
        return data as T;
      },
      item,
      undefined,
      schema
    );
  }
  
  /**
   * Update an existing record
   */
  async update(id: string, updates: Partial<T>, schema?: z.ZodType<T>): Promise<ServiceResponse<T>> {
    return executeServiceOperation(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        return data as T;
      },
      updates,
      undefined,
      schema
    );
  }
  
  /**
   * Delete a record
   */
  async delete(id: string): Promise<ServiceResponse<null>> {
    return executeServiceOperation(
      async () => {
        const { error } = await this.client
          .from(this.tableName)
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        return null;
      },
      {}
    );
  }
} 