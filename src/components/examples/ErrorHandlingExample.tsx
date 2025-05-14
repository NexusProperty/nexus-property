import React, { useState } from 'react';
import { ErrorMessage } from '@/components/ui/error-message';
import useServiceError from '@/hooks/useServiceError';
import { ServiceResponse, ErrorCategory } from '@/lib/service-helper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExampleData {
  id: string;
  name: string;
}

/**
 * An example component demonstrating the error handling utilities
 */
const ErrorHandlingExample: React.FC = () => {
  const [response, setResponse] = useState<ServiceResponse<ExampleData> | null>(null);
  const { message, category, hasError } = useServiceError(response);

  // Simulate different error responses
  const simulateSuccessResponse = () => {
    setResponse({
      success: true,
      error: null,
      data: { id: '123', name: 'Example Data' }
    });
  };

  const simulateValidationError = () => {
    setResponse({
      success: false,
      error: 'Validation failed',
      data: null,
      metadata: {
        category: ErrorCategory.VALIDATION,
        validationErrors: [
          { path: ['name'], message: 'Name is required' },
          { path: ['email'], message: 'Invalid email format' }
        ]
      }
    });
  };

  const simulateAuthError = () => {
    setResponse({
      success: false,
      error: 'Authentication failed, please log in again',
      data: null,
      metadata: {
        category: ErrorCategory.AUTHENTICATION
      }
    });
  };

  const simulateNotFoundError = () => {
    setResponse({
      success: false,
      error: 'Resource not found',
      data: null,
      metadata: {
        category: ErrorCategory.NOT_FOUND
      }
    });
  };

  const simulateServerError = () => {
    setResponse({
      success: false,
      error: 'An unexpected error occurred on the server',
      data: null,
      metadata: {
        category: ErrorCategory.SERVER_ERROR
      }
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Error Handling Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display error message if there is an error */}
        {hasError && (
          <ErrorMessage 
            message={message} 
            category={category}
          />
        )}

        {/* Success message */}
        {response?.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
            Operation successful! Data: {response?.data?.name}
          </div>
        )}

        {/* Buttons to simulate different responses */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={simulateSuccessResponse} variant="default">
            Success
          </Button>
          <Button onClick={simulateValidationError} variant="outline">
            Validation Error
          </Button>
          <Button onClick={simulateAuthError} variant="outline">
            Auth Error
          </Button>
          <Button onClick={simulateNotFoundError} variant="outline">
            Not Found
          </Button>
          <Button onClick={simulateServerError} variant="outline">
            Server Error
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorHandlingExample; 