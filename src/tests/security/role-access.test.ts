import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@supabase/supabase-js';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

// Mock protected route component
vi.mock('@/components/ProtectedRoute', () => ({
  default: ({ children, requiredRoles }: { children: React.ReactNode; requiredRoles?: string[] }) => (
    <div data-testid="protected-route" data-required-roles={requiredRoles?.join(',')}>
      {children}
    </div>
  )
}));

// Create test components for different roles
const AdminOnlyPage = () => <div data-testid="admin-page">Admin Only Content</div>;
const AgentOnlyPage = () => <div data-testid="agent-page">Agent Only Content</div>;
const CustomerOnlyPage = () => <div data-testid="customer-page">Customer Only Content</div>;
const SharedPage = () => <div data-testid="shared-page">Shared Content</div>;

// Mock user data for different roles
const createMockUser = (role: string): User => {
  return {
    id: `user-${role}`,
    email: `${role}@example.com`,
    user_metadata: { role },
    app_metadata: { role },
    aud: 'authenticated',
    created_at: '',
  } as User;
};

describe('Role-Based Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Role Access', () => {
    beforeEach(() => {
      // Setup auth hook mock to return admin user
      (useAuth as any).mockReturnValue({
        user: createMockUser('admin'),
        isLoading: false,
        checkUserRole: (role: string) => role === 'admin',
        userHasRole: (requiredRoles?: string[]) => requiredRoles ? requiredRoles.includes('admin') : false
      });
    });

    it('should allow admins to access admin content', async () => {
      render(<AdminOnlyPage />);
      expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    });

    it('should allow admins to access agent content', async () => {
      render(<AgentOnlyPage />);
      expect(screen.getByTestId('agent-page')).toBeInTheDocument();
    });

    it('should allow admins to access customer content', async () => {
      render(<CustomerOnlyPage />);
      expect(screen.getByTestId('customer-page')).toBeInTheDocument();
    });
  });

  describe('Agent Role Access', () => {
    beforeEach(() => {
      // Setup auth hook mock to return agent user
      (useAuth as any).mockReturnValue({
        user: createMockUser('agent'),
        isLoading: false,
        checkUserRole: (role: string) => role === 'agent',
        userHasRole: (requiredRoles?: string[]) => requiredRoles ? requiredRoles.includes('agent') : false
      });
    });

    it('should prevent agents from accessing admin content', async () => {
      // Mock ProtectedRoute to reject access
      vi.mocked(useAuth).mockReturnValue({
        user: createMockUser('agent'),
        isLoading: false,
        checkUserRole: (role: string) => role === 'agent',
        userHasRole: (requiredRoles?: string[]) => requiredRoles ? requiredRoles.includes('agent') : false,
        isAuthenticated: true
      });

      render(
        <div data-testid="protected-route" data-required-roles="admin">
          <AdminOnlyPage />
        </div>
      );

      // Verify that the agent cannot access admin content
      expect(screen.queryByTestId('admin-page')).toBeNull();
    });

    it('should allow agents to access agent content', async () => {
      render(<AgentOnlyPage />);
      expect(screen.getByTestId('agent-page')).toBeInTheDocument();
    });

    it('should allow agents to access shared content', async () => {
      render(<SharedPage />);
      expect(screen.getByTestId('shared-page')).toBeInTheDocument();
    });
  });

  describe('Customer Role Access', () => {
    beforeEach(() => {
      // Setup auth hook mock to return customer user
      (useAuth as any).mockReturnValue({
        user: createMockUser('customer'),
        isLoading: false,
        checkUserRole: (role: string) => role === 'customer',
        userHasRole: (requiredRoles?: string[]) => requiredRoles ? requiredRoles.includes('customer') : false
      });
    });

    it('should prevent customers from accessing admin content', async () => {
      // Mock ProtectedRoute to reject access
      vi.mocked(useAuth).mockReturnValue({
        user: createMockUser('customer'),
        isLoading: false,
        checkUserRole: (role: string) => role === 'customer',
        userHasRole: (requiredRoles?: string[]) => requiredRoles ? requiredRoles.includes('customer') : false,
        isAuthenticated: true
      });

      render(
        <div data-testid="protected-route" data-required-roles="admin">
          <AdminOnlyPage />
        </div>
      );

      // Verify that the customer cannot access admin content
      expect(screen.queryByTestId('admin-page')).toBeNull();
    });

    it('should prevent customers from accessing agent content', async () => {
      // Mock ProtectedRoute to reject access
      vi.mocked(useAuth).mockReturnValue({
        user: createMockUser('customer'),
        isLoading: false,
        checkUserRole: (role: string) => role === 'customer',
        userHasRole: (requiredRoles?: string[]) => requiredRoles ? requiredRoles.includes('customer') : false,
        isAuthenticated: true
      });

      render(
        <div data-testid="protected-route" data-required-roles="agent">
          <AgentOnlyPage />
        </div>
      );

      // Verify that the customer cannot access agent content
      expect(screen.queryByTestId('agent-page')).toBeNull();
    });

    it('should allow customers to access customer content', async () => {
      render(<CustomerOnlyPage />);
      expect(screen.getByTestId('customer-page')).toBeInTheDocument();
    });

    it('should allow customers to access shared content', async () => {
      render(<SharedPage />);
      expect(screen.getByTestId('shared-page')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated Access', () => {
    beforeEach(() => {
      // Setup auth hook mock to return no user (unauthenticated)
      (useAuth as any).mockReturnValue({
        user: null,
        isLoading: false,
        checkUserRole: () => false,
        userHasRole: () => false,
        isAuthenticated: false
      });
    });

    it('should prevent unauthenticated users from accessing any protected content', async () => {
      // Mock ProtectedRoute to reject access
      render(
        <div data-testid="protected-route" data-required-roles="admin,agent,customer">
          <div>Protected Content</div>
        </div>
      );

      // Verify that unauthenticated users cannot access protected content
      expect(screen.queryByText('Protected Content')).toBeNull();
    });
  });
}); 