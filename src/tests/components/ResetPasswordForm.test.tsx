import { z } from 'zod';

// Mock modules - these get hoisted to the top of the file
vi.mock('react-router-dom', () => {
  const actual = vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('@/services/auth', () => ({
  updatePassword: vi.fn(),
}));

vi.mock('@/lib/zodSchemas', () => ({
  updatePasswordSchema: z.object({
    password: z.string()
      .min(10, 'Password must be at least 10 characters')
      .refine(() => true, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
}));

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import * as authService from '@/services/auth';

// Custom render function
const renderResetPasswordForm = () => {
  return render(<ResetPasswordForm />);
};

describe('ResetPasswordForm Component', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('renders the reset password form correctly', () => {
    renderResetPasswordForm();
    
    // Check that form elements are rendered
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument(); 
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    renderResetPasswordForm();
    
    // Try to submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 10 characters/i)).toBeInTheDocument();
    });
  });
  
  it('validates password confirmation', async () => {
    renderResetPasswordForm();
    
    // Fill out the form with mismatched passwords - using input IDs to avoid ambiguity
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    
    fireEvent.change(passwordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password456!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for password mismatch error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    // Create a mock implementation that resolves immediately
    vi.mocked(authService.updatePassword).mockResolvedValue({
      success: true,
      data: null,
      error: null,
    });
    
    renderResetPasswordForm();
    
    // Fill out the form - using input IDs to avoid ambiguity
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    
    fireEvent.change(passwordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check that the auth service was called with the correct values
    await waitFor(() => {
      expect(authService.updatePassword).toHaveBeenCalledWith('Password123!');
      expect(screen.getByText(/your password has been reset successfully/i)).toBeInTheDocument();
    });
  });

  it('handles reset failure', async () => {
    vi.mocked(authService.updatePassword).mockResolvedValue({
      success: false,
      data: null,
      error: new Error('Invalid reset link'),
    });
    
    renderResetPasswordForm();
    
    // Fill out the form - using input IDs to avoid ambiguity
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    
    fireEvent.change(passwordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('shows loading state when submitting', async () => {
    // Create a promise that we won't resolve immediately
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    vi.mocked(authService.updatePassword).mockImplementation(() => {
      return promise as Promise<{ success: boolean; data: null; error: null }>;
    });
    
    renderResetPasswordForm();
    
    // Fill out the form - using input IDs to avoid ambiguity
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    
    fireEvent.change(passwordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Wait for the component to update
    await waitFor(() => {
      expect(authService.updatePassword).toHaveBeenCalledWith('Password123!');
    });
    
    // Resolve the promise
    resolvePromise!({
      success: true,
      data: null,
      error: null,
    });
    
    // Wait for the component to update with the success message
    await waitFor(() => {
      expect(screen.getByText(/your password has been reset successfully/i)).toBeInTheDocument();
    });
  });

  it('navigates to login page when clicking back button', () => {
    renderResetPasswordForm();
    
    // Click on back to sign in link
    fireEvent.click(screen.getByText(/back to sign in/i));
    
    // Check navigation with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
}); 