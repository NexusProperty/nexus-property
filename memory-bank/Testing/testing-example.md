# Roadmap: Creating the AppraisalHub Testing Plan

This roadmap outlines the steps to develop a thorough testing plan for the AppraisalHub platform, ensuring quality, reliability, and security across all its features and portals.

## Phase 1: Foundation & Strategy Definition (Understanding What to Test)

**Objective:** Establish the overall testing goals, scope, and strategies.

1.  **[ ] Define Testing Objectives & Goals:**
    *   Clearly state what you aim to achieve with testing (e.g., identify critical defects, ensure user requirements are met, validate system performance, verify security).
    *   Link testing goals to overall project success criteria.
2.  **[ ] Define Scope of Testing:**
    *   Identify all components of AppraisalHub that need testing:
        *   Frontend (React/TypeScript, UI Components, Forms, Responsiveness for Agent, Customer, and Admin Portals).
        *   Backend (Supabase Database Logic, Edge Functions/APIs, Business Logic).
        *   API Integrations (CoreLogic NZ, REINZ, other potential sources).
        *   AI / Core Processing Logic (Data ingestion, matching, valuation, AI (Gemini) integration, text generation).
        *   Report Generation (PDF creation, data population, branding).
        *   Authentication & Authorization (Login, Registration, Role-Based Access Control, RLS).
        *   Security aspects.
        *   Performance & Scalability.
        *   Usability.
    *   Explicitly state any features or components that are *out of scope* for the current testing plan (if applicable).
3.  **[ ] Identify Key User Roles and Scenarios:**
    *   Document the different user roles (Agent, Customer, Admin).
    *   Outline the primary user stories and critical workflows for each role (e.g., Customer generates appraisal, Agent claims lead, Admin manages users). These will form the basis for E2E tests.
4.  **[ ] Determine Testing Levels & Types:**
    *   Specify which levels of testing will be performed:
        *   **Unit Testing:** Testing individual components/functions in isolation.
        *   **Integration Testing:** Testing the interaction between integrated components/modules.
        *   **System Testing (End-to-End - E2E):** Testing the complete, integrated system to verify it meets requirements.
        *   **User Acceptance Testing (UAT):** (Optional, but recommended) Testing by end-users or stakeholders.
    *   Specify which types of testing will be employed:
        *   **Functional Testing:** Verifying features work as expected.
        *   **Non-Functional Testing:**
            *   **Performance Testing:** Assessing speed, responsiveness, and stability under load.
            *   **Security Testing:** Identifying vulnerabilities.
            *   **Usability Testing:** Evaluating ease of use and user experience.
            *   **Compatibility Testing:** (If applicable) Testing on different browsers/devices.
            *   **Accessibility Testing:** (If applicable) Ensuring usability for people with disabilities.
5.  **[ ] Define Test Environment Requirements:**
    *   Specify the necessary environments (e.g., Development, Staging/Testing, Production-like).
    *   Outline how test data will be managed and provisioned (e.g., anonymized real data, synthetic data, dedicated test datasets).
    *   List any tools needed for setting up or managing test environments (e.g., Supabase CLI for local dev, CI/CD for staging).
6.  **[ ] Select Testing Tools & Frameworks:**
    *   Choose tools for:
        *   Unit Testing (e.g., Jest, Vitest for frontend; relevant frameworks for backend).
        *   Integration Testing (e.g., Jest, Vitest, potentially with mocking libraries like MSW).
        *   E2E Testing (e.g., Cypress, Playwright).
        *   Performance Testing (e.g., k6, Apache JMeter).
        *   Security Scanning (e.g., OWASP ZAP, Snyk).
        *   Test Management (e.g., Jira with Xray/Zephyr, TestRail, or even a detailed spreadsheet for smaller projects).
        *   Bug Tracking (e.g., Jira, GitHub Issues).
7.  **[ ] Define Roles and Responsibilities:**
    *   Assign responsibilities for test planning, test case creation, test execution, bug reporting, and bug fixing.
    *   Determine who will review and approve the testing plan and test cases.

## Phase 2: Test Planning & Design (Detailing How to Test)

**Objective:** Create detailed test plans, test cases, and define procedures.

1.  **[ ] Develop Unit Test Plan:**
    *   Identify key components/functions in frontend and backend that require unit tests.
    *   Define conventions for writing unit tests (e.g., naming, structure).
    *   Set targets for code coverage (if desired).
2.  **[ ] Develop Integration Test Plan:**
    *   Identify critical integration points:
        *   Frontend components with backend APIs/Supabase.
        *   Backend services/functions with the database.
        *   Data Ingestion pipeline with external APIs (CoreLogic, REINZ).
        *   AI processing logic with the Data Ingestion output.
        *   Report generation with the `Appraisals` data.
    *   Define strategies for mocking external dependencies (e.g., third-party APIs) during integration tests.
3.  **[ ] Develop System (End-to-End) Test Plan:**
    *   Based on user roles and scenarios (from Phase 1), design E2E test cases covering critical workflows.
    *   Prioritize test cases based on risk and business impact.
    *   Detail pre-conditions, steps, expected results, and post-conditions for each E2E test case.
4.  **[ ] Develop Non-Functional Test Plans:**
    *   **Performance Test Plan:**
        *   Identify key performance indicators (KPIs) (e.g., response time for appraisal generation, page load times).
        *   Define load profiles (number of concurrent users, transaction rates).
        *   Outline specific performance test scenarios.
    *   **Security Test Plan:**
        *   Identify key security areas (Authentication, Authorization/RLS, Data Input Validation, API Security, API Key Management, Data Privacy).
        *   Plan for vulnerability scans, penetration testing (if applicable), and RLS policy verification.
    *   **Usability Test Plan:**
        *   Define target user groups for usability testing.
        *   Outline tasks for users to perform.
        *   Determine methods for collecting feedback (e.g., think-aloud protocol, surveys).
5.  **[ ] Define Test Data Management Strategy:**
    *   Detail how test data will be created, maintained, and reset for different test types and environments.
    *   Consider data privacy implications if using real data (anonymization/masking).
6.  **[ ] Establish Defect Management Process:**
    *   Define how bugs will be reported (tool, required information like steps to reproduce, severity, priority).
    *   Outline the bug lifecycle (e.g., New, Open, In Progress, Resolved, Verified, Closed).
    *   Define criteria for bug severity and priority.
7.  **[ ] Define Test Execution Strategy & Schedule:**
    *   Outline the order in which tests will be executed.
    *   Plan for test cycles and iterations.
    *   Estimate the time and resources required for test execution.
    *   Integrate testing activities into the CI/CD pipeline where possible (automated tests).
8.  **[ ] Define Entry and Exit Criteria for Testing Phases:**
    *   **Entry Criteria:** Conditions that must be met before a testing phase can begin (e.g., code complete for a feature, previous testing phase passed).
    *   **Exit Criteria:** Conditions that must be met to consider a testing phase complete (e.g., percentage of test cases passed, no outstanding critical/high-severity bugs).

## Phase 3: Documentation & Review

**Objective:** Consolidate all planning into a formal document and get stakeholder buy-in.

1.  **[ ] Compile the Master Test Plan Document:**
    *   Combine all the defined strategies, plans, and procedures from Phase 1 and Phase 2 into a single, comprehensive document.
    *   Include sections for introduction, scope, strategy, resources, schedule, deliverables, risks, etc.
2.  **[ ] Create Test Case Documentation:**
    *   Write out detailed test cases for unit, integration, and system tests in the chosen test management tool or document format.
3.  **[ ] Review and Approve the Test Plan:**
    *   Share the Master Test Plan and key test case documents with relevant stakeholders (development team, product owner, project manager).
    *   Collect feedback and make necessary revisions.
    *   Obtain formal sign-off on the testing plan.

# AppraisalHub Testing Examples

This document provides examples of how to write tests for the AppraisalHub platform.

## Component Testing Example

Here's an example of testing a simple button component:

```tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils/test-utils';

// Component to test
const Button = ({ 
  onClick, 
  disabled = false, 
  children 
}: { 
  onClick: () => void; 
  disabled?: boolean; 
  children: React.ReactNode 
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-testid="test-button"
    >
      {children}
    </button>
  );
};

describe('Button Component', () => {
  it('renders correctly with children', () => {
    render(<Button onClick={() => {}}>Click Me</Button>);
    
    expect(screen.getByTestId('test-button')).toBeInTheDocument();
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByTestId('test-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled={true}>Click Me</Button>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

## Service Testing Example

Here's an example of testing the auth service:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '@/services/auth';
import { supabase } from '@/lib/supabase';

// Create a mock for the Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  describe('signIn', () => {
    it('should call Supabase signInWithPassword with correct parameters', async () => {
      // Set up the mock to return a successful response
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
        error: null,
      } as any);
      
      const email = 'test@example.com';
      const password = 'password123';
      
      const result = await authService.signIn(email, password);
      
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
    
    it('should handle sign in failure', async () => {
      // Set up the mock to return an error
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      } as any);
      
      const result = await authService.signIn('wrong@example.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
});
```

## Integration Testing Example

Here's an example of testing the AuthContext:

```tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as authService from '@/services/auth';
import * as userService from '@/services/user';

// Mock the auth service
vi.mock('@/services/auth', () => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
}));

// Mock the user service
vi.mock('@/services/user', () => ({
  getProfile: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'test-profile-id',
      user_id: 'test-user-id',
      full_name: 'Test User',
      role: 'agent',
    },
    error: null,
  }),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { isAuthenticated, user, profile, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && (
        <div data-testid="user-email">
          {user.email}
        </div>
      )}
      {profile && (
        <div data-testid="profile-name">
          {profile.full_name}
        </div>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementations
    vi.mocked(authService.getSession).mockResolvedValue({
      success: false,
      data: null,
      error: null,
    });
    
    vi.mocked(authService.getUser).mockResolvedValue({
      data: {
        user: null,
      },
    });
    
    vi.mocked(authService.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });
  
  it('should show unauthenticated state initially', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should show not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    
    // User email and profile name should not be present
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-name')).not.toBeInTheDocument();
  });
});
```

## E2E Testing Example

Here's an example of testing the home page with Playwright:

```ts
import { test, expect } from '@playwright/test';

test('should load the home page', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Verify that the page loaded
  await expect(page).toHaveTitle(/AppraisalHub/);
});

test('should display login option when not logged in', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Verify login button is visible
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('should navigate to login page when login button is clicked', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Click the login button
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Verify we're on the login page
  await expect(page).toHaveURL(/.*login/);
});
```

## Mocking Supabase

Here's how to use the Supabase mock utilities:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../utils/test-utils';
import { setupAuthMocks } from '../utils/supabase-test-utils';
import { ProfileComponent } from '@/components/ProfileComponent';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const { supabase } = setupAuthMocks({
    isAuthenticated: true,
    userRole: 'agent',
    fullName: 'Test Agent',
    email: 'agent@example.com',
  });
  
  return { supabase };
});

describe('ProfileComponent', () => {
  it('should render the user profile', async () => {
    render(<ProfileComponent />);
    
    await screen.findByText('Test Agent');
    expect(screen.getByText('agent@example.com')).toBeInTheDocument();
  });
});
```

## Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run specific test types
npm run test:component
npm run test:integration

# Run E2E tests
npm run test:e2e
```
