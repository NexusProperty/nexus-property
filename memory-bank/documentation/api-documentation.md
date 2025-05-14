# Nexus Property API Documentation

This document provides an overview of the API services available in the Nexus Property application.

## Service Layer Architecture

The service layer in Nexus Property follows a consistent pattern:

1. **Input Validation**: All inputs are validated using Zod schemas
2. **Error Handling**: Standardized error handling with typed responses
3. **Response Format**: Consistent response format for all service functions
4. **Typing**: Full TypeScript type coverage for inputs and outputs

## Common Response Format

All service functions return responses in this standard format:

```typescript
interface ServiceResult<T = unknown> {
  success: boolean;
  error?: string | null;
  data?: T | null;
  validationErrors?: z.ZodIssue[];
  metadata?: Record<string, unknown>;
}
```

## Authentication API

Located in `src/services/auth.ts`

### Sign In

```typescript
signInWithEmail(email: string, password: string, rememberMe: boolean): Promise<AuthResult>
```

**Parameters:**
- `email`: User's email address
- `password`: User's password
- `rememberMe`: Whether to extend the session duration

**Returns:**
- Success response with session and user data
- Error response with validation or authentication errors

**Example:**
```typescript
const result = await signInWithEmail('user@example.com', 'password', true);

if (result.success) {
  // User is authenticated
  const session = result.data.session;
  const user = result.data.user;
} else {
  // Handle error
  console.error(result.error);
  
  // Check for validation errors
  if (result.validationErrors) {
    // Display validation errors
  }
}
```

### Sign Up

```typescript
signUpWithEmail(
  email: string,
  password: string,
  confirmPassword: string,
  fullName: string,
  role: 'agent' | 'customer' | 'admin',
  metadata?: Record<string, unknown>
): Promise<AuthResult>
```

**Parameters:**
- `email`: User's email address
- `password`: User's password
- `confirmPassword`: Password confirmation (must match password)
- `fullName`: User's full name
- `role`: User's role in the system
- `metadata`: Optional additional user metadata

**Returns:**
- Success response with session and user data
- Error response with validation or registration errors

### Sign Out

```typescript
signOut(): Promise<AuthResult<null>>
```

**Returns:**
- Success response if sign out was successful
- Error response if sign out failed

### Reset Password

```typescript
resetPassword(email: string): Promise<AuthResult<null>>
```

**Parameters:**
- `email`: User's email address

**Returns:**
- Success response if password reset email was sent
- Error response if email sending failed

### Update Password

```typescript
updatePassword(password: string, confirmPassword: string): Promise<AuthResult<null>>
```

**Parameters:**
- `password`: New password
- `confirmPassword`: Password confirmation (must match password)

**Returns:**
- Success response if password was updated
- Error response if update failed

## Property Service API

Located in `src/services/property.ts`

### Get Property

```typescript
getProperty(id: string): Promise<ServiceResult<Property>>
```

**Parameters:**
- `id`: Property ID

**Returns:**
- Success response with property data
- Error response if property not found or other error occurred

### List Properties

```typescript
listProperties(
  filters?: PropertyFilters,
  pagination?: PaginationOptions
): Promise<ServiceResult<PaginatedResult<Property>>>
```

**Parameters:**
- `filters`: Optional property filters
- `pagination`: Optional pagination options

**Returns:**
- Success response with paginated property list
- Error response if query failed

### Create Property

```typescript
createProperty(data: PropertyInputData): Promise<ServiceResult<Property>>
```

**Parameters:**
- `data`: Property data to create

**Returns:**
- Success response with created property
- Error response with validation or creation errors

### Update Property

```typescript
updateProperty(id: string, data: Partial<PropertyInputData>): Promise<ServiceResult<Property>>
```

**Parameters:**
- `id`: Property ID
- `data`: Property data to update

**Returns:**
- Success response with updated property
- Error response with validation or update errors

### Delete Property

```typescript
deleteProperty(id: string): Promise<ServiceResult<null>>
```

**Parameters:**
- `id`: Property ID

**Returns:**
- Success response if property was deleted
- Error response if deletion failed

## Property Valuation API

Located in `src/services/property-valuation.ts`

### Request Property Valuation

```typescript
requestPropertyValuation(
  propertyData: PropertyValuationRequest
): Promise<ServiceResult<PropertyValuation>>
```

**Parameters:**
- `propertyData`: Property data for valuation

**Returns:**
- Success response with property valuation
- Error response with validation or processing errors

### Get Valuation Status

```typescript
getValuationStatus(valuationId: string): Promise<ServiceResult<ValuationStatus>>
```

**Parameters:**
- `valuationId`: Valuation request ID

**Returns:**
- Success response with valuation status
- Error response if status could not be retrieved

## Appraisal Service API

Located in `src/services/appraisal.ts`

### Request Appraisal

```typescript
requestAppraisal(data: AppraisalRequest): Promise<ServiceResult<Appraisal>>
```

**Parameters:**
- `data`: Appraisal request data

**Returns:**
- Success response with created appraisal
- Error response with validation or creation errors

### Get Appraisal

```typescript
getAppraisal(id: string): Promise<ServiceResult<Appraisal>>
```

**Parameters:**
- `id`: Appraisal ID

**Returns:**
- Success response with appraisal data
- Error response if appraisal not found

### List Appraisals

```typescript
listAppraisals(
  filters?: AppraisalFilters,
  pagination?: PaginationOptions
): Promise<ServiceResult<PaginatedResult<Appraisal>>>
```

**Parameters:**
- `filters`: Optional appraisal filters
- `pagination`: Optional pagination options

**Returns:**
- Success response with paginated appraisal list
- Error response if query failed

## User Service API

Located in `src/services/user.ts`

### Get User Profile

```typescript
getProfile(userId: string): Promise<ServiceResult<Profile>>
```

**Parameters:**
- `userId`: User ID

**Returns:**
- Success response with user profile
- Error response if profile not found

### Update User Profile

```typescript
updateProfile(userId: string, data: Partial<ProfileUpdateData>): Promise<ServiceResult<Profile>>
```

**Parameters:**
- `userId`: User ID
- `data`: Profile data to update

**Returns:**
- Success response with updated profile
- Error response with validation or update errors

## Error Handling

All service functions use the centralized error handling utility in `src/lib/service-helper.ts`. Errors are categorized as:

- `VALIDATION` - Input validation errors
- `AUTHENTICATION` - Authentication-related errors
- `AUTHORIZATION` - Permission-related errors
- `NOT_FOUND` - Resource not found
- `NETWORK` - Network or API connectivity issues
- `SERVER` - Server-side errors
- `DATABASE` - Database operation errors
- `UNKNOWN` - Uncategorized errors

Client code should check for these error categories and handle them appropriately.

## Best Practices

1. **Always Check Success Flag**: Check the `success` property before accessing data
2. **Handle Validation Errors**: Process `validationErrors` to display field-specific errors
3. **Error Messages**: Use `error` for user-friendly error messages
4. **Typing**: Leverage TypeScript types for better IDE support and type safety
5. **Async/Await**: Use async/await syntax with proper error handling 