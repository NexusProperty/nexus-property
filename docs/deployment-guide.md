# AppraisalHub Deployment Guide

This document outlines the deployment process for the AppraisalHub application.

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Supabase account and project
- Vercel, Netlify, or similar hosting platform account
- Docker and Docker Compose (for local testing)

## Environment Variables

Create a `.env.production` file with the following variables:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Only for deployment scripts

# API Configuration
VITE_API_BASE_URL=https://your-api-url.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AI_FEATURES=true
```

> **IMPORTANT**: Never commit your `.env.production` file to version control.

## Deployment Methods

### Method 1: Automatic Deployment via CI/CD

1. Push your code to the main branch to trigger the deployment workflow.
2. The GitHub Actions workflow will automatically:
   - Run tests
   - Build the application
   - Deploy to the specified environment

### Method 2: Manual Deployment

#### With Deployment Script

1. Run the deployment script for your target environment:

```bash
# Deploy to preview environment
node scripts/deploy.js preview

# Deploy to production environment
node scripts/deploy.js production
```

#### Without Deployment Script

1. Build the application:

```bash
npm run build
```

2. Deploy Edge Functions:

```bash
npx supabase functions deploy property-data --project-ref your-project-id
npx supabase functions deploy property-valuation --project-ref your-project-id
npx supabase functions deploy ai-market-analysis --project-ref your-project-id
npx supabase functions deploy generate-pdf-report --project-ref your-project-id
```

3. Deploy the frontend to your hosting platform.

### Method 3: Docker Deployment

1. Build the Docker image:

```bash
docker build -t appraisalhub:latest .
```

2. Run the container:

```bash
docker run -p 80:80 -e NODE_ENV=production appraisalhub:latest
```

## Verifying Deployments

After deployment, verify that:

1. The application loads without errors
2. Authentication works correctly
3. Supabase Edge Functions are accessible
4. API endpoints respond as expected

You can use the verification script:

```bash
node scripts/verify-supabase-config.js production
```

## Rollback Procedure

If issues are encountered after deployment:

1. Identify the last stable deployment
2. Redeploy the previous version:

```bash
git checkout <previous-commit-hash>
node scripts/deploy.js production
```

## Database Migrations

Database schema changes should follow this workflow:

1. Create a migration locally and test it
2. Generate the migration file:

```bash
npx supabase db diff --schema public > supabase/migrations/[version]_[description].sql
```

3. Apply the migration to the appropriate environment:

```bash
npx supabase db push --db-url your-db-connection-string
```

## Monitoring

After deployment, monitor the application using:

- Supabase Dashboard for database and Edge Function metrics
- Application logs
- Error tracking service (if configured)

## Troubleshooting

Common deployment issues and solutions:

1. **Supabase connection issues**: Verify your Supabase URL and API keys
2. **Edge Function errors**: Check the Supabase Functions logs
3. **CORS errors**: Ensure your Supabase project has the correct CORS configuration
4. **Build failures**: Check for dependency issues or environment variable problems 