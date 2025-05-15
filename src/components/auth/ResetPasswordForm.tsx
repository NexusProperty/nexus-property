import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { updatePasswordSchema } from '@/lib/zodSchemas';
import { updatePassword } from '@/services/auth';

// Create a type from the zod schema
type ResetPasswordFormValues = z.infer<typeof updatePasswordSchema>;

const ResetPasswordForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const renderPasswordRequirements = () => {
    return (
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p>Password must:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Be at least 8 characters long</li>
          <li>Contain at least one uppercase letter</li>
          <li>Contain at least one lowercase letter</li>
          <li>Contain at least one number</li>
        </ul>
      </div>
    );
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updatePassword(data.password);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update password');
      }

      setSuccess('Your password has been reset successfully! You will be redirected to the login page.');
      
      // Redirect to login after a short delay
      setRedirecting(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your new password to secure your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="flex items-center gap-2">
                {success}
                {redirecting && <Loader2 className="h-3 w-3 animate-spin" />}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading || !!success}
              {...register('password')}
              className={errors.password ? "border-destructive" : ""}
              data-testid="password-input"
            />
            {renderPasswordRequirements()}
            {errors.password && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={isLoading || !!success}
              {...register('confirmPassword')}
              className={errors.confirmPassword ? "border-destructive" : ""}
              data-testid="confirm-password-input"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !!success}>
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" /> Updating password...
              </span>
            ) : 'Reset Password'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
          <Button
            variant="link"
            className="px-0 font-normal flex items-center gap-1"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default ResetPasswordForm; 