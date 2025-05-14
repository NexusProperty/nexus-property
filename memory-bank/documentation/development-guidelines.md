# Nexus Property Development Guidelines

This document provides guidelines and best practices for developers working on the Nexus Property application.

## Getting Started

### Prerequisites

- Node.js (version 18.x or later)
- npm (version 9.x or later)
- Supabase CLI
- Git

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/nexus-property.git
   cd nexus-property
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
4. Update the `.env.local` file with your Supabase credentials and other required variables.

5. Start the development server:
   ```bash
   npm run dev
   ```

### Supabase Setup

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Start the local Supabase instance:
   ```bash
   supabase start
   ```

3. Apply database migrations:
   ```bash
   supabase db reset
   ```

## Development Workflow

### Branching Strategy

We follow a feature branch workflow:

1. Create a new branch for each feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes, commit them, and push to the repository:
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   git push origin feature/your-feature-name
   ```

3. Create a pull request to the `main` branch.

4. After review, merge the pull request.

### Commit Message Guidelines

Follow conventional commits for clear and meaningful commit messages:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add property valuation feature

Add the ability for users to request property valuations
based on address and property details.
```

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Provide explicit type annotations for functions and variables
- Avoid using `any` type
- Use interfaces for object types and type aliases for unions/intersections
- Follow the existing type naming conventions

### React Components

- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Use TypeScript interfaces for component props
- Extract complex logic into custom hooks
- Use the appropriate component organization:
  - `components/common` - Reusable UI components
  - `components/layout` - Layout-related components
  - `components/[feature]` - Feature-specific components

### Styling

- Use Tailwind CSS for styling
- Follow the project's design system
- Use CSS modules for component-specific styles
- Use CSS variables for theme colors and values

### Code Formatting

We use Prettier and ESLint to maintain code quality:

- Run linting before committing:
  ```bash
  npm run lint
  ```
  
- Format code with Prettier:
  ```bash
  npm run format
  ```

## Testing

### Unit Tests

- Write tests for all business logic and critical functions
- Use Vitest for unit testing
- Follow the test naming pattern: `describe('Component/Function', () => { it('should do something', () => {}) })`
- Test both success and error cases
- Mock external dependencies

Running tests:
```bash
npm run test
```

### Integration Tests

- Write integration tests for key user flows
- Focus on testing component interactions
- Use realistic test data

Running integration tests:
```bash
npm run test:integration
```

## Supabase Integration

### Database Changes

1. Make changes to the database schema using migrations:
   ```bash
   supabase migration new your_migration_name
   ```

2. Edit the generated migration file in `supabase/migrations/`.

3. Apply the migration locally:
   ```bash
   supabase db reset
   ```

4. Test your changes thoroughly.

### Edge Functions

1. Create a new Edge Function:
   ```bash
   supabase functions new your-function-name
   ```

2. Implement your function in the generated file.

3. Test locally:
   ```bash
   supabase functions serve --no-verify-jwt
   ```

4. Deploy to Supabase (when ready):
   ```bash
   supabase functions deploy your-function-name
   ```

## Security Guidelines

- Never commit sensitive information (API keys, credentials, etc.)
- Use environment variables for all sensitive values
- Always validate user input using Zod schemas
- Implement proper error handling
- Follow authentication best practices
- Use Row Level Security (RLS) policies for database security
- Apply the principle of least privilege

## CI/CD Pipeline

Our CI/CD pipeline runs the following checks:

1. Linting and type checking
2. Unit tests
3. Integration tests
4. Build verification

The pipeline automatically:
- Runs on pull requests to the main branch
- Deploys to the staging environment when merged to main
- Deploys to production after manual approval

## Troubleshooting

### Common Issues

1. **Supabase connection issues**:
   - Check your environment variables
   - Ensure the Supabase instance is running
   - Verify your authentication credentials

2. **Build errors**:
   - Check for TypeScript errors
   - Verify dependencies are installed
   - Look for syntax errors in your code

3. **Test failures**:
   - Check for outdated test expectations
   - Verify mocks are configured correctly
   - Look for changed component behavior

### Getting Help

- Check the project documentation in `/docs`
- Ask in the project's Slack channel
- Create an issue for bugs or feature requests
- Reach out to the project maintainers

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/) 