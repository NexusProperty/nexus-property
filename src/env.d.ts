/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Supabase URL - the API endpoint for your Supabase instance
   */
  readonly VITE_SUPABASE_URL: string;
  
  /**
   * Supabase anonymous key - used for client-side access with RLS restrictions
   */
  readonly VITE_SUPABASE_ANON_KEY: string;
  
  /**
   * Supabase service role key - only use in secure server contexts
   * This should NEVER be exposed in client-side code
   */
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string;
  
  /**
   * Current environment - development, staging, or production
   */
  readonly NODE_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 