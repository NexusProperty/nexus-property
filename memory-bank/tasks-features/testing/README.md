# AppraisalHub Testing Infrastructure

This directory contains the documentation and planning for the AppraisalHub testing infrastructure. This document serves as an overview of the testing approach for the project.

## Testing Approach

The AppraisalHub testing strategy employs a multi-layered approach to ensure quality, security, and performance:

1. **Unit Tests**: Testing individual components and functions in isolation
2. **Integration Tests**: Testing interactions between components and services
3. **End-to-End Tests**: Testing complete user flows
4. **Performance Tests**: Ensuring the application meets performance requirements
5. **Security Tests**: Validating security measures, including RLS policies

## Testing Structure

The test structure follows a clear organization:

```
src/tests/
├── components/      # Component unit tests
├── services/        # Service layer tests
├── integration/     # Integration tests
├── e2e/             # End-to-end tests using Playwright
├── utils/           # Test utilities and helpers
├── mocks/           # Mock data and services
├── setup.ts         # Global test setup
└── README.md        # Documentation
```

## Testing Tools

The following tools are used for testing:

- **Unit & Component Testing**: Vitest with jsdom
- **Component Testing Library**: React Testing Library
- **E2E Testing**: Playwright
- **Database Testing**: pgTAP (for Supabase RLS)
- **CI/CD Integration**: GitHub Actions

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

## Mocking Strategy

The testing infrastructure includes robust mocking capabilities:

1. **Supabase Mocking**: A comprehensive mock for the Supabase client in `src/tests/utils/supabase-test-utils.ts` that includes auth, database, storage, and edge functions mocking.
2. **Service Mocking**: Direct mocking of service methods using Vitest's `vi.mock()` and `vi.spyOn()`.
3. **External API Mocking**: Mocking of external API calls for deterministic testing.

## CI/CD Integration

Tests are automatically run as part of the CI/CD pipeline using GitHub Actions:

- The workflow is defined in `.github/workflows/test.yml`
- Tests run on every push to main and on pull requests
- Artifacts include test reports and coverage information

## Testing Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state from other tests
2. **Test Coverage**: Aim for comprehensive coverage of critical paths
3. **Meaningful Assertions**: Focus on testing behavior rather than implementation details
4. **Clear Test Names**: Use descriptive test names that indicate what's being tested
5. **Maintainable Tests**: Keep tests simple and maintainable

## Documentation

For more detailed information, see the following documents:

- [Test Task Plan](./testtask.md): Detailed task list for implementing the testing infrastructure
- [Testing Example](./testing-example.md): Example tests for reference

## Future Improvements

Planned improvements to the testing infrastructure include:

1. Implementing visual regression testing
2. Expanding database testing with pgTAP
3. Adding performance testing with Lighthouse
4. Implementing API contract testing
5. Creating a dedicated test database environment 