import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Create a custom renderer that includes providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  // Create a new QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render method
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };

// Mock Supabase auth context
export const mockAuthContext = (isAuthenticated = true, userRole = 'agent') => {
  return {
    session: isAuthenticated ? { 
      user: { 
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { role: userRole }
      } 
    } : null,
    user: isAuthenticated ? { 
      id: 'test-user-id',
      email: 'test@example.com',
      role: userRole
    } : null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    loading: false,
  };
};

// Helper to wait for promises to resolve
export const waitForPromises = () => new Promise(resolve => setTimeout(resolve, 0)); 