/**
 * Authentication Middleware for Supabase Edge Functions
 * 
 * This middleware handles user authentication and authorization for edge functions.
 * It provides a consistent way to verify JWT tokens and check user roles.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Define the request handler type
type RequestHandler = (req: Request) => Promise<Response>

// Define the authentication options
export interface AuthOptions {
  // Whether authentication is required
  requireAuth: boolean
  // Allowed roles (if empty, any authenticated user is allowed)
  allowedRoles?: string[]
}

// Define the authentication result
export interface AuthResult {
  // Whether the user is authenticated
  authenticated: boolean
  // The user ID if authenticated
  userId?: string
  // The user's role if authenticated
  userRole?: string
  // Error message if authentication failed
  error?: string
}

/**
 * Authentication middleware for Edge Functions
 * @param handler The request handler
 * @param options The authentication options
 * @returns A new request handler with authentication
 */
export function withAuth(
  handler: RequestHandler,
  options: AuthOptions = { requireAuth: true }
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

    // If authentication is not required, proceed with the handler
    if (!options.requireAuth) {
      return handler(req)
    }

    // Authenticate the request
    const authResult = await authenticateRequest(req)

    // If authentication failed, return an error
    if (!authResult.authenticated) {
      return new Response(
        JSON.stringify({ error: authResult.error || 'Authentication failed' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // If roles are specified, check if the user has one of the allowed roles
    if (options.allowedRoles && options.allowedRoles.length > 0) {
      // If user role is undefined or not in the allowed roles, return an error
      if (!authResult.userRole || !options.allowedRoles.includes(authResult.userRole)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }
    }

    // Add auth info to the request and proceed with the handler
    const authReq = new Request(req, {
      headers: new Headers(req.headers)
    })
    
    // Store auth result in request
    // @ts-expect-error - Adding custom property to Request object
    authReq.auth = authResult

    return handler(authReq)
  }
}

/**
 * Get the authentication result from a request
 * @param req The request
 * @returns The authentication result
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

    // Validate required environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Missing required environment variables',
        missingUrl: !supabaseUrl,
        missingAnonKey: !supabaseAnonKey
      }))

      return { 
        authenticated: false, 
        error: 'Server configuration error' 
      }
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return { 
        authenticated: false, 
        error: 'Missing Authorization header' 
      }
    }
    
    // Format should be "Bearer JWT_TOKEN"
    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      return { 
        authenticated: false, 
        error: 'Invalid Authorization format' 
      }
    }
    
    // Create a Supabase client with the anon key
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Verify the JWT
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { 
        authenticated: false, 
        error: error?.message || 'Authentication failed' 
      }
    }

    // Get user role from metadata if available
    const userRole = user.user_metadata?.role as string | undefined

    // Log authentication success
    console.log(JSON.stringify({
      level: 'info',
      message: 'User authenticated successfully',
      userId: user.id,
      userRole: userRole || 'no role'
    }))
    
    return { 
      authenticated: true, 
      userId: user.id,
      userRole
    }
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Authentication error',
      error: error.message
    }))
    
    return { 
      authenticated: false, 
      error: `Authentication error: ${error.message}` 
    }
  }
}

/**
 * Helper function to get the authenticated user from the request
 * @param req The request
 * @returns The authenticated user or null
 */
export function getAuthUser(req: Request): { userId: string, userRole?: string } | null {
  // @ts-expect-error - Accessing custom property from Request object
  if (!req.auth || !req.auth.authenticated) {
    return null
  }
  
  return {
    // @ts-expect-error - Accessing custom property from Request object
    userId: req.auth.userId!,
    // @ts-expect-error - Accessing custom property from Request object
    userRole: req.auth.userRole
  }
} 