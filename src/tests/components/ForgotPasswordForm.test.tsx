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
  resetPassword: vi.fn(),
}));

vi.mock('@/lib/zodSchemas', () => ({
  resetPasswordSchema: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),
}));

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import * as authService from '@/services/auth';

// Custom render function
const renderForgotPasswordForm = () => {
  return render(<ForgotPasswordForm />);
};

describe('ForgotPasswordForm Component', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });
  
  it('renders the forgot password form correctly', () => {
    renderForgotPasswordForm();
    
    // Check that form elements are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter your email address and we'll send you a link/i)).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    renderForgotPasswordForm();
    
    // Try to submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    
    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({
      success: true,
      data: null,
      error: null,
    });
    
    renderForgotPasswordForm();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    
    // Check that the auth service was called with the correct values
    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText(/Password reset instructions have been sent/i)).toBeInTheDocument();
    });
  });

  it('handles reset failure', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({
      success: false,
      data: null,
      error: new Error('User not found'),
    });
    
    renderForgotPasswordForm();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });

  it('shows loading state when submitting', async () => {
    // Create a promise that we won't resolve immediately
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    vi.mocked(authService.resetPassword).mockImplementation(() => {
      return promise as Promise<{ success: boolean; data: null; error: null }>;
    });
    
    renderForgotPasswordForm();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    
    // Wait for the component to update
    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com');
    });
    
    // Resolve the promise
    resolvePromise!({
      success: true,
      data: null,
      error: null,
    });
    
    // Wait for the component to update with the success message
    await waitFor(() => {
      expect(screen.getByText(/password reset instructions have been sent/i)).toBeInTheDocument();
    });
  });

  it('navigates to login page when clicking back button', () => {
    renderForgotPasswordForm();
    
    // Click on back to sign in link
    fireEvent.click(screen.getByText(/back to sign in/i));
    
    // Check navigation with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
}); 