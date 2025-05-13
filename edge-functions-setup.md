# Edge Functions Deployment

This document outlines the steps to deploy the Edge Functions for the AppraisalHub application.

## Prerequisites

1. Install Docker Desktop from [https://docs.docker.com/desktop/](https://docs.docker.com/desktop/)
2. Install the Supabase CLI
3. Ensure you have the necessary environment variables set up:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`

## Setting Environment Variables

Before deploying the Edge Functions, set the required environment variables:

```bash
supabase secrets set SUPABASE_URL=https://anrpboahhkahdprohtln.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNjQ3NCwiZXhwIjoyMDYyNjAyNDc0fQ.NPX8AFgZe_6h1Cxf2TfiycJYDKS_hU99_1-4QV-FlyE SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjY0NzQsImV4cCI6MjA2MjYwMjQ3NH0.n_07t2K7AEUa4DIWvidXIXw_d_5kgZbaj8uBiqqcHi4 --project-ref anrpboahhkahdprohtln
```

## Deploying Edge Functions

After setting up the environment variables, deploy each Edge Function:

```bash
# Start Docker Desktop first

# Deploy property-data function
supabase functions deploy property-data --project-ref anrpboahhkahdprohtln

# Deploy property-valuation function
supabase functions deploy property-valuation --project-ref anrpboahhkahdprohtln

# Deploy ai-market-analysis function
supabase functions deploy ai-market-analysis --project-ref anrpboahhkahdprohtln
```

## Verifying Deployments

To verify that the Edge Functions have been successfully deployed:

1. Go to the [Supabase Dashboard](https://app.supabase.com/)
2. Select the "anrpboahhkahdprohtln" project
3. Navigate to the "Edge Functions" section
4. Check that all Edge Functions are listed with a "Deployed" status

## Testing Edge Functions

You can test the Edge Functions using the Supabase UI or by making direct HTTP requests:

### Using the Supabase UI

1. In the Supabase Dashboard, go to the "Edge Functions" section
2. Select a function
3. Click on "Invoke" to test the function with sample data

### Using cURL

```bash
# Test property-data function
curl -X POST 'https://anrpboahhkahdprohtln.supabase.co/functions/v1/property-data' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"address": "123 Main Street", "suburb": "Example Suburb", "city": "Example City", "propertyType": "house"}'

# Test property-valuation function
curl -X POST 'https://anrpboahhkahdprohtln.supabase.co/functions/v1/property-valuation' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"appraisalId": "123e4567-e89b-12d3-a456-426614174000", "propertyDetails": {...}, "comparableProperties": [...]}'
```

## Function Details

### Property Data (`/property-data`)

Retrieves property data, including property details, comparable properties, and market trends.

### Property Valuation (`/property-valuation`)

Calculates property valuations based on comparable properties and market data.

### AI Market Analysis (`/ai-market-analysis`)

Provides AI-generated market analysis based on property data and market trends.

## Security Considerations

- All Edge Functions require proper authentication with a valid JWT token
- Use Row Level Security (RLS) to control access to data
- The service role key bypasses RLS, so use it carefully 