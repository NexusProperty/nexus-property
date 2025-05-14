import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorMessage, ErrorCategory } from '@/components/ui/error-message';
import useServiceError from '@/hooks/useServiceError';
import { ServiceResponse } from '@/lib/service-helper';

// Form schema with validation rules
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;

// Define response data type with optional fields
interface SubmissionResponse {
  id: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Example component for handling validation errors
 */
const ValidationErrorExample: React.FC = () => {
  const [response, setResponse] = useState<ServiceResponse<SubmissionResponse> | null>(null);
  const { message, category, validationErrors, hasError } = useServiceError(response);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = (data: FormValues) => {
    // Simulate API call with validation error
    setTimeout(() => {
      // Simulating a successful submission
      setResponse({
        success: true,
        error: null,
        data: { id: '123', ...data }
      });
    }, 1000);
  };

  const simulateValidationError = () => {
    setResponse({
      success: false,
      error: 'Validation failed',
      data: null,
      metadata: {
        category: ErrorCategory.VALIDATION,
        validationErrors: [
          { path: ['email'], message: 'Email is already in use' },
          { path: ['password'], message: 'Password is too weak' }
        ]
      }
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Validation Error Handling Example</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Show general error message */}
          {hasError && (
            <ErrorMessage message={message} category={category} />
          )}

          {/* Success message */}
          {response?.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
              Form submitted successfully!
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? "border-destructive" : ""}
            />
            {/* Show client-side validation error */}
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
            {/* Show server-side validation error */}
            {validationErrors?.email && (
              <p className="text-sm text-amber-600">{validationErrors.email[0]}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            {validationErrors?.password && (
              <p className="text-sm text-amber-600">{validationErrors.password[0]}</p>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? "border-destructive" : ""}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button type="submit">Submit Form</Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={simulateValidationError}
            >
              Simulate Server Error
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ValidationErrorExample; 