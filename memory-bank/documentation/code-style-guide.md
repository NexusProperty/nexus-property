# Nexus Property Code Style Guide

This document outlines the code style and best practices for the Nexus Property application.

## General Principles

1. **Consistency**: Follow existing patterns in the codebase
2. **Readability**: Write clear, self-documenting code
3. **Maintainability**: Structure code for long-term maintenance
4. **Type Safety**: Leverage TypeScript for better reliability
5. **Component Isolation**: Build modular, reusable components

## File Structure

- One component/service/utility per file
- Use consistent naming conventions:
  - **Component files**: PascalCase (e.g., `PropertyCard.tsx`)
  - **Utility/hook files**: camelCase (e.g., `useAuth.ts`)
  - **Service files**: kebab-case (e.g., `property-service.ts`)
- Group related files in appropriate directories

```
src/
├── components/        # UI components
│   ├── common/        # Shared components
│   ├── layout/        # Layout components
│   └── [feature]/     # Feature-specific components
├── contexts/          # React contexts 
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and constants
├── pages/             # Next.js pages
├── services/          # API and service functions
├── styles/            # Global styles
└── types/             # TypeScript type definitions
```

## TypeScript

- Use explicit typing for all functions, parameters, and return values
- Prefer interfaces for object types that will be extended
- Use type aliases for complex types or unions
- Define reusable types in the `types/` directory
- Avoid using `any` - use proper types or `unknown` when necessary
- Use generics for reusable components and utilities

```typescript
// Good
function fetchData<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json());
}

// Avoid
function fetchData(url: string): Promise<any> {
  return fetch(url).then(res => res.json());
}
```

## React Components

- Prefer functional components with hooks
- Use TypeScript interfaces for props
- Extract complex logic into custom hooks
- Keep components focused on a single responsibility
- Memoize expensive calculations or complex child components

```typescript
// Component Props interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
}

// Functional component with typed props
export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
```

## State Management

- Use React Context for global state
- Keep state as close as possible to where it's used
- Extract complex state logic into custom hooks
- Use reducers for complex state transitions
- Memoize context values to prevent unnecessary re-renders

```typescript
// Using useState for local component state
const [isLoading, setIsLoading] = useState(false);

// Using useReducer for complex state
type State = { count: number; status: 'idle' | 'loading' | 'success' | 'error' };
type Action = { type: 'INCREMENT' } | { type: 'DECREMENT' } | { type: 'RESET' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'RESET':
      return { ...state, count: 0 };
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, { count: 0, status: 'idle' });
```

## Services

- Keep services focused on a single domain
- Use consistent error handling
- Validate all inputs using Zod schemas
- Return standardized response objects
- Use TypeScript for input/output types

```typescript
// Service function with validation and error handling
export async function createProperty(
  propertyData: PropertyInputData
): Promise<ServiceResult<Property>> {
  try {
    // Validate input
    const validationResult = propertySchema.safeParse(propertyData);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validationResult.error.issues,
      };
    }
    
    // Process data
    const data = validationResult.data;
    
    // API call
    const result = await supabase
      .from('properties')
      .insert(data)
      .select()
      .single();
      
    if (result.error) throw result.error;
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return handleServiceError(error);
  }
}
```

## Error Handling

- Use the centralized error handling utility
- Classify errors by category (network, validation, auth, etc.)
- Provide user-friendly error messages
- Log detailed error information for debugging
- Handle async errors consistently with try/catch blocks

```typescript
try {
  await someAsyncOperation();
} catch (error) {
  return handleServiceError(error, {
    defaultMessage: 'Failed to perform operation',
    category: ErrorCategory.DATA,
  });
}
```

## Testing

- Write tests for critical functionality
- Focus on behavior, not implementation details
- Mock external dependencies
- Test error cases as well as happy paths
- Use descriptive test names that explain the behavior being tested

```typescript
describe('PropertyService', () => {
  it('should return validation errors for invalid property data', async () => {
    // Arrange
    const invalidData = { price: 'not a number' };
    
    // Act
    const result = await createProperty(invalidData as any);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.validationErrors).toBeDefined();
  });
});
```

## Imports and Exports

- Use absolute imports with the `@/` prefix for internal modules
- Group imports by type (React, external libraries, internal modules)
- Use named exports for most components and functions
- Use default exports sparingly, primarily for page components

```typescript
// Import order
import React, { useState, useEffect } from 'react';
import { z } from 'zod';

import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/formatters';
```

## Comments and Documentation

- Write self-documenting code where possible
- Add comments to explain "why", not "what"
- Document complex logic, algorithms, and business rules
- Use JSDoc comments for functions and components
- Keep comments up-to-date with code changes

```typescript
/**
 * Calculates the estimated property value based on comparable properties
 * and market trends.
 * 
 * @param propertyData - The property data for valuation
 * @param comparables - List of comparable properties
 * @returns The estimated value and confidence score
 */
export function calculatePropertyValue(
  propertyData: PropertyData,
  comparables: ComparableProperty[]
): ValuationResult {
  // Implementation
}
```

## Security Best Practices

- Validate all user inputs
- Sanitize data before rendering to prevent XSS
- Use parameterized queries for database operations
- Implement proper authentication checks
- Follow the principle of least privilege
- Don't expose sensitive information in logs or errors

By following these guidelines, we can maintain a consistent, high-quality codebase that is easier to understand, extend, and maintain. 