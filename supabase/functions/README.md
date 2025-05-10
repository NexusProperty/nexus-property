# Supabase Edge Functions

This directory contains Supabase Edge Functions for the AppraisalHub application.

## Available Functions

### create-appraisal

This function handles the creation of new appraisals. It:

1. Validates the user's authentication
2. Validates the request body
3. Gets the user's role from their profile
4. Creates an appraisal record in the database
5. Sets the appropriate customer_id or agent_id based on the user's role
6. Sets the status to "processing"

In a future phase, this function will also trigger the data ingestion/AI process.

## Deployment

To deploy these functions to your Supabase project, you can use the Supabase CLI:

```bash
supabase functions deploy
```

Or you can deploy individual functions:

```bash
supabase functions deploy create-appraisal
```

## Local Development

To run these functions locally for development, you can use the Supabase CLI:

```bash
supabase functions serve
```

Or you can run individual functions:

```bash
supabase functions serve create-appraisal
```

## Testing

You can test these functions using tools like Postman or curl. For example:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/create-appraisal \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"property_address": "123 Main St", "property_details": {"bedrooms": 3, "bathrooms": 2}}'
```

## Security Considerations

- These functions run in a secure environment with access to the Supabase database
- They use the user's authentication context to ensure they can only perform actions they are authorized to perform
- They validate input data to prevent injection attacks
- They handle errors gracefully and return appropriate status codes 