# AppraisalHub Testing Framework

This directory contains the testing framework for the AppraisalHub platform. The tests are organized into different types and levels to ensure comprehensive coverage of the application.

## Testing Structure

```
tests/
├── components/      # Component unit tests
│   └── ButtonTest.test.tsx   # Example component test
├── integration/     # Integration tests
│   ├── auth-context.test.tsx # AuthContext integration test
│   └── supabase-auth.test.ts # Supabase auth integration test
├── e2e/            # End-to-end tests using Playwright
│   └── home.spec.ts           # Home page E2E test
├── services/       # Service layer tests
│   └── auth.test.ts           # Auth service tests
├── utils/           # Testing utilities and helpers
│   ├── test-utils.tsx           # React Testing Library setup
│   └── supabase-test-utils.ts   # Supabase mocks
├── mocks/           # Mock data and services
├── setup.ts         # Global test setup
└── README.md        # This file
```

## Testing Tools

- **Unit & Component Testing**: Vitest with jsdom
- **Component Testing Library**: React Testing Library
- **E2E Testing**: Playwright
- **Mocking**: Vitest mocking utilities

## Running Tests

The following npm scripts are available for running tests:

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run with test coverage
npm run test:coverage

# Run specific test types
npm run test:component    # Component tests
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:e2e:ui       # End-to-end tests with UI
```

## Writing Tests

### Component Tests

Component tests should follow this pattern:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/test-utils';
import { ComponentToTest } from '@/components/ComponentToTest';

describe('ComponentToTest', () => {
  it('should render correctly', () => {
    render(<ComponentToTest />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Service Tests

Service tests should mock external dependencies and focus on testing the service logic:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serviceToTest } from '@/services/service-to-test';
import { supabase } from '@/lib/supabase';

// Mock external dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Test' }],
          error: null
        })
      })
    })
  }
}));

describe('Service Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should perform the expected operation', async () => {
    const result = await serviceToTest(1);
    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('table_name');
  });
});
```

### Integration Tests

Integration tests should test the interaction between multiple components or services:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import { createMockSupabaseClient } from '../utils/supabase-test-utils';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));

// Import the component after mocking
import { ComponentWithIntegration } from '@/components/ComponentWithIntegration';

describe('Integration Tests', () => {
  it('should integrate with Supabase correctly', async () => {
    render(<ComponentWithIntegration />);
    
    // Wait for async operations
    await waitFor(() => {
      expect(screen.getByText('Data Loaded')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

End-to-end tests use Playwright and should test complete user flows:

```ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Mocking Supabase

We provide utilities to mock Supabase in `utils/supabase-test-utils.ts`:

```ts
// Import the mock creator
import { createMockSupabaseClient } from '../utils/supabase-test-utils';

// Then in your test setup:
vi.mock('@/lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));
```

The mock includes methods for auth, database queries, storage, and edge functions.

## Test Context Providers

For components that require context providers, use the custom render function in `utils/test-utils.tsx`:

```tsx
import { render, screen } from '../utils/test-utils';

// This will wrap your component with necessary providers
render(<ComponentToTest />);
```

## Best Practices

1. Use descriptive test names that explain what's being tested
2. Follow the Arrange-Act-Assert pattern for test structure
3. Test both success and failure cases
4. Mock external dependencies to isolate tests
5. Keep tests independent and avoid test interdependence
6. Focus on testing behavior, not implementation details

## CI/CD Integration

Tests are automatically run as part of the CI/CD pipeline using GitHub Actions. The workflow configuration is located in `.github/workflows/test.yml`.

## Known Issues and Troubleshooting

- **Authentication Testing**: When testing authentication flows, ensure you're using the correct mock implementation for the Supabase auth client. Use the `createMockSupabaseClient()` utility.
- **React Testing Library**: For complex components, use `screen.debug()` to inspect the rendered output when tests fail.
- **Timeouts**: If tests timeout, you may need to adjust the timeout settings in the test configuration or use appropriate wait methods like `waitFor` or `findBy*` queries. 