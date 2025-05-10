import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { AuthProvider } from './context/AuthContext';
// Add other providers as needed (e.g., ThemeProvider, Router)

function AllProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function render(ui: React.ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from RTL
export * from '@testing-library/react';
export { render };

// Example Supabase mock (can be extended in tests)
jest.mock('./lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: { onAuthStateChange: jest.fn(), signIn: jest.fn(), signOut: jest.fn() },
    from: jest.fn(),
  },
})); 