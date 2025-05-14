# CSRF Protection Implementation

This document outlines the Cross-Site Request Forgery (CSRF) protection implementation in the Nexus Property application.

## Overview

CSRF protection prevents malicious websites from making unauthorized requests to our API on behalf of authenticated users. The implementation consists of:

1. Server-side RLS policies that enforce CSRF token validation
2. Client-side utilities to manage CSRF tokens
3. Edge Function middleware to validate CSRF tokens

## Database Implementation

The CSRF protection is implemented at the database level using Row Level Security (RLS) policies. The implementation includes:

- Functions to generate and validate CSRF tokens
- Functions to check if a request method is safe or a mutation
- A policy template that enforces CSRF protection for all tables
- A function to apply CSRF protection to all tables

The implementation is in the migration file: `supabase/migrations/20240725000000_csrf_protection.sql`

## Client-Side Implementation

The client-side implementation includes utilities to:

- Fetch CSRF tokens from the server
- Store CSRF tokens in memory
- Add CSRF tokens to request headers
- Configure Supabase to use CSRF tokens for all requests
- Refresh CSRF tokens periodically or after certain operations

The implementation is in the file: `src/lib/csrf.ts`

## Edge Function Implementation

The Edge Function implementation includes:

- A middleware to validate CSRF tokens for mutation requests
- Integration with existing Edge Functions to enforce CSRF protection

The implementation is in the files:
- `supabase/functions/utils/csrf-middleware.ts`
- `supabase/functions/get-csrf-token/index.ts`

## How It Works

1. When a user authenticates, a CSRF token is generated and stored in their session
2. The client fetches the CSRF token and stores it in memory
3. The client adds the CSRF token to all mutation requests
4. The server validates the CSRF token for all mutation requests
5. If the token is invalid, the request is rejected

## Security Considerations

- CSRF tokens are stored in the user's session and are not accessible to other users
- CSRF tokens are validated for all mutation requests (POST, PUT, DELETE, PATCH)
- Safe methods (GET, HEAD, OPTIONS) do not require CSRF tokens
- CSRF tokens are refreshed when the user signs in

## Usage

### Client-Side

```typescript
import { configureSupabaseCsrf } from '@/lib/csrf';

// Initialize CSRF protection when the app starts
configureSupabaseCsrf().catch(error => {
  console.error('Failed to initialize CSRF protection:', error);
});
```

### Edge Functions

```typescript
import { withCsrfProtection } from '../utils/csrf-middleware.ts';

// Wrap your request handler with the CSRF middleware
serve(withCsrfProtection(handleRequest, { enforceForMutations: true }));
```

## Testing

To test the CSRF protection:

1. Make a mutation request without a CSRF token
2. Verify that the request is rejected
3. Make a mutation request with a valid CSRF token
4. Verify that the request is accepted

## Troubleshooting

If you encounter issues with CSRF protection:

1. Check that the CSRF token is being sent in the request headers
2. Verify that the CSRF token is valid
3. Check that the user is authenticated
4. Verify that the request method is a mutation method 