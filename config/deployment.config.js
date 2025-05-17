/**
 * Deployment configuration for different environments
 * Used by deployment scripts to determine environment-specific settings
 */
export default {
  // Development environment (local)
  development: {
    supabase: {
      project: process.env.SUPABASE_PROJECT_ID || 'anrpboahhkahdprohtln',
      url: process.env.SUPABASE_URL || 'http://localhost:54321',
    },
    build: {
      mode: 'development',
      sourcemaps: true,
    },
    edge_functions: {
      deploy: false, // Don't deploy edge functions in development
    }
  },
  
  // Preview/Staging environment
  preview: {
    supabase: {
      project: process.env.SUPABASE_PROJECT_ID || 'anrpboahhkahdprohtln',
      url: process.env.SUPABASE_PREVIEW_URL,
    },
    build: {
      mode: 'production',
      sourcemaps: true,
    },
    edge_functions: {
      deploy: true,
      functions: [
        'property-data',
        'property-valuation',
        'ai-market-analysis',
        'generate-pdf-report'
      ]
    },
    hosting: {
      platform: 'vercel', // or 'netlify', etc.
      team: process.env.VERCEL_TEAM_ID,
      project: process.env.VERCEL_PROJECT_ID,
    }
  },
  
  // Production environment
  production: {
    supabase: {
      project: process.env.SUPABASE_PROJECT_ID || 'anrpboahhkahdprohtln',
      url: process.env.SUPABASE_PROD_URL,
    },
    build: {
      mode: 'production',
      sourcemaps: false,
    },
    edge_functions: {
      deploy: true,
      functions: [
        'property-data',
        'property-valuation',
        'ai-market-analysis',
        'generate-pdf-report'
      ]
    },
    hosting: {
      platform: 'vercel', // or 'netlify', etc.
      team: process.env.VERCEL_TEAM_ID,
      project: process.env.VERCEL_PROJECT_ID,
    }
  }
}; 