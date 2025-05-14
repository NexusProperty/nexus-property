# Service Layer Documentation

This document details the architecture, patterns, and best practices for the service layer in the Nexus Property application.

## Overview

The service layer in Nexus Property is designed as an abstraction between the UI/presentation layer and the data access layer. It encapsulates business logic, data transformations, and external API interactions.

Key responsibilities:
- Input validation
- Error handling
- Business logic implementation
- Data fetching and manipulation
- External API integration

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   UI Layer      │────▶│  Service Layer  │────▶│  Data Layer     │
│ (Components)    │     │  (Business      │     │ (Supabase,      │
│                 │◀────│   Logic)        │◀────│  External APIs) │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Structure

The service layer is organized by domain:

- `src/services/auth.ts` - Authentication services
- `src/services/property.ts` - Property-related services
- `src/services/property-valuation.ts` - Valuation services
- `src/services/appraisal.ts` - Appraisal services
- `src/services/user.ts` - User profile services

## Core Utilities

### Service Helper

The `src/lib/service-helper.ts` provides core utilities used across all services:

```typescript
// Common error categories
export enum ErrorCategory {
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  NOT_FOUND = 'not_found_error',
  NETWORK = 'network_error',
  SERVER = 'server_error',
  DATABASE = 'database_error',
  UNKNOWN = 'unknown_error',
}

// Standard result type for all services
export interface ServiceResult<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
  validationErrors?: z.ZodIssue[];
  metadata?: Record<string, unknown>;
}

// Error handling utility
export function handleServiceError(
  error: unknown, 
  options?: {
    defaultMessage?: string;
    category?: ErrorCategory;
  }
): ServiceResult<never> {
  // Implementation details...
}
```

### Result Pattern

All services return a consistent result structure:

```typescript
{
  success: true | false,
  error: string | null,
  data: T | null,
  validationErrors?: z.ZodIssue[],
  metadata?: Record<string, unknown>
}
```

This pattern:
- Makes error handling consistent
- Provides type safety for data
- Includes validation errors when relevant
- Supports metadata for additional context

## Implementation Patterns

### Input Validation with Zod

All service functions validate inputs using Zod schemas:

```typescript
// Schema definition
export const propertySchema = z.object({
  address: z.string().min(3),
  price: z.number().positive(),
  bedrooms: z.number().int().positive(),
  // ...more fields
});

// Validation in service
export async function createProperty(data: PropertyInput): Promise<ServiceResult<Property>> {
  try {
    // Validate input
    const validationResult = propertySchema.safeParse(data);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: validationResult.error.issues,
      };
    }
    
    // Proceed with validated data
    const validData = validationResult.data;
    
    // Implementation...
  } catch (error) {
    return handleServiceError(error);
  }
}
```

### Error Handling

Services use a standardized error handling approach:

1. All functions are wrapped in try/catch blocks
2. Errors are passed to the `handleServiceError` utility
3. Errors are categorized for consistent handling
4. User-friendly error messages are returned

```typescript
try {
  // Service implementation
} catch (error) {
  return handleServiceError(error, {
    defaultMessage: 'Failed to create property',
    category: ErrorCategory.DATABASE,
  });
}
```

### Async/Await Pattern

All asynchronous operations use the async/await pattern:

```typescript
export async function getProperty(id: string): Promise<ServiceResult<Property>> {
  try {
    // Validate ID
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid property ID',
        data: null,
      };
    }
    
    // Fetch property
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!data) {
      return {
        success: false,
        error: 'Property not found',
        data: null,
        metadata: { category: ErrorCategory.NOT_FOUND },
      };
    }
    
    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    return handleServiceError(error);
  }
}
```

### Pagination Support

List operations support pagination:

```typescript
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listProperties(
  filters?: PropertyFilters,
  pagination?: PaginationOptions
): Promise<ServiceResult<PaginatedResult<Property>>> {
  try {
    const { page = 1, pageSize = 10 } = pagination || {};
    const startIndex = (page - 1) * pageSize;
    
    // Base query
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' });
    
    // Apply filters if provided
    if (filters) {
      // Apply filters to query
    }
    
    // Apply pagination
    query = query
      .range(startIndex, startIndex + pageSize - 1)
      .order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      success: true,
      error: null,
      data: {
        items: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  } catch (error) {
    return handleServiceError(error);
  }
}
```

## Best Practices

### 1. Function Design

- Keep functions focused on a single responsibility
- Use descriptive function names that indicate what they do
- Document parameters and return values
- Implement proper error handling
- Validate all inputs
- Return consistent result structures

### 2. Business Logic Encapsulation

- Keep business logic in the service layer, not in UI components
- Encapsulate related operations in the same service
- Split complex operations into smaller helper functions
- Use dependency injection for external dependencies

### 3. Error Handling

- Catch and handle all errors
- Categorize errors appropriately
- Provide user-friendly error messages
- Include detailed error information for debugging
- Don't expose sensitive information in error messages

### 4. Performance Considerations

- Optimize database queries
- Implement pagination for list operations
- Use caching where appropriate
- Consider batch operations for multiple items
- Minimize unnecessary data transformations

## Testing

Services are tested with unit tests:

```typescript
describe('PropertyService', () => {
  beforeEach(() => {
    // Set up test environment
  });
  
  it('should validate input when creating a property', async () => {
    // Arrange
    const invalidData = { /* invalid data */ };
    
    // Act
    const result = await createProperty(invalidData);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.validationErrors).toBeDefined();
  });
  
  it('should successfully create a property with valid data', async () => {
    // Arrange
    const validData = { /* valid data */ };
    
    // Act
    const result = await createProperty(validData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.id).toBeDefined();
  });
});
```

## Integration with UI Components

The service layer is used in UI components through custom hooks:

```typescript
// Custom hook for property data
export function usePropertyData(propertyId: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchProperty() {
      setIsLoading(true);
      setError(null);
      
      const result = await getProperty(propertyId);
      
      if (result.success) {
        setProperty(result.data);
      } else {
        setError(result.error);
      }
      
      setIsLoading(false);
    }
    
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);
  
  return { property, isLoading, error };
}
```

## Future Improvements

1. **Caching Layer**: Implement a caching strategy for frequently accessed data
2. **Service Modularity**: Further break down services into smaller, focused modules
3. **Request Queue**: Add support for queuing and batching requests
4. **Offline Support**: Implement offline functionality with local storage
5. **Metrics Collection**: Add performance monitoring and metrics collection 