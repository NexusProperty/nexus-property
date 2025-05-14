/**
 * CSRF Middleware for Supabase Edge Functions
 * 
 * This middleware validates CSRF tokens for mutation requests.
 * It should be used in all Edge Functions that modify data.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Define the request handler type
type RequestHandler = (req: Request) => Promise<Response>

// Define the middleware options
interface CsrfMiddlewareOptions {
  // Whether to enforce CSRF protection for all requests
  enforceForAll?: boolean
  // Whether to enforce CSRF protection for mutation methods only
  enforceForMutations?: boolean
  // Whether to enforce CSRF protection for specific methods
  enforceForMethods?: string[]
}

/**
 * CSRF middleware for Edge Functions
 * @param handler The request handler
 * @param options The middleware options
 * @returns A new request handler with CSRF protection
 */
export function withCsrfProtection(
  handler: RequestHandler,
  options: CsrfMiddlewareOptions = { enforceForMutations: true }
): RequestHandler {
  return async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        },
      })
    }

    // Check if the request needs CSRF protection
    const needsProtection = 
      options.enforceForAll || 
      (options.enforceForMutations && isMutationMethod(req.method)) ||
      (options.enforceForMethods && options.enforceForMethods.includes(req.method))

    // If the request doesn't need CSRF protection, proceed with the handler
    if (!needsProtection) {
      return handler(req)
    }

    // Get the CSRF token from the request headers
    const csrfToken = req.headers.get('x-csrf-token')

    // If no CSRF token is provided, return an error
    if (!csrfToken) {
      return new Response(
        JSON.stringify({ error: 'CSRF token is required' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Validate the CSRF token
    const { data, error } = await supabaseClient.rpc('validate_csrf_token', { token: csrfToken })

    // If the token is invalid, return an error
    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // If the token is valid, proceed with the handler
    return handler(req)
  }
}

/**
 * Check if a request method is a mutation method
 * @param method The request method
 * @returns Whether the method is a mutation method
 */
function isMutationMethod(method: string): boolean {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)
} 