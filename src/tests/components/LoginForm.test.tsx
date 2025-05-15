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
  signInWithEmail: vi.fn(),
}));

vi.mock('@/lib/zodSchemas', () => ({
  loginSchema: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    rememberMe: z.boolean().default(false),
  }),
}));

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import * as authService from '@/services/auth';

// Custom render function
const renderLoginForm = () => {
  return render(<LoginForm />);
};

describe('LoginForm Component', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });
  
  it('renders the login form correctly', () => {
    renderLoginForm();
    
    // Check that form elements are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    renderLoginForm();
    
    // Try to submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    vi.mocked(authService.signInWithEmail).mockResolvedValue({
      success: true,
      data: { user: { id: '123' }, session: {} },
      error: null,
    });
    
    renderLoginForm();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/remember me/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check that the auth service was called with the correct values
    await waitFor(() => {
      expect(authService.signInWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        true
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login failure', async () => {
    vi.mocked(authService.signInWithEmail).mockResolvedValue({
      success: false,
      data: null,
      error: new Error('Invalid credentials'),
    });
    
    renderLoginForm();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('navigates to forgot password page', () => {
    renderLoginForm();
    
    // Click on forgot password link
    fireEvent.click(screen.getByText(/forgot password\?/i));
    
    // Check navigation with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('navigates to registration page', () => {
    renderLoginForm();
    
    // Click on register link - use the actual text in the component
    fireEvent.click(screen.getByText(/sign up/i));
    
    // Check navigation with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });
}); 