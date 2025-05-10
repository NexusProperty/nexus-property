# Supabase Edge Functions

This directory contains Supabase Edge Functions, which run on the Deno runtime.

## Development Setup

To work with these functions locally, you need to:

1. Install the Deno VS Code extension: `denoland.vscode-deno`
2. Make sure VS Code is configured to use Deno for this directory (see `.vscode/settings.json`)
3. Install the Supabase CLI: `npm install -g supabase`

## Running Functions Locally

To run a function locally:

```bash
supabase functions serve create-appraisal --env-file .env.local
```

## Deploying Functions

To deploy a function:

```bash
supabase functions deploy create-appraisal
```

## TypeScript Configuration

The TypeScript configuration for these functions is in `tsconfig.json`. This configuration is specific to Deno and is separate from the main project's TypeScript configuration.

## Notes on Deno

- Deno uses URL imports instead of Node.js-style imports
- Deno has its own standard library and package management system
- Deno functions run in a secure sandbox with limited access to the file system and network
- Deno functions can access environment variables through `Deno.env.get()`

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