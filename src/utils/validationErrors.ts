import { fromZodError } from 'zod-validation-error';
import { ZodError } from 'zod';
import { ServiceResponse } from '@/lib/service-helper';

/**
 * Formats a ZodError into a user-friendly validation error object
 * that can be used with our service response format
 * 
 * @param error The ZodError to format
 * @returns An array of validation errors with paths and messages
 */
export function formatZodError(error: ZodError): Array<{ path: string[], message: string }> {
  const validationErrors = [];
  
  for (const issue of error.errors) {
    validationErrors.push({
      path: issue.path,
      message: issue.message
    });
  }
  
  return validationErrors;
}

/**
 * Creates a service error response with validation errors
 * 
 * @param error The ZodError instance
 * @param customMessage Optional custom error message
 * @returns A properly formatted service error response
 */
export function createValidationErrorResponse<T>(
  error: ZodError,
  customMessage?: string
): ServiceResponse<T> {
  // Get a friendly error message
  const formattedError = fromZodError(error);
  const message = customMessage || formattedError.message;
  
  // Format the validation errors for our service response
  const validationErrors = formatZodError(error);
  
  return {
    success: false,
    error: message,
    data: null,
    metadata: {
      category: 'validation',
      validationErrors
    }
  };
}

/**
 * Extracts field-specific error messages from a validation error response
 * 
 * @param serviceResponse The service response containing validation errors
 * @param field The field name to get errors for
 * @returns Array of error messages for the specified field
 */
export function getFieldErrors(
  serviceResponse: ServiceResponse<unknown>,
  field: string
): string[] {
  if (
    !serviceResponse.metadata?.validationErrors ||
    !Array.isArray(serviceResponse.metadata.validationErrors)
  ) {
    return [];
  }
  
  const errors: string[] = [];
  
  for (const error of serviceResponse.metadata.validationErrors as Array<{
    path?: unknown[];
    message?: string;
  }>) {
    if (
      error.path &&
      Array.isArray(error.path) &&
      error.path.join('.') === field &&
      error.message
    ) {
      errors.push(error.message);
    }
  }
  
  return errors;
}

/**
 * Gets a user-friendly error message for a specific field
 * 
 * @param serviceResponse The service response containing validation errors
 * @param field The field name to get the error for
 * @returns The first error message for the field, or null if no errors
 */
export function getFieldErrorMessage(
  serviceResponse: ServiceResponse<unknown>,
  field: string
): string | null {
  const errors = getFieldErrors(serviceResponse, field);
  return errors.length > 0 ? errors[0] : null;
}

/**
 * Checks if a specific field has validation errors
 * 
 * @param serviceResponse The service response containing validation errors
 * @param field The field name to check
 * @returns True if the field has errors, false otherwise
 */
export function hasFieldError(
  serviceResponse: ServiceResponse<unknown>,
  field: string
): boolean {
  return getFieldErrors(serviceResponse, field).length > 0;
} 