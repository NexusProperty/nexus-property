# Nexus Property - Refactoring Plan

## Overview

This document outlines files in the Nexus Property codebase that require refactoring. Each section identifies specific issues and recommends improvements to enhance code quality, maintainability, and performance.

## Files Requiring Refactoring

### 1. `src/integrations/supabase/client.ts`

**Issues:**
- Hardcoded Supabase credentials in the client file
- No environment variable configuration for different environments
- Comment indicates automatic generation but lacks proper documentation

**Recommended Changes:**
- Move credentials to environment variables (.env file)
- Create environment-specific configuration
- Implement proper error handling during client initialization
- Add better documentation for the client usage patterns

### 2. `src/contexts/AuthContext.tsx`

**Issues:**
- Redundant user fetching logic in both initialization and auth state change
- No clear loading states for different authentication phases
- Error handling is minimal with just console logs
- Missing TypeScript import for the Database type
- Profile fetching logic duplicated in multiple places

**Recommended Changes:**
- Extract common user and profile fetching logic to reusable functions
- Implement proper loading states (isAuthenticating, isLoadingProfile)
- Add comprehensive error handling with user-friendly messages
- Fix TypeScript imports
- Add memoization for context values to prevent unnecessary re-renders

### 3. `src/services/auth.ts`

**Issues:**
- Import path uses relative path (`../lib/supabase`) instead of aliased paths
- Inconsistent error handling patterns
- Lacks proper typing for some returned values
- No validation before making API calls

**Recommended Changes:**
- Use aliased imports (`@/lib/supabase`)
- Standardize error handling and response formatting
- Add comprehensive TypeScript types for all functions
- Implement input validation for API calls
- Add unit tests for authentication functions

### 4. `src/services/property.ts` and `src/services/appraisal.ts`

**Issues:**
- Duplicate code patterns across both service files
- Error handling is inconsistent
- Lack of input validation before database operations
- No pagination support for listing operations
- Missing centralized error handling

**Recommended Changes:**
- Extract common database operation patterns to a generic service helper
- Standardize error handling with proper typing
- Implement input validation using Zod or similar
- Add pagination support for listing operations
- Implement retry mechanisms for network failures

### 5. `src/services/property-valuation.ts`

**Issues:**
- Complex nested logic in the `requestPropertyValuation` function
- Error handling spread across multiple places with different patterns
- Direct calls to update database within the valuation service
- No unit tests for core business logic
- Lack of proper input validation

**Recommended Changes:**
- Split the complex valuation function into smaller, focused functions
- Implement a consistent error handling strategy
- Move database update operations to a dedicated data layer
- Add comprehensive unit tests for valuation logic
- Implement input validation using TypeScript and/or Zod

### 6. `src/components/ReportGenerationButton.tsx`

**Issues:**
- Business logic mixed with UI components
- Error handling directly in component
- Direct service calls from component
- No loading state management abstraction

**Recommended Changes:**
- Extract business logic to a custom hook (useReportGeneration)
- Implement consistent error handling that works with the UI
- Use a state management pattern for complex loading states
- Separate UI concerns from data fetching logic

### 7. Security Issues Across Multiple Files

**Issues:**
- Hardcoded credentials in Supabase client
- No proper authentication validation in edge functions
- Missing Row Level Security (RLS) considerations
- No proper CSRF protection

**Recommended Changes:**
- Implement proper environment variable usage
- Add authentication middleware for edge functions
- Document and enforce Row Level Security policies
- Implement proper CSRF protection mechanisms

## Implementation Priority

1. **High Priority**:
   - Security issues (credentials, authentication)
   - Error handling standardization
   - Service layer refactoring

2. **Medium Priority**:
   - Component logic extraction
   - Context optimization
   - Input validation

3. **Low Priority**:
   - Code style consistency
   - Performance optimizations
   - Test coverage

## Timeline Estimates

| Task | Effort (person-days) | Priority |
|------|----------------------|----------|
| Fix security issues | 2-3 | High |
| Refactor service layer | 3-4 | High |
| Standardize error handling | 2-3 | High |
| Implement input validation | 2-3 | Medium |
| Extract component logic | 1-2 | Medium |
| Optimize contexts | 1-2 | Medium |
| Add test coverage | 3-4 | Low |

## Next Steps

1. Create detailed refactoring tickets for each identified issue
2. Prioritize security and critical structural issues
3. Implement a consistent pattern for service layer operations
4. Add automated tests for refactored components
5. Document best practices for future development 