# AppraisalHub: Comprehensive Development Plan

## 1. Requirements Analysis

### Core Functionality Requirements
1. **Authentication & User Management**
   - User registration, login, logout, password reset
   - Role-based access control (agents, customers, admins)
   - User profile management
   - Team management for real estate agencies

2. **Property Appraisal**
   - Property address input and validation
   - Data ingestion from property data sources
   - Algorithmic processing for initial valuation
   - AI-enhanced analysis of property features and market trends
   - Appraisal status tracking and management
   - Comparable properties display

3. **Report Generation**
   - PDF report creation with professional formatting
   - Report storage and management
   - Report sharing capabilities

4. **Administrative Functions**
   - User management dashboard
   - System monitoring and analytics
   - Content and configuration management

### Technical Requirements
1. **Security**
   - Secure authentication with JWT
   - Row Level Security (RLS) for data protection
   - Secure API access and key management
   - Input validation and sanitization

2. **Performance**
   - Responsive UI across devices
   - Efficient data loading and caching
   - Optimized API calls and database queries

3. **Scalability**
   - Well-structured database schema
   - Modular frontend architecture
   - Efficient Edge Functions design

4. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation support
   - Screen reader compatibility

## 2. Components Affected

### Frontend Components
1. **Authentication Module**
   - Registration, Login, Forgot Password pages
   - AuthContext provider
   - Protected routes implementation

2. **User Interface Components**
   - Layout components for different user roles
   - Navigation components (header, sidebar)
   - Dashboard components

3. **Appraisal Interface**
   - Property input form
   - Appraisal list and details views
   - Results display components
   - Report viewing interface

4. **Administrative Interface**
   - User management components
   - System monitoring displays
   - Configuration panels

### Backend Components
1. **Database Schema**
   - Users/profiles tables
   - Teams and memberships tables
   - Appraisals and related data tables
   - Reports and storage references

2. **Supabase Configuration**
   - Authentication settings
   - Storage buckets
   - RLS policies

3. **Edge Functions**
   - Authentication-related functions
   - Appraisal processing functions
   - AI integration functions
   - Report generation functions

## 3. Architecture Considerations

### Database Schema Design
```sql
-- Users (handled by Supabase Auth)
-- Profiles (extension of user data)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('agent', 'customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team Members
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- Appraisals
CREATE TABLE appraisals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  land_size NUMERIC,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  valuation_min NUMERIC,
  valuation_max NUMERIC,
  market_analysis TEXT,
  property_description TEXT,
  comparables_commentary TEXT,
  report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comparable Properties
CREATE TABLE comparable_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appraisal_id UUID REFERENCES appraisals(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  sale_price NUMERIC NOT NULL,
  sale_date DATE NOT NULL,
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  land_size NUMERIC,
  distance_km NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Row Level Security (RLS) Policies
```sql
-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teams RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Team members can read their teams
CREATE POLICY "Team members can read their teams" ON teams 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members WHERE team_id = id AND user_id = auth.uid()
    )
  );

-- Team owners and admins can update teams
CREATE POLICY "Team owners and admins can update teams" ON teams 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Appraisals RLS
ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;

-- Users can read appraisals they created
CREATE POLICY "Users can read own appraisals" ON appraisals 
  FOR SELECT USING (created_by = auth.uid());

-- Team members can read team appraisals
CREATE POLICY "Team members can read team appraisals" ON appraisals 
  FOR SELECT USING (
    team_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM team_members WHERE team_id = appraisals.team_id AND user_id = auth.uid()
    )
  );
```

### Frontend Architecture
```
src/
├── components/
│   ├── ui/                 # Base UI components from shadcn
│   │   ├── RootLayout.tsx
│   │   ├── AgentLayout.tsx
│   │   ├── CustomerLayout.tsx
│   │   └── AdminLayout.tsx
│   ├── auth/               # Auth-related components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── PasswordResetForm.tsx
│   ├── appraisal/          # Appraisal-related components
│   │   ├── AddressForm.tsx
│   │   ├── AppraisalList.tsx
│   │   ├── AppraisalDetails.tsx
│   │   └── ReportViewer.tsx
│   └── admin/              # Admin-specific components
│       ├── UserManagement.tsx
│       └── SystemMonitoring.tsx
├── lib/
│   ├── supabase.ts         # Canonical Supabase client
│   ├── utils.ts            # Utility functions
│   └── zodSchemas.ts       # Zod validation schemas
├── hooks/
│   ├── useAuth.ts          # Authentication hooks
│   ├── useAppraisals.ts    # Appraisal data hooks
│   └── useTeams.ts         # Team management hooks
├── types/
│   ├── database.ts         # Supabase database types
│   └── index.ts            # Other TypeScript types
├── services/
│   ├── auth.ts             # Auth service functions
│   ├── appraisals.ts       # Appraisal service functions
│   └── teams.ts            # Team service functions
├── pages/
│   ├── public/             # Public pages
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── agent/              # Agent pages
│   │   ├── Dashboard.tsx
│   │   └── Appraisals.tsx
│   ├── customer/           # Customer pages
│   │   ├── Dashboard.tsx
│   │   └── MyAppraisals.tsx
│   └── admin/              # Admin pages
│       ├── Dashboard.tsx
│       └── UserManagement.tsx
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── App.tsx
└── main.tsx
```

### Edge Functions Architecture
```
supabase/functions/
├── _shared/
│   ├── supabaseClient.ts   # Shared Supabase client helper
│   ├── types.ts            # Shared types
│   ├── utils.ts            # Shared utilities
│   └── zodSchemas.ts       # Shared Zod schemas
├── process-appraisal/
│   ├── index.ts            # Main function handler
│   └── handler.ts          # Core business logic
├── generate-ai-content/
│   ├── index.ts            # AI content generation handler
│   └── handler.ts          # AI processing logic
└── generate-report/
    ├── index.ts            # Report generation handler
    └── handler.ts          # PDF creation logic
```

## 4. Implementation Strategy

### Phase 1: Foundation & Project Setup

#### Step 1: Supabase Project Setup
1. Initialize Supabase project locally
   ```bash
   supabase init
   ```

2. Create development Supabase project in cloud dashboard
   - Set up project name and region
   - Note the project URL and API keys

3. Link local project to cloud project
   ```bash
   supabase link --project-ref <project-ref>
   ```

4. Start local development environment
   ```bash
   supabase start
   ```

#### Step 2: Database Schema Implementation
1. Create migration files for database schema
   ```bash
   # Make local changes in SQL editor
   supabase db diff --file init-schema
   ```

2. Apply migrations and verify
   ```bash
   supabase db reset
   ```

3. Implement RLS policies
   ```bash
   # Make local changes for RLS policies
   supabase db diff --file init-rls-policies
   ```

4. Test RLS policies with pgTAP
   ```bash
   # Create pgTAP tests
   supabase test db
   ```

#### Step 3: Frontend Supabase Setup
1. Create canonical Supabase client in `src/lib/supabase.ts`
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   import { Database } from '../types/database';

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
   ```

2. Generate TypeScript types for Supabase schema
   ```bash
   supabase gen types typescript --local > src/types/database.ts
   ```

3. Create `.env.local` for environment variables
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Phase 2: Authentication & User Management

#### Step 1: Authentication UI Implementation
1. Implement login form with Supabase Auth
   ```tsx
   // src/components/auth/LoginForm.tsx
   import { useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { z } from 'zod';
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { supabase } from '@/lib/supabase';

   const loginSchema = z.object({
     email: z.string().email(),
     password: z.string().min(6),
   });

   export const LoginForm = () => {
     const navigate = useNavigate();
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     
     const { register, handleSubmit, formState: { errors } } = useForm({
       resolver: zodResolver(loginSchema),
     });
     
     const onSubmit = async (data) => {
       setIsLoading(true);
       setError(null);
       
       try {
         const { error } = await supabase.auth.signInWithPassword({
           email: data.email,
           password: data.password,
         });
         
         if (error) throw error;
         
         // Redirect based on user role
         navigate('/agent');
       } catch (error) {
         setError(error.message);
       } finally {
         setIsLoading(false);
       }
     };
     
     return (
       <form onSubmit={handleSubmit(onSubmit)}>
         {/* Form fields and submit button */}
       </form>
     );
   };
   ```

2. Implement registration form

3. Implement password reset flow

#### Step 2: Authentication Context
1. Create AuthContext
   ```tsx
   // src/contexts/AuthContext.tsx
   import { createContext, useContext, useEffect, useState } from 'react';
   import { User, Session } from '@supabase/supabase-js';
   import { supabase } from '@/lib/supabase';

   type AuthContextType = {
     user: User | null;
     session: Session | null;
     loading: boolean;
     signOut: () => Promise<void>;
   };

   const AuthContext = createContext<AuthContextType | undefined>(undefined);

   export const AuthProvider = ({ children }) => {
     const [user, setUser] = useState<User | null>(null);
     const [session, setSession] = useState<Session | null>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       // Get initial session
       supabase.auth.getSession().then(({ data: { session } }) => {
         setSession(session);
         setUser(session?.user ?? null);
         setLoading(false);
       });

       // Listen for auth changes
       const { data: { subscription } } = supabase.auth.onAuthStateChange(
         (_event, session) => {
           setSession(session);
           setUser(session?.user ?? null);
           setLoading(false);
         }
       );

       return () => subscription.unsubscribe();
     }, []);

     const signOut = async () => {
       await supabase.auth.signOut();
     };

     return (
       <AuthContext.Provider value={{ user, session, loading, signOut }}>
         {children}
       </AuthContext.Provider>
     );
   };

   export const useAuth = () => {
     const context = useContext(AuthContext);
     if (context === undefined) {
       throw new Error('useAuth must be used within an AuthProvider');
     }
     return context;
   };
   ```

2. Implement protected routes
   ```tsx
   // src/components/auth/ProtectedRoute.tsx
   import { Navigate, Outlet } from 'react-router-dom';
   import { useAuth } from '@/contexts/AuthContext';

   type ProtectedRouteProps = {
     allowedRoles?: string[];
   };

   export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
     const { user, loading } = useAuth();
     
     // If still loading auth state, show loading spinner
     if (loading) {
       return <div>Loading...</div>;
     }
     
     // If no user, redirect to login
     if (!user) {
       return <Navigate to="/login" replace />;
     }
     
     // If roles specified, check if user has permission
     if (allowedRoles) {
       // Fetch user role from profiles table or session
       const userRole = 'agent'; // Replace with actual role fetching
       
       if (!allowedRoles.includes(userRole)) {
         return <Navigate to="/unauthorized" replace />;
       }
     }
     
     // User is authenticated and authorized
     return <Outlet />;
   };
   ```

#### Step 3: Profile Management
1. Create profile service functions
   ```typescript
   // src/services/profile.ts
   import { supabase } from '@/lib/supabase';
   import { Database } from '@/types/database';

   type Profile = Database['public']['Tables']['profiles']['Row'];
   type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

   export const getProfile = async (): Promise<Profile | null> => {
     const { data: user } = await supabase.auth.getUser();
     
     if (!user) return null;
     
     const { data, error } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', user.user.id)
       .single();
     
     if (error) throw error;
     
     return data;
   };

   export const updateProfile = async (updates: ProfileUpdate): Promise<Profile> => {
     const { data: user } = await supabase.auth.getUser();
     
     if (!user) throw new Error('Not authenticated');
     
     const { data, error } = await supabase
       .from('profiles')
       .update(updates)
       .eq('id', user.user.id)
       .select()
       .single();
     
     if (error) throw error;
     
     return data;
   };
   ```

2. Implement profile management UI

### Phase 3: Property Appraisal Core

#### Step 1: Appraisal Form Implementation
1. Create appraisal input form with validation
   ```tsx
   // src/components/appraisal/AddressForm.tsx
   import { z } from 'zod';
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { useState } from 'react';
   import { createAppraisal } from '@/services/appraisals';

   const appraisalSchema = z.object({
     address: z.string().min(5, 'Full address is required'),
     propertyType: z.enum(['house', 'apartment', 'townhouse', 'land']),
     bedrooms: z.number().int().min(0).optional(),
     bathrooms: z.number().int().min(0).optional(),
     landSize: z.number().min(0).optional(),
   });

   export const AddressForm = () => {
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [error, setError] = useState<string | null>(null);
     
     const { register, handleSubmit, formState: { errors } } = useForm({
       resolver: zodResolver(appraisalSchema),
     });
     
     const onSubmit = async (data) => {
       setIsSubmitting(true);
       setError(null);
       
       try {
         await createAppraisal(data);
         // Handle success
       } catch (err) {
         setError(err.message);
       } finally {
         setIsSubmitting(false);
       }
     };
     
     return (
       <form onSubmit={handleSubmit(onSubmit)}>
         {/* Form fields */}
       </form>
     );
   };
   ```

2. Create appraisal service functions
   ```typescript
   // src/services/appraisals.ts
   import { supabase } from '@/lib/supabase';
   import { Database } from '@/types/database';

   type Appraisal = Database['public']['Tables']['appraisals']['Row'];
   type AppraisalInsert = Database['public']['Tables']['appraisals']['Insert'];

   export const createAppraisal = async (data: Omit<AppraisalInsert, 'id' | 'created_by' | 'status' | 'created_at' | 'updated_at'>): Promise<Appraisal> => {
     const { data: user } = await supabase.auth.getUser();
     
     if (!user) throw new Error('Not authenticated');
     
     const { data: appraisal, error } = await supabase
       .from('appraisals')
       .insert({
         ...data,
         created_by: user.user.id,
         status: 'pending',
       })
       .select()
       .single();
     
     if (error) throw error;
     
     // Trigger appraisal processing
     await supabase.functions.invoke('process-appraisal', {
       body: { appraisalId: appraisal.id }
     });
     
     return appraisal;
   };

   export const getAppraisals = async (): Promise<Appraisal[]> => {
     const { data, error } = await supabase
       .from('appraisals')
       .select('*')
       .order('created_at', { ascending: false });
     
     if (error) throw error;
     
     return data || [];
   };

   export const getAppraisal = async (id: string): Promise<Appraisal> => {
     const { data, error } = await supabase
       .from('appraisals')
       .select('*, comparable_properties(*)')
       .eq('id', id)
       .single();
     
     if (error) throw error;
     
     return data;
   };
   ```

#### Step 2: Processing Edge Function
1. Create process-appraisal Edge Function
   ```typescript
   // supabase/functions/process-appraisal/handler.ts
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
   import { z } from 'https://esm.sh/zod@3';

   const requestSchema = z.object({
     appraisalId: z.string().uuid(),
   });

   export const handler = async (req: Request): Promise<Response> => {
     try {
       const body = await req.json();
       const { appraisalId } = requestSchema.parse(body);
       
       // Create Supabase client
       const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
       const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
       const supabase = createClient(supabaseUrl, supabaseServiceKey);
       
       // Update status to processing
       await supabase
         .from('appraisals')
         .update({ status: 'processing' })
         .eq('id', appraisalId);
       
       // TODO: Fetch property data from external sources
       
       // TODO: Process data and update appraisal
       
       // Update status to completed
       await supabase
         .from('appraisals')
         .update({
           status: 'completed',
           valuation_min: 500000, // Example values
           valuation_max: 550000,
         })
         .eq('id', appraisalId);
       
       return new Response(
         JSON.stringify({ success: true }),
         { headers: { 'Content-Type': 'application/json' } }
       );
     } catch (error) {
       console.error('Error processing appraisal:', error);
       
       return new Response(
         JSON.stringify({ error: error.message }),
         { status: 400, headers: { 'Content-Type': 'application/json' } }
       );
     }
   };
   ```

2. Create index.ts handler
   ```typescript
   // supabase/functions/process-appraisal/index.ts
   import { handler } from './handler.ts';

   Deno.serve(handler);
   ```

#### Step 3: Appraisal Results UI
1. Create appraisal list component
2. Create appraisal details component with results display

### Phase 4: AI Integration

#### Step 1: AI Service Setup
1. Create AI processing Edge Function

#### Step 2: AI Content Display
1. Update appraisal details component to display AI-generated content

### Phase 5: Report Generation

#### Step 1: Report Template Design
1. Design PDF report template

#### Step 2: Report Generation Function
1. Create report generation Edge Function

#### Step 3: Report Viewing UI
1. Create report viewer component

### Phase 6: Administrative Features

#### Step 1: Admin Dashboard
1. Create admin dashboard layout and navigation

#### Step 2: User Management
1. Create user management UI
2. Implement user management functions

### Phase 7: Testing & Optimization

#### Step 1: Testing Implementation
1. Write unit tests for key components and functions
2. Write integration tests for critical flows
3. Write E2E tests for user journeys

#### Step 2: Performance Optimization
1. Implement query optimization
2. Optimize React component rendering

### Phase 8: Deployment & Maintenance

#### Step 1: CI/CD Setup
1. Configure GitHub Actions workflow for CI/CD

#### Step 2: Production Deployment
1. Configure production environment
2. Deploy application to production

## 5. Dependencies & Integration Points

### External Dependencies
1. **Supabase Platform**
   - Database (PostgreSQL)
   - Authentication
   - Storage
   - Edge Functions

2. **Google Vertex AI/Gemini**
   - AI content generation
   - Natural language processing

3. **Property Data APIs**
   - CoreLogic NZ
   - REINZ data

### Integration Challenges
1. **Secure API Key Management**
   - Use Supabase secrets for backend keys
   - Use environment variables for frontend keys

2. **Data Transformation**
   - Normalize external data formats
   - Handle inconsistencies in property data

3. **AI Integration**
   - Develop effective prompt engineering
   - Handle rate limits and quotas

## 6. Challenges & Mitigations

### Security Challenges
1. **Challenge**: Ensuring proper RLS policies for multi-tenant data
   **Mitigation**: Comprehensive pgTAP tests for all RLS policies

2. **Challenge**: Securing sensitive API keys
   **Mitigation**: Store keys only in Supabase secrets, never in code

### Technical Challenges
1. **Challenge**: Managing complex state in the frontend
   **Mitigation**: Use React Query for server state, Context for global state

2. **Challenge**: PDF generation in serverless environment
   **Mitigation**: Research lightweight PDF libraries compatible with Edge Functions

### Integration Challenges
1. **Challenge**: External API reliability
   **Mitigation**: Implement retry logic and error handling

2. **Challenge**: AI model limitations
   **Mitigation**: Develop fallback strategies for AI content generation

## 7. Components Requiring Creative Phase

1. **AI Prompt Engineering**
   - Requires experimentation to get optimal results for property analysis
   - Need iterative design approach

2. **Report Template Design**
   - Requires visual design skills
   - Multiple iterations to achieve professional appearance

3. **Dashboard UI Design**
   - Complex data visualization requirements
   - Needs user experience considerations

## 8. Timeline Estimation

1. **Phase 1: Foundation & Project Setup** - 1 week
2. **Phase 2: Authentication & User Management** - 2 weeks
3. **Phase 3: Property Appraisal Core** - 3 weeks
4. **Phase 4: AI Integration** - 2 weeks
5. **Phase 5: Report Generation** - 2 weeks
6. **Phase 6: Administrative Features** - 2 weeks
7. **Phase 7: Testing & Optimization** - 2 weeks
8. **Phase 8: Deployment & Maintenance** - 1 week

**Total Estimated Time**: 15 weeks

## 9. Next Mode Recommendation

Based on the complexity and requirements, the next recommended mode is:
**CREATIVE MODE** - To design the AI prompt engineering strategy and report templates 