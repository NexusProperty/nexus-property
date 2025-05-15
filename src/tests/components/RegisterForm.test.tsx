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
  signUpWithEmail: vi.fn(),
}));

vi.mock('@/lib/zodSchemas', () => ({
  registerSchema: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string()
      .min(10, 'Password must be at least 10 characters')
      .refine(() => true, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      }),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Please enter your full name'),
    role: z.enum(['agent', 'customer', 'admin'], {
      errorMap: () => ({ message: 'Please select a valid role' }),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
}));

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import * as authService from '@/services/auth';
import { User, Session } from '@supabase/supabase-js';

// Mock user and session for tests
const createMockUser = (id: string): User => ({
  id,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email: 'test@example.com',
  phone: '',
  role: '',
  email_confirmed_at: null,
  phone_confirmed_at: null,
  factors: null,
  confirmation_sent_at: null,
  confirmed_at: null,
  recovery_sent_at: null,
  last_sign_in_at: null,
  new_email: null,
  new_phone: null,
  invited_at: null,
});

const createMockSession = (): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: createMockUser('123'),
});

// Custom render function
const renderRegisterForm = () => {
  return render(<RegisterForm />);
};

describe('RegisterForm Component', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });
  
  it('renders the registration form correctly', () => {
    renderRegisterForm();
    
    // Check that form elements are rendered
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    renderRegisterForm();
    
    // Try to submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/please enter your full name/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    renderRegisterForm();
    
    // Fill out the form with mismatched passwords
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password456!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Check for password mismatch error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data when auto-confirmed', async () => {
    vi.mocked(authService.signUpWithEmail).mockResolvedValue({
      success: true,
      data: { 
        user: createMockUser('123'),
        session: createMockSession()
      },
      error: null,
    });
    
    renderRegisterForm();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    // Select customer role - adjust the selection using button and option text
    const roleButton = screen.getByRole('combobox');
    fireEvent.click(roleButton);
    // Wait for options to appear and click on customer option
    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: /customer/i }));
    });
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Check that the auth service was called with the correct values
    await waitFor(() => {
      expect(authService.signUpWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Password123!',
        {
          full_name: 'John Doe',
          role: 'customer',
        }
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  it('shows success message when email confirmation is required', async () => {
    vi.mocked(authService.signUpWithEmail).mockResolvedValue({
      success: true,
      data: { 
        user: createMockUser('123'),
        session: null
      },
      error: null,
    });
    
    renderRegisterForm();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    // Select agent role - adjust the selection using button and option text
    const roleButton = screen.getByRole('combobox');
    fireEvent.click(roleButton);
    // Wait for options to appear and click on agent option
    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: /real estate agent/i }));
    });
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Check for success message and no navigation
    await waitFor(() => {
      expect(screen.getByText(/please check your email for a confirmation link/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('handles registration failure', async () => {
    vi.mocked(authService.signUpWithEmail).mockResolvedValue({
      success: false,
      data: null,
      error: new Error('Email already in use'),
    });
    
    renderRegisterForm();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('navigates to login page', () => {
    renderRegisterForm();
    
    // Click on sign in link
    fireEvent.click(screen.getByText(/sign in/i));
    
    // Check navigation with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
}); 