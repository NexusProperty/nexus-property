import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
// Import the enum from a separate file
import { ErrorCategory } from '@/lib/enums/error-categories';

export interface ErrorMessageProps {
  /** The error message to display */
  message: string | null | undefined;
  /** Optional error category from service operations */
  category?: ErrorCategory;
  /** Whether to show the error (defaults to true if message exists) */
  show?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * A standardized error message component
 * 
 * This component provides a consistent way to display errors
 * throughout the application, with appropriate styling based
 * on error category.
 */
export function ErrorMessage({
  message,
  category,
  show = !!message,
  className = '',
}: ErrorMessageProps) {
  if (!show || !message) return null;

  // Since Alert only has 'default' and 'destructive' variants,
  // we'll map our error categories to these variants
  const variant = (category === ErrorCategory.VALIDATION || 
                  category === ErrorCategory.NOT_FOUND) 
                  ? 'default' : 'destructive';

  return (
    <Alert variant={variant} className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export default ErrorMessage; 