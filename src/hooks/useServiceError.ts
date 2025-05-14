import { useMemo } from 'react';
import { ErrorCategory } from '@/components/ui/error-message';
import { ServiceResponse } from '@/lib/service-helper';

interface ErrorInfo {
  message: string | null;
  category?: ErrorCategory;
  validationErrors?: Record<string, string[]>;
  hasError: boolean;
}

/**
 * A hook to extract error information from a service response
 * 
 * This hook standardizes error handling for components using
 * the service layer responses.
 */
export function useServiceError<T>(
  response: ServiceResponse<T> | null | undefined
): ErrorInfo {
  return useMemo(() => {
    if (!response) {
      return {
        message: null,
        hasError: false,
      };
    }

    if (response.success) {
      return {
        message: null,
        hasError: false,
      };
    }

    // Get the error message
    const message = response.error || 'An unknown error occurred';

    // Get the error category if available
    const category = response.metadata?.category as ErrorCategory | undefined;

    // Extract validation errors if available
    const validationErrors: Record<string, string[]> = {};
    
    interface ValidationError {
      path?: unknown[];
      message?: string;
    }
    
    if (
      response.metadata?.validationErrors && 
      Array.isArray(response.metadata.validationErrors)
    ) {
      for (const error of response.metadata.validationErrors as ValidationError[]) {
        if (error.path && Array.isArray(error.path)) {
          const field = error.path.join('.');
          if (!validationErrors[field]) {
            validationErrors[field] = [];
          }
          if (error.message) {
            validationErrors[field].push(error.message);
          }
        }
      }
    }

    return {
      message,
      category,
      validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
      hasError: true,
    };
  }, [response]);
}

export default useServiceError; 