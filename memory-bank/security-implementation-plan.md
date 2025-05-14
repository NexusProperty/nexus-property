# Security Implementation Plan

This document outlines the implementation plan for the remaining security findings from the authentication flow audit. It provides detailed steps and technical considerations for each recommendation.

## Implemented Security Improvements

- ✅ **Enhanced Password Validation**
  - Increased minimum length to 10 characters
  - Added special character requirement
  - Implemented common pattern detection
  - Applied to both registration and password updates

- ✅ **Token Refresh Mechanism**
  - Added automatic token refresh at regular intervals
  - Implemented manual token refresh function
  - Added user activity tracking
  - Integrated with CSRF token refreshing

- ✅ **Secure Redirects**
  - Added URL validation for password reset redirects
  - Implemented origin checking for security
  - Added fallback to safe default URLs

- ✅ **Generic Error Messages**
  - Updated authentication error messages to be generic
  - Prevented information disclosure in error responses
  - Maintained detailed logging for debugging

## Pending Security Improvements

### 1. Rate Limiting (High Priority)

**Implementation Plan:**

1. Create a rate-limiting middleware for Supabase Edge Functions:
   ```typescript
   // Example implementation in supabase/functions/utils/rate-limiter.ts
   export function withRateLimit(handler, options = { limit: 10, window: 60 }) {
     return async (req) => {
       const ip = req.headers.get('x-real-ip') || 'unknown';
       const endpoint = req.url.pathname;
       
       // Check if rate limit exceeded
       const isLimitExceeded = await checkRateLimit(ip, endpoint, options);
       
       if (isLimitExceeded) {
         return new Response(
           JSON.stringify({ error: 'Too many requests' }),
           { status: 429, headers: { 'Content-Type': 'application/json' } }
         );
       }
       
       return handler(req);
     };
   }
   ```

2. Implement a distributed rate limiting store using Redis or similar:
   ```typescript
   async function checkRateLimit(ip, endpoint, options) {
     const key = `ratelimit:${endpoint}:${ip}`;
     
     // Store implementation would vary based on database/caching solution
     // Example using a hypothetical KV store:
     const current = await kvStore.get(key) || 0;
     
     if (current >= options.limit) {
       return true;
     }
     
     await kvStore.incrWithExpiry(key, 1, options.window);
     return false;
   }
   ```

3. Apply rate limiting to authentication endpoints:
   ```typescript
   // Example application to login endpoint
   export const handler = withRateLimit(
     withAuth(async (req) => {
       // Login implementation
     }, { requireAuth: false }),
     { limit: 5, window: 300 } // 5 attempts per 5 minutes
   );
   ```

4. Implement progressive delays for repeated failures:
   ```typescript
   function calculateBackoff(attempts) {
     return Math.min(Math.pow(2, attempts) * 1000, 30000); // Max 30 second delay
   }
   ```

### 2. Account Lockout (Medium Priority)

**Implementation Plan:**

1. Create a table to track failed login attempts:
   ```sql
   CREATE TABLE auth_attempts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     email TEXT NOT NULL,
     ip_address TEXT NOT NULL,
     success BOOLEAN NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );
   ```

2. Implement a function to check and enforce account lockouts:
   ```typescript
   async function checkAccountLockout(email) {
     // Get recent failed attempts for this email
     const { data, error } = await supabaseAdmin
       .from('auth_attempts')
       .select('*')
       .eq('email', email)
       .eq('success', false)
       .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 minutes
     
     if (error) throw error;
     
     // Check if account should be locked
     if (data && data.length >= 5) {
       const mostRecentAttempt = data[0].created_at;
       const lockoutDuration = 15 * 60 * 1000; // 15 minutes
       const unlockTime = new Date(new Date(mostRecentAttempt).getTime() + lockoutDuration);
       
       if (new Date() < unlockTime) {
         return {
           locked: true,
           unlockTime,
         };
       }
     }
     
     return { locked: false };
   }
   ```

3. Integrate with the authentication service:
   ```typescript
   // Update signInWithEmail function
   export async function signInWithEmail(email, password, rememberMe) {
     try {
       // Check for account lockout
       const lockStatus = await checkAccountLockout(email);
       
       if (lockStatus.locked) {
         return {
           success: false,
           error: 'Too many failed login attempts. Please try again later.',
           data: null,
         };
       }
       
       // Rest of authentication logic
     } catch (error) {
       // Error handling
     }
   }
   ```

4. Record login attempts:
   ```typescript
   async function recordLoginAttempt(email, userId, ipAddress, success) {
     await supabaseAdmin
       .from('auth_attempts')
       .insert({
         email,
         user_id: userId || null,
         ip_address: ipAddress,
         success,
       });
   }
   ```

### 3. Session Management for Sensitive Operations (Low Priority)

**Implementation Plan:**

1. Create a function to check recent authentication:
   ```typescript
   export async function requiresReauthentication(session, maxAgeMinutes = 15) {
     if (!session) return true;
     
     const sessionStart = new Date(session.created_at);
     const sessionAge = (Date.now() - sessionStart.getTime()) / (60 * 1000);
     
     return sessionAge > maxAgeMinutes;
   }
   ```

2. Implement a re-authentication component:
   ```typescript
   // ReauthenticateModal.tsx
   export const ReauthenticateModal = ({ isOpen, onSuccess, onCancel }) => {
     const [password, setPassword] = useState('');
     const [error, setError] = useState('');
     const { user } = useAuth();
     
     const handleSubmit = async (e) => {
       e.preventDefault();
       
       if (!user?.email) {
         return;
       }
       
       const result = await signInWithEmail(user.email, password, false);
       
       if (result.success) {
         onSuccess();
       } else {
         setError('Incorrect password');
       }
     };
     
     // Component JSX implementation
   };
   ```

3. Use re-authentication for sensitive operations:
   ```typescript
   // Example usage in a sensitive operation component
   export const DeleteAccountComponent = () => {
     const { session, user } = useAuth();
     const [showReauth, setShowReauth] = useState(false);
     
     const handleDeleteClick = async () => {
       const needsReauth = await requiresReauthentication(session);
       
       if (needsReauth) {
         setShowReauth(true);
       } else {
         // Proceed with account deletion
         performAccountDeletion();
       }
     };
     
     // Component JSX implementation
   };
   ```

## Implementation Timeline

- **Week 1**: Implement rate limiting for authentication endpoints
- **Week 2**: Develop account lockout mechanism
- **Week 3**: Add re-authentication for sensitive operations
- **Week 4**: Testing and final adjustments

## Conclusion

This implementation plan addresses the remaining security findings from the authentication flow audit. By systematically implementing these features, we will significantly enhance the security of the Nexus Property application.

The prioritized approach ensures that the most critical security improvements are implemented first, with lower priority items scheduled for later implementation when resources permit. 