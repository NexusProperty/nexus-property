## Appraisal Enhancement Implementation: Phase 4 Progress

**Date**: 2025-05-26
**Status**: In Progress (75% Complete)

### Summary of Current Progress

We've made significant progress on Phase 4 of the Appraisal Generation System Enhancement, focusing on Report Generation Enhancement. The following tasks have been completed or are in progress:

#### Completed Tasks:
1. **PDF Generation Strategy Selection**
   - Evaluated Puppeteer/Playwright vs pdfMake thoroughly
   - Decided to continue using Puppeteer for better HTML/CSS rendering fidelity and existing implementation
   - Created detailed documentation of the evaluation process in `memory-bank/build/pdf-generation-evaluation.md`

2. **Branding Integration**
   - Implemented comprehensive branding data retrieval from teams and profiles tables
   - Created fallback branding mechanism for cases where specific elements are not defined
   - Enhanced the Edge Function to support the new branding configurations
   - Updated the relevant interfaces for branding configuration

3. **Report Template Design Enhancement**
   - Created detailed wireframes for the enhanced report layout in `memory-bank/build/report-template-wireframe.md`
   - Enhanced HTML template with new sections for CoreLogic and REINZ market data
   - Implemented dynamic styling using CSS variables for consistent branding application
   - Added new visualization areas for market trends and comparable properties

4. **Partial Report Generation Edge Function Update**
   - Updated data aggregation logic to include additional CoreLogic and REINZ data
   - Enhanced the existing function to support more complex branding options
   - Added sophisticated data formatting for the market statistics

#### In Progress Tasks:
1. **Image Handling Optimization**
   - Creating an image optimization utility in the Edge Function
   - Implementing image caching for agency logos and property images
   - Adding compression for large images
   - Implementing lazy loading strategy for report images

### Next Steps
1. Complete the image handling optimization work
2. Conduct comprehensive testing of the enhanced report generation process
3. Update documentation for the report generation process
4. Begin preparation for Phase 5: Frontend Updates

### Technical Implementation Details

The implementation follows these key principles:
1. **Dynamic Branding**: Using CSS variables and JS template data to apply consistent branding
2. **Enhanced Data Visualization**: Creating more comprehensive market and property data displays
3. **Optimized Image Handling**: Implementing caching and optimization for better performance
4. **Structured Error Handling**: Providing comprehensive, structured JSON logging for better observability

These enhancements will result in more professional, visually appealing, and informative appraisal reports that effectively showcase the agency brand while providing comprehensive property valuation information.

## AppraisalHub: Frontend Development Plan


**1. Introduction & Goals**

This document outlines the development plan for the AppraisalHub frontend application. It builds upon the established roadmap, providing detailed guidance on code structure, technology choices, best practices, documentation standards, and workflows to ensure a high-quality product.

**Primary Goals:**

*   Build a responsive, performant, accessible, and user-friendly interface based on the roadmap phases.
*   Ensure maintainability, scalability, and testability of the codebase through clear structure and comprehensive testing.
*   Minimize bugs and inconsistencies through standardized practices, tooling, robust error handling, and adherence to a clear "Definition of Done".
*   Facilitate smooth collaboration and onboarding for developers through comprehensive documentation (README, ADRs, Guides).
*   Deliver a secure and reliable user experience, incorporating security best practices from the start.

**2. Core Principles**

*   **Consistency:** Apply consistent patterns for state management, API interaction, styling, component structure, logging, and error handling.
*   **Modularity:** Build reusable components and services with clear responsibilities.
*   **Clarity:** Write clear, well-documented code (comments, READMEs, ADRs, Guides). Prioritize readability.
*   **Testability:** Design code with testing in mind; strive for high test coverage for critical parts. Adhere strictly to the defined DoD for testing requirements.
*   **Type Safety:** Leverage TypeScript extensively (`strict` mode enabled) to catch errors early.
*   **User Experience (UX):** Prioritize smooth interactions, clear feedback (loading/error states), and **Accessibility (a11y)** as a core requirement.
*   **Security by Design:** Implement security best practices at the frontend layer (input validation, dependency management, secure API interaction).
*   **Performance:** Optimize for fast load times, efficient rendering, and smooth interactions.
*   **Documentation Driven:** Maintain up-to-date documentation as a key part of the development process.

**3. Technology Stack (Confirmation)**

*   **Framework:** Next.js (or specify chosen framework: React/Vite, Vue.js)
*   **Language:** TypeScript
*   **UI Library:** Shadcn/UI (or specify: Material UI, Chakra UI, etc.)
*   **Styling:** Tailwind CSS (or specify: CSS Modules, Styled Components)
*   **State Management:** React Context API (for global state like Auth) + Zustand/Jotai (for complex local/shared state) or built-in framework state + component state. *Decision finalized and documented in an ADR.*
*   **Data Fetching/Caching:** SWR or React Query (TanStack Query). *Decision finalized and documented in an ADR.*
*   **Forms:** React Hook Form + Zod (for schema validation).
*   **Testing:** Vitest/Jest (Unit/Integration) + React Testing Library (+ `jest-axe` for a11y checks) + Cypress/Playwright (E2E).
*   **Linting/Formatting:** ESLint + Prettier.
*   **Feature Flagging:** (Optional) Consider LaunchDarkly, Flagsmith, or custom solution if needed. *Decision and implementation documented in an ADR if used.*
*   **Error Tracking:** Sentry (or similar).

**4. Code Structure & Organization**

```
appraisalhub-frontend/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router specific (or pages/)
│   │   # ... (Routes structure: groups for auth, app) ...
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # Base UI elements (often from lib)
│   │   ├── common/           # General reusable components (LoadingSpinner, ErrorMessage)
│   │   ├── layout/           # Layout components (Header, Sidebar)
│   │   └── features/         # Feature-specific components (Auth, Appraisals, Dashboard)
│   ├── lib/                  # Core libraries, utilities
│   │   ├── supabase.ts       # **SINGLE canonical Supabase client instance**
│   │   ├── utils.ts          # General utility functions (formatting, etc.)
│   │   └── zodSchemas.ts     # Shared Zod validation schemas for forms
│   ├── services/             # API interaction layer (functions calling Supabase client)
│   │   ├── auth.ts
│   │   ├── appraisals.ts
│   │   └── user.ts
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useAppraisals.ts  # (Likely wraps SWR/React Query logic)
│   ├── contexts/             # React Context providers
│   │   └── AuthContext.tsx
│   ├── styles/               # Global styles, theme configuration
│   ├── types/                # TypeScript type definitions
│   │   ├── index.ts          # General application types
│   │   └── supabase.ts       # Auto-generated Supabase types
│   └── constants/            # Application-wide constants
├── tests/                  # Test files (alternative: co-locate)
│   ├── integration/
│   ├── unit/
│   └── e2e/                  # Cypress/Playwright tests
├── docs/                   # Project Documentation
│   ├── adr/                # Architectural Decision Records (Markdown files)
│   ├── OnboardingGuide.md
│   └── TroubleshootingGuide.md
├── .env.local              # Local environment variables (ignored by Git)
├── .eslintrc.json
├── .gitignore
├── next.config.js
├── package.json
├── prettier.config.js
├── tailwind.config.js
├── tsconfig.json           # Ensure 'strict' mode is enabled
└── README.md
```

**5. Development Best Practices & Guidelines**

*   **Definition of Done (DoD):** A task/story is only "Done" when it meets all criteria: Code complete & reviewed, All required tests (unit, integration, E2E if applicable) written & passing, Accessibility checks passed (automated & manual), Documentation updated (code comments, READMEs, ADRs, guides as needed), Deployed & verified on staging (if applicable).
*   **5.1. Supabase Client Usage (**CRITICAL**):** Adhere strictly: Single file (`lib/supabase.ts`), Env Vars ONLY (`NEXT_PUBLIC_...`), Import elsewhere.
*   **5.2. Component Design:** Focus on Reusability, Clear Props (TypeScript Interfaces), Single Responsibility, Composition. **Design with accessibility in mind from the start** (semantic HTML, keyboard nav). Use controlled components via RHF+Zod.
*   **5.3. State Management:** Use appropriate tools for scope (Global: Context/Zustand; Server: SWR/React Query; Local: `useState`). *Document choices in ADRs*. Minimize global state.
*   **5.4. API Interaction (`services/` layer):** Centralize all Supabase client calls here. Abstract implementation details from UI components/hooks. Handle errors gracefully, returning consistent structures. Use Supabase types.
*   **5.5. Styling:** Primarily use Tailwind utilities. Use theme config for consistency. Avoid inline styles. Ensure sufficient color contrast for accessibility.
*   **5.6. TypeScript Usage:** Enable `strict` mode. Use explicit types; leverage generated Supabase types. Avoid `any`.
*   **5.7. Error Handling & Logging:** Provide user-friendly UI feedback. Use Error Boundaries. Implement **structured logging** where helpful (e.g., log context with errors). Integrate Sentry for production, ensuring PII scrubbing if necessary.
*   **5.8. Testing Strategy:** Employ the testing pyramid. Write meaningful tests. Include **Accessibility testing** (`jest-axe` + manual checks) as part of standard testing. Define clear **Test Data Management** strategies (mocking).
*   **5.9. Code Quality & Consistency:** Enforce via Linters/Formatters. Use clear naming conventions. Write useful comments (explain "why"). Document key decisions in **ADRs**. Conduct regular code reviews (PRs + occasional deep dives).
*   **5.10. Version Control (Git):** Use standard branching (e.g., GitHub Flow). Write Conventional Commits. Use PRs with required CI checks (lint, test, build) before merging to `main`.
*   **5.11. Environment Management:** Use `.env.local` (gitignored) for local secrets. Use platform (Lovable) for production env vars. **No secrets in code.**
*   **5.12. Accessibility (a11y):** Mandatory part of DoD. Use semantic HTML, ARIA where needed, ensure keyboard nav, check contrasts, test with tools (Axe) and manually (keyboard/screen reader).
*   **5.13. Performance:** Optimize bundle size (code splitting), images (`next/image`), rendering (memoization wisely). Analyze performance using browser dev tools & Lighthouse. Plan for **Load Testing** if necessary.
*   **5.14. Input Validation:** Use Zod schemas (`lib/zodSchemas.ts`) with React Hook Form for **all** user input validation. Be specific about rules (type, length, format, range).
*   **5.15. Dependency Management:** Run `npm audit` regularly. Use Dependabot/Snyk for automated scanning/updates. Review dependency updates before merging.
*   **5.16. Feature Flagging:** If used, implement consistently. Plan for flag cleanup. Document usage in code and potentially ADRs.
*   **5.17. Data Privacy:** Be mindful of GDPR/CCPA. Minimize PII handling on the frontend. Implement consent mechanisms correctly if required by backend logic/regulations.

**6. Phase-Specific Focus**

*   **Phase 1-2 (Foundation, Auth):** Prioritize structure, tooling, Supabase client setup, auth flow security, core testing setup, initial documentation (README, Onboarding, ADRs), defining and practicing DoD.
*   **Phase 3 (Ingestion UI, Algo Results):** Focus on robust API service layer, secure form handling (RHF+Zod), effective data display (SWR/RQ), error handling. Evaluate feature flags.
*   **Phase 4 (AI Content):** Ensure clean integration into UI. Update tests comprehensively.
*   **Phase 5 (Reports, Finalization):** Implement report interactions reliably. Heavy focus on **UI Polish** and **Accessibility testing/remediation**. Complete documentation.
*   **Phase 6 (Testing, Optimization):** Execute comprehensive testing (incl. E2E, Load, Security, Accessibility). Final performance tuning. Finalize all documentation. Ensure DoD is met for all features.

**7. Documentation & Knowledge Sharing**

*   **Central Hub:** Project `README.md` links to other key documents.
*   **Decisions:** Use `docs/adr/` for significant architectural choices.
*   **Guides:** Maintain `docs/OnboardingGuide.md` and `docs/TroubleshootingGuide.md`.
*   **Code Clarity:** Use JSDoc/TSDoc for functions/hooks/components. Explain complex logic with comments.
*   **Reviews:** Foster knowledge sharing through PR reviews and occasional team design/code reviews.

**8. Conclusion**

This comprehensive development plan provides the blueprint for building the AppraisalHub frontend. By rigorously following these guidelines—emphasizing structure, Supabase best practices, security, accessibility, thorough testing (governed by a DoD), and robust documentation—the team can deliver a high-quality, maintainable, and successful application.

---

## AppraisalHub: Backend Development Plan (Rewritten - V1.1)

**Version:** 1.1
**Date:** 2024-03-04

**1. Introduction & Goals**

This document details the development plan for the AppraisalHub backend, centered on Supabase (Database, Auth, Storage, Edge Functions). It integrates the roadmap with specific structural guidance, best practices, security considerations, testing strategies, operational procedures, and documentation requirements to ensure a robust and reliable system.

**Primary Goals:**

*   Implement secure, scalable, and maintainable backend functionality as per the roadmap.
*   Guarantee data integrity and enforce strict access control using PostgreSQL features and Row Level Security (RLS).
*   Minimize development issues through mandated Supabase workflows (especially migrations), comprehensive testing (including pgTAP for DB/RLS), structured logging, and adherence to a clear "Definition of Done".
*   Provide reliable, performant, and secure APIs for the frontend and potentially other clients.
*   Foster efficient development and operations through clear documentation and standardized practices.

**2. Core Principles**

*   **Local-First Development:** Prioritize local Supabase instance for development and testing.
*   **Migration-Driven Schema:** ALL DB changes managed via timestamped migrations generated by `supabase db diff` and tested via `supabase db reset`.
*   **Least Privilege:** Default to Anon Key; use Service Role Key with extreme caution, explicit justification (ADR), and review. RLS is the core security layer.
*   **Stateless & Idempotent Functions:** Design Edge Functions accordingly where practical.
*   **Clear Boundaries:** Separate concerns within functions (validation, data access, business logic, external API calls).
*   **Robust Error Handling & Structured Logging:** Implement comprehensive, consistent error handling and informative JSON logging for traceability and monitoring.
*   **Security by Design:** Embed security checks (RLS, JWT verification, strict input validation, secret management) throughout the development lifecycle.
*   **Testability:** Design for testability (DB: pgTAP; Functions: Deno test). Adhere to DoD for testing.
*   **Documentation Driven:** Maintain essential documentation (ADRs, Guides, READMEs) alongside code.

**3. Technology Stack (Confirmation)**

*   **Platform:** Supabase (PostgreSQL, Auth, Edge Functions/Deno, Storage)
*   **Language:** TypeScript (for Edge Functions, tests, scripts)
*   **Key Libraries (Edge Functions):** `@supabase/supabase-js`, `@google-cloud/vertexai`, PDF Library (TBD, e.g., `puppeteer-core`, `pdf-lib`), Zod (for input validation).
*   **Database Testing:** pgTAP.
*   **Scheduling:** `pg_cron` (for DB-centric tasks).

**4. Supabase Project Structure (Local)**

```
appraisalhub-backend/ (or within mono-repo)
├── supabase/
│   ├── config.toml
│   ├── migrations/         # **AUTHORITATIVE SCHEMA HISTORY** (YYYYMMDDHHMMSS_name.sql)
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── supabaseClient.ts # (Optional) Helper
│   │   │   ├── types.ts        # Shared backend types
│   │   │   ├── utils.ts        # Shared utility functions
│   │   │   └── zodSchemas.ts   # Shared Zod validation schemas
│   │   ├── <function_name>/
│   │   │   └── index.ts      # Entry point (HTTP handling, validation)
│   │   │   └── handler.ts    # (Recommended) Core logic handler (easier unit testing)
│   │   │   └── types.ts      # Function-specific types
│   ├── schema.sql            # Reference only - **DO NOT EDIT MANUALLY AS SOURCE OF TRUTH**
│   ├── seed.sql              # Local development seed data
│   └── tests/
│       └── db/               # pgTAP tests (e.g., test_rls_appraisals.sql)
├── .env                    # Local secrets for `supabase start` (gitignored)
├── .gitignore
├── import_map.json         # Deno import map for functions
├── docs/                   # Shared documentation (if mono-repo)
│   ├── adr/                # Architectural Decision Records
│   ├── OnboardingGuide.md  # Backend sections
│   └── TroubleshootingGuide.md # Backend sections
└── README.md               # Backend setup, dev, deploy instructions
```

**5. Database Design & Migration Workflow (**CRITICAL**)**

*   **Mandatory Workflow:** `Make Change Locally` -> `supabase db diff` -> `Review SQL` -> `supabase db reset` (Verify ALL migrations run) -> `Commit`. **No manual edits to applied migration files.**
*   **RLS:** Define via `CREATE POLICY` in migrations (timestamped *after* table creation). Test comprehensively with pgTAP for various roles/operations.
*   **Data Types & Constraints:** Use appropriate types. Enforce data integrity with `NOT NULL`, `CHECK` constraints, Foreign Keys defined in migrations.
*   **Indexing:** Add indices (`CREATE INDEX`) via migrations. Analyze query performance locally (`EXPLAIN ANALYZE`).
*   **DB Functions/Triggers:** Define via migrations. Test with pgTAP. Justify and document `SECURITY DEFINER`.
*   **Rollback Plan:** For complex/risky migrations, document rollback steps. Create and test manual "down" migration scripts locally before applying to production.

**6. Edge Function Development Best Practices**

*   **Structure:** Use `_shared/`. Separate HTTP handling (`index.ts`) from core logic (`handler.ts`) for testability.
*   **Supabase Client:** Instantiate securely using secrets via `Deno.env.get()`. **Document any Service Role Key usage in an ADR and get it reviewed.**
*   **Security:**
    *   **JWT Verification:** Mandatory for protected functions. Securely extract `userId`.
    *   **Input Validation:** Use Zod schemas (`_shared/zodSchemas.ts` or local) to validate **ALL** external inputs (body, query params, relevant headers) rigorously.
    *   **Authorization:** Primarily rely on RLS by using `userId` in queries. Add explicit checks in function logic only if RLS is insufficient.
*   **Error Handling & Logging:**
    *   Implement consistent error handling (`try...catch`). Return standard JSON error responses + appropriate HTTP status codes.
    *   **Structured JSON Logging:** Mandatory for functions. Include context (`level`, `functionName`, `correlationId`, `userId`, `relevantIds`, `message`, `error`, `stack`).
*   **Dependencies:** Manage via `import_map.json`. Keep minimal. Run vulnerability checks (manual `deno info` checks, Snyk/tools).
*   **Configuration:** Access ALL config via `Deno.env.get()` (populated by `supabase secrets`).
*   **Idempotency:** Design critical functions (processing, payments if any) to be safely retried.
*   **Rate Limiting:** Implement for calls *to* external APIs. Consider & document (ADR) custom rate limiting for *your own* expensive/critical functions if needed.
*   **Scheduled Tasks:** Prefer `pg_cron` for database-centric scheduled tasks. Use Edge Functions (triggered externally or via cron job) for tasks requiring external interactions or complex logic unsuitable for SQL.

**7. Secrets Management (**CRITICAL**)**

*   Use `supabase secrets` exclusively for backend secrets.
*   Access via `Deno.env.get()` in functions.
*   Use `.env` (gitignored) or OS env vars for `supabase start`.
*   **NEVER COMMIT SECRETS.** Audit periodically.

**8. Testing Strategy**

*   **Database Testing (pgTAP):** Mandatory, comprehensive testing for RLS, DB functions, triggers, complex constraints. Run via `supabase test db`.
*   **Edge Function Testing:**
    *   **Unit Tests:** `deno test` for `_shared/` utils, handlers (`handler.ts`), validation logic. Mock dependencies heavily.
    *   **Integration Tests:** Use `supabase functions serve` + Deno `fetch`/libs. Test full function flow (request -> validation -> logic -> DB interaction -> response). Mock external APIs. Assert on responses and potentially DB side effects (against local test DB).
*   **Load Testing:** Plan and execute load tests (e.g., k6) against critical Edge Functions in a staging environment before launch/scaling to identify bottlenecks.

**9. Deployment (CI/CD)**

*   **Mandatory Order:** 1. Tests Pass -> 2. DB Migrations (to target env) -> 3. Function Deployments (to target env).
*   **Automation:** Use GitHub Actions + Supabase Access Token (GitHub Secret).
*   **Environments:** Use separate Supabase projects (Dev, Staging, Prod). Set secrets per environment.
*   **Migration Rollback:** Have tested rollback scripts/procedures ready, especially for production deployments of complex migrations.

**10. Logging & Monitoring**

*   **Structured Logging:** Implement JSON logging for easier parsing/analysis.
*   **Observability Tools:** Utilize Supabase Dashboard logs. Integrate Logflare/Better Stack/Sentry for production monitoring, error tracking, and log aggregation/search. Configure log drains.
*   **Alerting:** Set up alerts in monitoring tools for critical function errors, high latency (> threshold), 5xx status codes, resource limits.

**11. Documentation & Knowledge Sharing**

*   Maintain **ADRs** for backend architectural decisions (e.g., Service Role usage, PDF library choice, Caching, Rate Limiting).
*   Keep **Onboarding** and **Troubleshooting** guides updated with backend specifics.
*   Use **JSDoc/TSDoc** and code comments.
*   Conduct backend-focused design/code reviews.

**12. Data Privacy & Compliance**

*   Document PII handling. Ensure RLS/function logic enforces access controls.
*   Design with GDPR/CCPA principles in mind (data minimization, consent). Plan for handling data subject requests if applicable.

**13. Definition of Done (DoD)**

*   Enforce backend DoD: Code complete & reviewed, Unit/Integration tests pass, DB tests (pgTAP for RLS/schema) pass, Structured logging implemented, Secure (JWT verified, inputs validated), Documented (code, ADRs, guides as needed), Deployed & verified on staging (if applicable).

**14. Conclusion**

This backend development plan provides a rigorous framework for building AppraisalHub on Supabase. By prioritizing the strict migration workflow, robust security practices (RLS, input validation, secrets), comprehensive testing, structured logging, and clear documentation, the team can mitigate common risks and deliver a high-quality, scalable, and maintainable backend system.

## AppraisalHub: Frontend Development Roadmap (Updated)

This roadmap outlines the key phases and tasks specifically for building the AppraisalHub frontend application. It aligns with the overall project phases, focusing on UI/UX implementation, state management, interaction with the Supabase backend, and testing practices.

---

**Phase 1: Foundation & Setup (Corresponds to Overall Phase 0 & 1)**

**Goal:** Establish the frontend project structure, core tooling, basic layout, essential Supabase client integration, and foundational documentation.

**Tasks:**

1.  **Framework & Tooling Setup:**
    *   [ ] Initialize project using chosen framework (e.g., `create-next-app`, `vite`).
    *   [ ] Configure TypeScript (if not default).
    *   [ ] Set up linters (ESLint) and formatters (Prettier) for code consistency.
    *   [ ] Configure environment variable handling (e.g., `.env.local` with `NEXT_PUBLIC_` prefix for Next.js).
2.  **Project Structure:**
    *   [ ] Define folder structure (e.g., `components/`, `pages/` or `routes/`, `lib/` or `utils/`, `hooks/`, `styles/`, `types/`, `docs/`).
3.  **UI Library & Styling:**
    *   [ ] Integrate a UI component library (e.g., Shadcn/UI, Material UI, Chakra UI).
    *   [ ] Set up base styling/theming (Tailwind CSS configuration, global CSS, theme provider).
4.  **Supabase Client Integration:**
    *   [ ] Create the **single, canonical** Supabase client instance in `lib/supabase.ts` (or equivalent).
        *   **Crucially:** Ensure it uses *only* environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
    *   [ ] Define TypeScript types based on Supabase schema (potentially using `supabase gen types typescript`). Store these in `types/supabase.ts`.
5.  **Basic Layout:**
    *   [ ] Create main application layout component (e.g., `Layout.tsx`).
    *   [ ] Implement persistent elements: Header, Footer (if any), Main Navigation/Sidebar (structure based on `navigation-plan.md`).
6.  **Initial Documentation:**
    *   [ ] Set up project README.
    *   [ ] Create initial `docs/adr/` folder for Architectural Decision Records.
    *   [ ] Start drafting `docs/OnboardingGuide.md`.

---

**Phase 2: Authentication & Core Navigation (Corresponds to Overall Phase 2)**

**Goal:** Implement user authentication flows, basic navigation structure, and related testing. Define initial "Definition of Done".

**Tasks:**

1.  **Authentication Pages/Components:**
    *   [ ] Build Sign Up page/form.
    *   [ ] Build Sign In page/form.
    *   [ ] Build Password Reset Request page/form.
    *   [ ] Build Update Password page/form (for password reset link).
2.  **Authentication Logic:**
    *   [ ] Integrate `supabase-js` auth methods (`signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`, `updateUser`) using the canonical client.
    *   [ ] Implement state management for user session (e.g., React Context API, Zustand, Redux Toolkit).
    *   [ ] Handle loading states and display user-friendly error messages for auth operations.
3.  **Protected Routes & Session Management:**
    *   [ ] Implement logic to protect routes/pages requiring authentication.
    *   [ ] Redirect unauthenticated users attempting to access protected areas to the Sign In page.
    *   [ ] Persist user session across page loads/refreshes.
4.  **Basic User Profile:**
    *   [ ] Create a basic User Profile page (accessible when logged in).
    *   [ ] Display user information (e.g., email).
    *   [ ] Implement Sign Out functionality.
5.  **Initial Dashboard:**
    *   [ ] Create the main Dashboard page (protected route).
    *   [ ] Set up the basic structure/layout based on `navigation-plan.md`.
6.  **Testing & DoD:**
    *   [ ] Write unit/integration tests for auth components and logic.
    *   [ ] Write initial E2E tests for auth flows.
    *   [ ] Define initial team "Definition of Done" (DoD) for frontend tasks.

---

**Phase 3: Appraisal Initiation & Algorithmic Results Display (Corresponds to Overall Phase 3)**

**Goal:** Allow users to start the appraisal process and view the initial, algorithmically generated results. Introduce feature flagging concepts if needed.

**Tasks:**

1.  **New Appraisal Form:**
    *   [ ] Design and build the form component for initiating a new appraisal (e.g., inputting property address, potentially appraisal type - limited/full).
    *   [ ] Implement robust form validation (e.g., using React Hook Form, Zod).
    *   [ ] Add logic to call the backend Edge Function (via Supabase client) to start the appraisal process upon form submission.
    *   [ ] Handle loading state during submission and provide feedback (success/error).
2.  **Appraisal List/Status Display:**
    *   [ ] Create components to list the user's appraisals.
    *   [ ] Fetch appraisal data from the `appraisals` table (respecting RLS).
    *   [ ] Display the status of each appraisal (e.g., Pending, Ingesting Data, Processing, AI Analysis, Generating Report, Complete, Failed).
    *   [ ] Implement real-time updates for status changes (optional, could use Supabase Realtime).
3.  **Basic Results Display:**
    *   [ ] Create components to display the results available *before* AI processing.
    *   [ ] Show calculated valuation range.
    *   [ ] List selected comparable properties with key details.
    *   [ ] Display basic market trend summaries (if available from ingestion).
4.  **Feature Flagging (Consideration):**
    *   [ ] Evaluate if feature flags are needed for rolling out appraisal initiation or results display changes. Plan implementation if required.
5.  **Testing:**
    *   [ ] Write unit/integration tests for form, list, and results components.
    *   [ ] Write/expand E2E tests for the appraisal initiation flow.

---

**Phase 4: Displaying AI-Generated Content (Corresponds to Overall Phase 4)**

**Goal:** Integrate the display of textual content generated by the Gemini AI into the appraisal results view.

**Tasks:**

1.  **Enhance Results View:**
    *   [ ] Modify the appraisal detail/results components created in Phase 3.
    *   [ ] Fetch the completed appraisal data, now including the AI-generated fields (`market_analysis`, `property_description`, `comparables_commentary`).
    *   [ ] Add sections to cleanly display the Market Analysis text.
    *   [ ] Add sections to display the Property Description text.
    *   [ ] Add sections to display the Comparables Commentary.
2.  **Formatting & Presentation:**
    *   [ ] Ensure proper formatting of the AI text (handling line breaks, paragraphs, potential markdown).
    *   [ ] Consider visual cues or clear headings to distinguish AI-generated content from other data points.
3.  **Testing:**
    *   [ ] Update unit/integration tests for results display components to include AI fields.
    *   [ ] Update E2E tests to verify display of AI content.

---

**Phase 5: Report Interaction & UI Finalization (Corresponds to Overall Phase 5)**

**Goal:** Enable users to trigger and access generated PDF reports and complete all remaining UI elements, focusing on accessibility and polish.

**Tasks:**

1.  **Report Generation Trigger:**
    *   [ ] Add UI elements (e.g., a "Generate Report" button) to completed appraisal views.
    *   [ ] Implement logic to call the backend Edge Function responsible for report generation when the button is clicked.
    *   [ ] Handle loading states while the report is being generated.
2.  **Report Access:**
    *   [ ] Implement UI elements (e.g., a "Download Report" or "View Report" link/button) once the report is ready.
    *   [ ] Handle the download or display of the generated PDF report (linking to Supabase Storage URL or handling blob data).
3.  **Complete Remaining UI:**
    *   [ ] Build out any remaining pages or sections defined in `navigation-plan.md` (e.g., detailed dashboard views, settings pages, team management UI if applicable).
    *   [ ] Ensure all navigation links are functional and route correctly.
4.  **UI Polish & Refinement:**
    *   [ ] Conduct a thorough review of the entire UI for consistency in design, spacing, typography, and component usage.
    *   [ ] Refine micro-interactions and user feedback mechanisms.
5.  **Accessibility Focus:**
    *   [ ] Perform targeted accessibility reviews and testing (manual keyboard nav, screen readers) on all interactive components and core flows.
6.  **Testing:**
    *   [ ] Write unit/integration tests for report interaction components and remaining UI sections.
    *   [ ] Finalize core E2E test flows, including report generation/download.

---

**Phase 6: Testing, Optimization & Deployment Prep (Corresponds to Overall Phase 6)**

**Goal:** Ensure the frontend is well-tested, performant, accessible, secure, and ready for deployment.

**Tasks:**

1.  **Comprehensive Frontend Testing:**
    *   [ ] Execute full test suites (Unit, Integration, E2E). Achieve target test coverage.
    *   [ ] Perform regression testing.
2.  **Performance Optimization:**
    *   [ ] Analyze bundle size and implement code splitting.
    *   [ ] Optimize image loading and formats.
    *   [ ] Review component rendering performance (memoization, avoiding unnecessary re-renders). Use profiler.
    *   [ ] Conduct frontend load testing if specific high-traffic pages are anticipated.
3.  **Final Accessibility (a11y) Review:**
    *   [ ] Perform final accessibility audits using browser tools (Axe) and manual testing. Address any remaining issues.
4.  **Security Review:**
    *   [ ] Perform frontend dependency vulnerability scan (`npm audit`).
    *   [ ] Review handling of user input and data display to prevent XSS.
5.  **Cross-Browser/Device Testing:**
    *   [ ] Test the application on major target browsers (Chrome, Firefox, Safari, Edge).
    *   [ ] Test responsiveness on various screen sizes (desktop, tablet, mobile).
6.  **Build & Deployment Configuration:**
    *   [ ] Finalize build scripts for production.
    *   [ ] Ensure CI/CD pipeline correctly builds and deploys the frontend via Lovable sync.
    *   [ ] Update Onboarding and Troubleshooting documentation.

---

**Phase 7: Ongoing Maintenance (Corresponds to Overall Phase 7)**

**Goal:** Address post-launch issues, monitor performance, and implement iterative improvements.

**Tasks:**

*   [ ] Monitor frontend error tracking tools (if integrated, e.g., Sentry).
*   [ ] Address bugs reported by users or found through monitoring.
*   [ ] Keep frontend dependencies (NPM packages) updated regularly (using Dependabot, `npm audit`).
*   [ ] Implement minor UI/UX improvements based on user feedback and analytics.
*   [ ] Periodically review and update documentation (ADRs, Onboarding, Troubleshooting).

---

**Cross-Cutting Concerns (Applicable throughout development):**

*   **Responsiveness:** Design and implement all UI components to be responsive across devices.
*   **State Management:** Consistently apply the chosen state management strategy.
*   **Error Handling:** Implement user-friendly error display for API failures or unexpected frontend states.
*   **Loading States:** Provide clear visual feedback (spinners, skeletons) during data fetching or processing.
*   **Component Reusability:** Build modular and reusable components.
*   **Accessibility:** Continuously consider accessibility best practices during component development. Apply defined DoD.
*   **Documentation:** Maintain ADRs, Onboarding Guide, Troubleshooting Guide. Add code comments where necessary.
*   **Data Privacy:** Ensure frontend handling respects user privacy and relevant regulations (e.g., GDPR consent if applicable).

---

## AppraisalHub: Frontend Development Plan (Updated)

**Version:** 1.1
**Date:** 2024-03-04

**1. Introduction & Goals**

This document outlines the development plan for the AppraisalHub frontend application. It builds upon the established roadmap, providing detailed guidance on code structure, technology choices, best practices, and workflows.

**Primary Goals:**

*   Build a responsive, performant, accessible, and user-friendly interface based on the roadmap phases.
*   Ensure maintainability, scalability, and testability of the codebase.
*   Minimize bugs and inconsistencies through standardized practices, tooling, and a clear "Definition of Done".
*   Facilitate smooth collaboration and onboarding for developers through clear documentation.
*   Deliver a secure and reliable user experience.

**2. Core Principles**

*   **Consistency:** Apply consistent patterns for state management, API interaction, styling, component structure, logging, and error handling.
*   **Modularity:** Build reusable components and services with clear responsibilities.
*   **Clarity:** Write clear, well-documented code (comments, READMEs, ADRs). Prioritize readability.
*   **Testability:** Design code with testing in mind; strive for high test coverage for critical parts. Adhere to DoD for testing requirements.
*   **Type Safety:** Leverage TypeScript extensively to catch errors early.
*   **User Experience:** Prioritize smooth interactions, clear feedback (loading/error states), and **accessibility (a11y)**.
*   **Security:** Implement security best practices at the frontend layer (input handling, dependency management).
*   **Performance:** Optimize for fast load times and smooth interactions.

**3. Technology Stack (Confirmation)**

*   **Framework:** Next.js (or specify chosen framework: React/Vite, Vue.js)
*   **Language:** TypeScript
*   **UI Library:** Shadcn/UI (or specify: Material UI, Chakra UI, etc.)
*   **Styling:** Tailwind CSS (or specify: CSS Modules, Styled Components)
*   **State Management:** React Context API (for global state like Auth) + Zustand/Jotai (for complex local/shared state) or built-in framework state + component state. *Decision to be finalized based on complexity & documented in an ADR.*
*   **Data Fetching/Caching:** SWR or React Query (TanStack Query) recommended. *Decision documented in an ADR.*
*   **Forms:** React Hook Form + Zod (for schema validation).
*   **Testing:** Vitest/Jest (Unit/Integration) + React Testing Library + Cypress/Playwright (E2E).
*   **Linting/Formatting:** ESLint + Prettier.
*   **Feature Flagging:** (Optional) Consider a library/service if complex rollouts are needed (e.g., LaunchDarkly, custom solution). *Decision documented in an ADR if implemented.*

**4. Code Structure & Organization**

```
appraisalhub-frontend/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router specific
│   │   # ... (Routes as before) ...
│   ├── components/           # Reusable UI components
│   │   # ... (Structure as before) ...
│   ├── lib/                  # Core libraries, utilities
│   │   ├── supabase.ts       # **SINGLE canonical Supabase client instance**
│   │   ├── utils.ts          # General utility functions
│   │   └── zodSchemas.ts     # Zod validation schemas
│   ├── services/             # API interaction layer
│   │   # ... (Structure as before) ...
│   ├── hooks/                # Custom React hooks
│   │   # ... (Structure as before) ...
│   ├── contexts/             # React Context providers
│   │   # ... (Structure as before) ...
│   ├── styles/               # Global styles, theme
│   ├── types/                # TypeScript type definitions
│   │   ├── index.ts          # General application types
│   │   └── supabase.ts       # Auto-generated Supabase types
│   └── constants/            # Application-wide constants
├── tests/                  # Test files (alternative: co-locate with components)
│   ├── integration/
│   ├── unit/
│   └── e2e/                  # Cypress/Playwright tests
├── docs/                   # Project Documentation
│   ├── adr/                # Architectural Decision Records (Markdown files)
│   ├── OnboardingGuide.md
│   └── TroubleshootingGuide.md
├── .env.local              # Local environment variables (ignored by Git)
# ... (Other config files as before: eslint, prettier, tsconfig, etc.) ...
└── README.md
```

**5. Development Best Practices & Guidelines**

*   **Definition of Done (DoD):** Strictly adhere to the team-defined DoD for all tasks (e.g., includes code complete, tests passing, documentation updated, accessibility checked, reviewed).
*   **5.1. Supabase Client Usage (**CRITICAL**):** (As before - Single Source, Env Vars Only, Import)
*   **5.2. Component Design:** (As before - Reusability, Props, Single Responsibility, Composition, Controlled Components + **Accessibility built-in**)
*   **5.3. State Management:** (As before - Global vs Server vs Local vs Shared. *Decisions documented via ADRs*)
*   **5.4. API Interaction (`services/` layer):** (As before - Centralization, Abstraction, Error Handling, Typing)
*   **5.5. Styling:** (As before - Utility-First, Component Classes, Theme Config, Avoid Inline)
*   **5.6. TypeScript Usage:** (As before - Strict Mode, Explicit Types, Generated Types, Avoid `any`)
*   **5.7. Error Handling & Logging:**
    *   (As before - User Feedback, Catching Errors, Error Boundaries)
    *   **Structured Logging (Frontend):** Use `console.info`, `console.warn`, `console.error` consistently. Consider adding context (component name, user state) where helpful for debugging. Integrate with Sentry (or similar) for production error tracking, ensuring PII is scrubbed if necessary.
*   **5.8. Testing Strategy:**
    *   (As before - Unit, Integration, E2E)
    *   **Accessibility Testing:** Integrate automated accessibility checks (e.g., `jest-axe`) into unit/integration tests for components. Perform manual checks as part of DoD.
    *   **Test Data:** Define clear strategies for mocking data and services.
*   **5.9. Code Quality & Consistency:** (As before - Linting/Formatting, Naming, Comments + **ADRs for key decisions**)
*   **5.10. Version Control (Git):** (As before - Branching, Commits, PRs + **Require passing CI checks before merge**)
*   **5.11. Environment Management:** (As before - `.env.local`, Production Vars, No Secrets)
*   **5.12. Accessibility (a11y):** (As before - Semantic HTML, ARIA, Keyboard Nav, Color Contrast + **Mandatory part of DoD**)
*   **5.13. Performance:**
    *   (As before - Code Splitting, Image Opt, Memoization, Bundle Analysis)
    *   **Load Testing:** Plan for frontend load testing (using tools like k6 against critical pages/interactions) if high concurrency is expected.
*   **5.14. Input Validation:** Use Zod schemas (defined in `lib/zodSchemas.ts`) rigorously with React Hook Form for all user inputs. Validate data formats, lengths, ranges.
*   **5.15. Dependency Management:** Regularly run `npm audit` (or equivalent). Use Dependabot or Snyk for automated vulnerability scanning and update notifications. Review updates before merging.
*   **5.16. Feature Flagging:** If implementing, use flags consistently. Ensure proper cleanup of flags for retired features. Document flag usage.
*   **5.17. Data Privacy:** Be mindful of GDPR/CCPA. Avoid storing unnecessary PII in frontend state or logs. Implement consent mechanisms if required.

**6. Phase-Specific Focus**

*   **Phase 1-2 (Foundation, Auth):** Focus on structure, tooling, client integration, auth flow, testing foundations, initial documentation (README, Onboarding, ADRs), defining DoD.
*   **Phase 3 (Ingestion UI, Algo Results):** Implement API service layer, robust form handling (RHF+Zod), data display (SWR/RQ). Consider feature flags.
*   **Phase 4 (AI Content):** Integrate display cleanly. Update tests.
*   **Phase 5 (Reports, Finalization):** Implement report interaction. Focus heavily on UI polish and **Accessibility**. Complete documentation.
*   **Phase 6 (Testing, Optimization):** Execute comprehensive testing (including Load Testing if planned), final performance tuning, security/dependency audits, accessibility checks. Finalize documentation.

**7. Documentation & Knowledge Sharing**

*   **README:** Keep updated with setup, running, testing instructions.
*   **ADRs:** Document significant architectural choices and their rationale.
*   **Onboarding Guide:** Maintain a guide for new developers.
*   **Troubleshooting Guide:** Document common issues and fixes encountered during development.
*   **Code Comments:** Explain the "why" behind complex or non-obvious code. Use JSDoc/TSDoc for functions/hooks.
*   **Regular Reviews:** Conduct occasional architecture/code deep dives beyond standard PR reviews.

**8. Conclusion**

This enhanced plan provides a detailed framework emphasizing preventative measures, consistency, and documentation alongside core feature development. Adherence to these practices is key to building a high-quality, maintainable, secure, and accessible frontend for AppraisalHub.

---

## AppraisalHub: Backend Development Roadmap (Updated)

This roadmap outlines the key phases and tasks for building the AppraisalHub backend, primarily leveraging Supabase features including the database, authentication, storage, Edge Functions, and focusing on robust development practices.

---

**Phase 1: Foundation & Core Schema (Corresponds to Overall Phase 0 & 1)**

**Goal:** Establish the Supabase project, define the initial core database structure via migrations, set up basic authentication/RLS, configure local development, and start foundational documentation.

**Tasks:**

1.  **Supabase Project Setup:**
    *   [ ] Initialize Supabase project locally (`supabase init`).
    *   [ ] Link project to remote Supabase instance (`supabase link`).
    *   [ ] Start local development environment (`supabase start`).
2.  **Database Schema - Core Tables (Migration-Driven):**
    *   [ ] Define initial schema SQL (`profiles`, `teams`, `team_members`, `appraisals`, `integrations`).
    *   [ ] Generate initial migration file(s) using `supabase db diff`. **Strictly adhere to the migration workflow.**
    *   [ ] Apply migrations locally and **test using `supabase db reset`**.
3.  **Authentication & Authorization Setup:**
    *   [ ] Configure Supabase Auth settings.
    *   [ ] Implement basic Row Level Security (RLS) policies via migrations. Ensure RLS migrations are timestamped *after* table creation migrations.
    *   [ ] Test RLS policies locally (using pgTAP).
4.  **Basic Triggers/Functions (Optional):**
    *   [ ] Implement DB trigger/function for profile creation (via migration). Test it.
5.  **Secrets Management:**
    *   [ ] Set up initial Supabase secrets (`supabase secrets set`).
6.  **Initial Documentation:**
    *   [ ] Set up project README (backend section).
    *   [ ] Create initial `docs/adr/` folder (can be shared with frontend if mono-repo).
    *   [ ] Start drafting backend sections of `docs/OnboardingGuide.md` and `docs/TroubleshootingGuide.md`.

---

**Phase 2: Authentication Refinement & API Foundation (Corresponds to Overall Phase 2)**

**Goal:** Solidify authentication flows, refine RLS, establish Edge Function structure, and define initial "Definition of Done".

**Tasks:**

1.  **RLS Policy Review & Testing:**
    *   [ ] Review and write comprehensive pgTAP tests for initial RLS policies.
2.  **Edge Function Setup & Structure:**
    *   [ ] Initialize Supabase Edge Functions. Define shared structure (`_shared/`).
    *   [ ] Create initial helper functions/test functions. Verify deployment (`supabase functions deploy`).
3.  **User Profile Management API:**
    *   [ ] Create Edge Function(s) for profile updates (`update-profile`).
    *   [ ] Implement JWT verification and user ID extraction within the function.
    *   [ ] Implement basic input validation.
    *   [ ] Test function locally (`supabase functions serve`) and write integration tests.
4.  **Testing & DoD:**
    *   [ ] Set up Deno test runner.
    *   [ ] Define initial team "Definition of Done" (DoD) for backend tasks (incl. code, tests, RLS verification, docs).

---

**Phase 3: Data Ingestion & Core Algorithmic Processing (Corresponds to Overall Phase 3)**

**Goal:** Integrate external data APIs securely, implement core non-AI appraisal logic, orchestrate processing, and consider feature flags.

**Tasks:**

1.  **External API Integration:**
    *   [ ] Develop Edge Functions (`ingest-*`) to fetch data, accessing keys via `Deno.env.get()`.
    *   [ ] Implement robust error handling, logging (structured JSON), and retry logic.
    *   [ ] Implement data transformation logic with unit tests.
    *   [ ] Consider implementing rate limiting for calls *to* external APIs.
2.  **Appraisal Table Expansion (Migration-Driven):**
    *   [ ] Update `appraisals` schema via migrations. Run `db reset`.
3.  **Core Algorithmic Logic:**
    *   [ ] Implement algorithms within helper modules/orchestration function. Unit test the logic thoroughly.
4.  **Orchestration Edge Function (`process-appraisal`):**
    *   [ ] Create/refine the main function. Implement workflow steps, status updates.
    *   [ ] Ensure robust error handling and structured logging throughout the flow.
    *   [ ] Design for idempotency where possible.
    *   [ ] Implement rigorous input validation (using Zod).
5.  **RLS Refinement:**
    *   [ ] Update RLS policies for `appraisals` via migrations. Test with pgTAP.
6.  **Feature Flagging (Consideration):**
    *   [ ] Evaluate if feature flags are needed for new ingestion sources or major algorithm changes. Plan implementation.
7.  **Testing:** Write unit and integration tests for ingestion functions, algorithms, and the orchestration function.

---

**Phase 4: AI Integration (Gemini) (Corresponds to Overall Phase 4)**

**Goal:** Integrate Google Gemini AI securely and reliably into the appraisal workflow.

**Tasks:**

1.  **Gemini Credentials Setup & Security:**
    *   [ ] Complete Google Cloud setup. Securely store Service Account JSON content via `supabase secrets set`.
2.  **Vertex AI Client Integration:**
    *   [ ] Add dependency, update `import_map.json`.
    *   [ ] Implement client initialization using stored credentials.
3.  **Prompt Engineering Logic:**
    *   [ ] Develop logic to construct prompts dynamically. Unit test this logic.
    *   [ ] Include tailoring for 'limited' vs. 'full' types.
4.  **Gemini API Call & Error Handling:**
    *   [ ] Implement async call with robust error handling specific to AI APIs (quotas, content filters, timeouts). Use structured logging.
5.  **Response Parsing & Storage (Migration-Driven):**
    *   [ ] Implement response parsing logic (unit test).
    *   [ ] Update `appraisals` schema via migration. Run `db reset`.
    *   [ ] Store parsed results reliably.
6.  **Workflow Integration:**
    *   [ ] Integrate AI step into the `process-appraisal` workflow. Update status flags.
7.  **Testing:** Update integration tests for the orchestration function, mocking the AI API call. Consider limited staging tests.

---

**Phase 5: Report Generation (Corresponds to Overall Phase 5)**

**Goal:** Implement automated, reliable PDF report generation and storage.

**Tasks:**

1.  **Report Generation Strategy & Setup:**
    *   [ ] Choose and configure PDF library, considering Edge Function limits. Document choice in ADR.
2.  **Report Template Design.**
3.  **Report Generation Edge Function (`generate-report`):**
    *   [ ] Create function with JWT verification.
    *   [ ] Implement logic: fetch data, populate template, generate PDF.
    *   [ ] Implement robust error handling and structured logging.
4.  **Report Storage/Delivery:**
    *   [ ] Implement secure upload to Supabase Storage using appropriate policies.
    *   [ ] Return storage path/signed URL.
5.  **DB Updates (Migration-Driven):**
    *   [ ] Update `appraisals` schema for report status/path via migration. Run `db reset`.
6.  **Testing:** Write integration tests for the report generation function (mocking DB fetch, testing PDF generation/storage interaction).

---

**Phase 6: Testing, Optimization, Deployment Prep (Corresponds to Overall Phase 6)**

**Goal:** Ensure backend stability, performance, security, and prepare for production deployment with robust procedures.

**Tasks:**

1.  **Comprehensive Backend Testing:**
    *   [ ] Execute full test suites (Unit, Integration, DB/pgTAP). Achieve target coverage. Perform regression testing.
2.  **Performance Optimization:**
    *   [ ] Analyze and optimize database queries (`EXPLAIN ANALYZE`), add indices via migrations.
    *   [ ] Monitor/optimize Edge Function performance (duration, memory). Consider backend caching strategies if needed.
    *   [ ] Plan and potentially execute backend load testing for critical functions.
3.  **Security Hardening:**
    *   [ ] Conduct thorough review of ALL RLS policies (manual testing + pgTAP).
    *   [ ] Review Edge Function security (JWT verification, input validation rigor - Zod).
    *   [ ] Run dependency vulnerability scans (check Deno equivalents or Snyk).
    *   [ ] Reiterate caution and review any `SERVICE_ROLE_KEY` usage.
4.  **Production Configuration:**
    *   [ ] Set up production Supabase project (backups, settings).
    *   [ ] Set ALL production secrets securely.
5.  **CI/CD Pipeline Finalization:**
    *   [ ] Ensure pipeline runs all tests.
    *   [ ] Implement deployment steps in correct order (DB Migrations FIRST, then Functions). Use Supabase Access Token securely.
    *   [ ] Define and test Migration Rollback Strategy/Scripts for complex migrations.
6.  **Logging & Monitoring Setup:**
    *   [ ] Configure production logging (structured JSON). Set up Supabase log drains or integrations (Logflare, etc.) if needed.
    *   [ ] Set up monitoring and basic alerting for function errors / high duration.
7.  **Documentation Finalization:** Update README, Onboarding, Troubleshooting guides. Finalize relevant ADRs.

---

**Phase 7: Ongoing Maintenance & Operations (Corresponds to Overall Phase 7)**

**Goal:** Monitor the backend system, manage costs, perform routine maintenance, and handle incidents effectively.

**Tasks:**

*   [ ] Monitor Supabase resources, external API costs, function performance, error rates.
*   [ ] Regularly review structured logs and monitoring alerts.
*   [ ] Manage database backups and perform periodic restore tests.
*   [ ] Keep Supabase CLI and function dependencies updated (run audits). Test updates thoroughly.
*   [ ] Periodically review/update RLS policies, security configurations, and dependency vulnerabilities.
*   [ ] Implement backend improvements based on feedback or monitoring.
*   [ ] Utilize `pg_cron` for suitable scheduled tasks.
*   [ ] Refine Incident Response Plan.
*   [ ] Periodically review documentation for accuracy.

---

**Cross-Cutting Concerns (Applicable throughout development):**

*   **Migrations:** Strictly adhere to the `db diff` -> `db reset` local workflow. Keep migrations atomic. Define rollback plans for complex changes.
*   **Error Handling:** Implement consistent, structured error handling and logging (JSON) in all Edge Functions.
*   **Security:** Continuously evaluate RLS, function security, input validation (Zod), secrets management. Document `SERVICE_ROLE_KEY` usage meticulously.
*   **Modularity:** Structure Edge Function logic cleanly. Use `_shared/` for reusable code.
*   **Documentation:** Maintain ADRs, Onboarding, Troubleshooting guides. Use JSDoc/TSDoc.
*   **Data Privacy:** Design and implement respecting GDPR/CCPA principles (data minimization, access/deletion requests if applicable).
*   **Idempotency:** Design critical functions to be idempotent where feasible.
*   **Rate Limiting:** Implement for calls *to* external APIs. Consider for expensive *internal* Edge Functions if needed.

---

## AppraisalHub: Backend Development Plan (Updated)

**Version:** 1.1
**Date:** 2024-03-04

**1. Introduction & Goals**

This document details the development plan for the AppraisalHub backend on Supabase, expanding on the roadmap with specific guidance on structure, practices, and risk mitigation.

**Primary Goals:**

*   Implement robust backend functionality (Ingestion, Processing, AI, Reports).
*   Ensure security via RLS and secure function design. Guarantee data integrity.
*   Maximize maintainability and scalability using Supabase best practices and clear documentation.
*   Minimize bugs through rigorous migration workflows, comprehensive testing (including RLS), and a clear "Definition of Done".
*   Provide reliable, performant, and secure APIs.

**2. Core Principles**

*   **Local-First Development:** Develop/test primarily against local Supabase.
*   **Migration-Driven Schema:** Use `supabase db diff` -> `supabase db reset` workflow exclusively for schema changes.
*   **Least Privilege:** Default to Anon Key; use Service Role Key only when absolutely necessary and documented. RLS is paramount.
*   **Stateless & Idempotent Functions:** Design functions accordingly where feasible.
*   **Clear Boundaries:** Separate concerns within functions (validation, data access, logic, external calls).
*   **Robust Error Handling & Structured Logging:** Implement comprehensive, consistent error handling and informative JSON logging.
*   **Security by Design:** Integrate security checks (RLS, JWT, input validation) throughout development.
*   **Testability:** Design for testability (DB via pgTAP, Functions via Deno test).

**3. Technology Stack (Confirmation)**

*   **Platform:** Supabase (PostgreSQL, Auth, Edge Functions/Deno, Storage)
*   **Language:** TypeScript
*   **Key Libraries (Edge Functions):** `@supabase/supabase-js`, `@google-cloud/vertexai`, PDF Library (TBD), Zod (for input validation).
*   **Database Testing:** pgTAP.

**4. Supabase Project Structure (Local)**

```
appraisalhub-backend/ (or within mono-repo)
├── supabase/
│   ├── config.toml
│   ├── migrations/         # **AUTHORITATIVE SCHEMA HISTORY**
│   │   └── ...YYYYMMDDHHMMSS_name.sql
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── supabaseClient.ts # (Optional) Helper
│   │   │   ├── types.ts
│   │   │   ├── utils.ts
│   │   │   └── zodSchemas.ts   # Shared validation schemas
│   │   ├── <function_name>/
│   │   │   └── index.ts      # Entry point
│   │   │   └── handler.ts    # (Optional) Core logic handler
│   │   │   └── types.ts      # Function-specific types
│   ├── schema.sql            # Reference for db diff
│   ├── seed.sql              # Local seed data
│   └── tests/
│       └── db/               # pgTAP tests (RLS, functions, triggers)
│           └── test_rls_appraisals.sql # Example
├── .env                    # Local secrets for `supabase start` (gitignored)
├── .gitignore
├── import_map.json         # Deno import map
├── docs/                   # Shared documentation (if mono-repo)
│   ├── adr/
│   ├── OnboardingGuide.md
│   └── TroubleshootingGuide.md
└── README.md
```

**5. Database Design & Migration Workflow (**CRITICAL**)**

*   **Workflow Adherence:** Mandate the `Make Change Locally` -> `supabase db diff` -> `Review SQL` -> `supabase db reset` -> `Commit` workflow. **No direct edits to applied migration files.**
*   **RLS:** Define in migrations *after* table creation. Test rigorously with pgTAP, covering different roles and operations.
*   **Data Types:** Use appropriate types (incl. `JSONB` judiciously).
*   **Indexing:** Add indices via migrations based on query analysis (`EXPLAIN ANALYZE` locally).
*   **DB Functions/Triggers:** Define in migrations. Test with pgTAP. Use `SECURITY DEFINER` cautiously and document rationale.
*   **Rollback Plan:** For complex migrations, document the rollback steps and potentially create corresponding "down" migration files (manual reversal script) and test them locally.

**6. Edge Function Development Best Practices**

*   **Structure:** Use `_shared/` for common code. Consider separating core logic (`handler.ts`) from the HTTP request/response handling (`index.ts`) for better testing.
*   **Supabase Client:** Instantiate using secrets via `Deno.env.get()`. Document Service Role Key usage via ADR if chosen.
*   **Security:**
    *   **JWT Verification:** Mandatory for protected functions. Extract `userId` reliably.
    *   **Input Validation:** Use Zod schemas (defined in `_shared/zodSchemas.ts` or function-specific) to validate *all* request inputs (body, query params, headers if relevant).
    *   **Authorization:** Use the extracted `userId` in database queries (`.eq('user_id', userId)`) to implicitly leverage RLS. Perform explicit checks if RLS isn't sufficient.
*   **Error Handling & Logging:**
    *   Wrap I/O and external calls in `try...catch`.
    *   Implement a standard error response format (JSON).
    *   **Structured Logging:** Log errors and key events as JSON objects (e.g., `{ "level": "error", "function": "process-appraisal", "correlationId": "...", "userId": "...", "appraisalId": "...", "message": "Failed to call Gemini API", "error": err.message, "stack": err.stack }`).
*   **Dependencies:** Manage via `import_map.json`. Keep minimal. Audit regularly (`deno info --json <url>` can show dependencies, check for known vulnerabilities manually or via tools).
*   **Configuration:** Access *all* config/secrets via `Deno.env.get()`.
*   **Idempotency:** Design critical functions (e.g., `process-appraisal`) to be safely retried if possible.
*   **Rate Limiting:** Implement if needed for calls *to* external APIs. Consider custom logic for protecting *your own* expensive functions if abuse is a concern (document via ADR).
*   **Scheduled Tasks:** Consider `pg_cron` for simple, database-centric scheduled tasks before defaulting to scheduled Edge Functions.

**7. Secrets Management (**CRITICAL**)**

*   **`supabase secrets` Only:** Use for all backend secrets (Supabase keys, API keys, SA keys).
*   **Access:** `Deno.env.get()` in functions.
*   **Local:** Use `.env` file (gitignored) or OS env vars for `supabase start`.
*   **NEVER COMMIT SECRETS.**

**8. Testing Strategy**

*   **Database Testing (pgTAP):** Comprehensive tests for RLS (critical!), functions, triggers, schema constraints. Run via `supabase test db`.
*   **Edge Function Testing:**
    *   **Unit Tests:** Use `deno test` for shared utils, validation logic, pure business logic. Mock dependencies.
    *   **Integration Tests:** Use `supabase functions serve` + Deno `fetch` (or testing libs) to test full function execution, mocking external APIs where necessary, potentially asserting on DB state changes (against local test DB).
*   **Load Testing:** Plan and execute load tests (e.g., k6) against critical Edge Functions before launch or major changes to identify performance bottlenecks under load.

**9. Deployment (CI/CD)**

*   **Order:** 1. Tests Pass -> 2. DB Migrations -> 3. Function Deployments.
*   **Automation:** Use GitHub Actions with Supabase Access Token (stored as GitHub Secret).
*   **Environments:** Use separate Supabase projects for Dev, Staging (optional), Production. Set secrets per environment.
*   **Migration Rollback:** Have tested rollback scripts/procedures ready for complex production migrations.

**10. Logging & Monitoring**

*   **Structured Logging:** Implement JSON logging in functions for easier parsing.
*   **Supabase Tools:** Utilize Dashboard logs and basic monitoring.
*   **External Integrations:** Set up Logflare/Better Stack/Sentry for enhanced observability, error tracking, and alerting in production. Configure log drains.
*   **Alerting:** Configure alerts for critical function errors, high latency, or resource exhaustion.

**11. Documentation & Knowledge Sharing**

*   Maintain **ADRs** for key backend decisions (library choices, service role usage, caching strategies, rate limiting implementation).
*   Keep **Onboarding** and **Troubleshooting** guides updated.
*   Use **JSDoc/TSDoc** and code comments effectively.

**12. Data Privacy & Compliance**

*   Identify and document PII handling.
*   Ensure RLS and function logic comply with data access principles.
*   Plan for handling data subject requests (access/deletion) if applicable under GDPR/CCPA.

**13. Conclusion**

This plan provides a robust framework for backend development on Supabase, emphasizing preventative measures against common issues. Strict adherence to migration workflows, security practices, structured logging, comprehensive testing (especially RLS), and clear documentation is essential for building a reliable and maintainable backend for AppraisalHub.

---

## AppraisalHub: Testing Roadmap (Updated)

This roadmap outlines the comprehensive testing strategy for AppraisalHub, covering all layers of the application (Frontend, Backend Database & Functions) across the development lifecycle, emphasizing quality gates and risk mitigation.

---

**Phase 1: Foundation & Setup (Corresponds to Overall Phase 0 & 1)**

**Goal:** Establish foundational testing infrastructure, write initial tests for core setup, and define quality standards.

**Focus Areas:** Project setup, basic DB schema, initial RLS, core utilities, tooling configuration.

**Testing Activities:**

1.  **Tooling Setup & Config:**
    *   [ ] **Frontend:** Configure Vitest/Jest + RTL, test environment.
    *   [ ] **Backend:** Configure Deno test runner, pgTAP (`supabase test db`).
    *   [ ] **E2E:** Set up Cypress/Playwright framework.
    *   [ ] **CI/CD:** Configure pipeline steps for linters, formatters, and initial test runners.
2.  **Unit Testing:**
    *   [ ] **FE/BE:** Test core utility functions.
3.  **Database Testing (pgTAP):**
    *   [ ] Verify core table existence.
    *   [ ] Write initial RLS tests (e.g., `profiles` access). Test profile creation trigger.
4.  **Infrastructure Testing:**
    *   [ ] Verify `supabase start` stability. Verify basic function deployment.
5.  **Define "Definition of Done" (DoD):** Establish clear criteria for task completion, including specific testing requirements (e.g., unit tests pass, integration tests cover X, accessibility checked, RLS tested).

---

**Phase 2: Authentication & Core Navigation (Corresponds to Overall Phase 2)**

**Goal:** Ensure the authentication system is secure and functional end-to-end.

**Focus Areas:** Auth flows (UI & Backend), protected routes, user profile API, related RLS.

**Testing Activities:**

1.  **Unit Testing:**
    *   [ ] **FE:** Auth forms (validation), auth hooks/state logic.
    *   [ ] **BE:** Helpers within auth Edge Functions.
2.  **Integration Testing:**
    *   [ ] **FE:** Auth forms <-> state <-> mocked services. Protected route logic.
    *   [ ] **BE/API:** Profile management Edge Function (local serve + fetch/test lib).
3.  **Database Testing (pgTAP):**
    *   [ ] Comprehensive RLS tests for `profiles`, `teams` (if applicable) based on auth state.
4.  **End-to-End (E2E) Testing:**
    *   [ ] Write core auth flow tests (Signup, Sign In, Sign Out, Protected Route Access/Redirect).
5.  **CI/CD:** Add Unit and Integration test execution steps to CI pipeline. Ensure they gate merging.

---

**Phase 3: Data Ingestion & Core Processing (Algorithmic) (Corresponds to Overall Phase 3)**

**Goal:** Verify external data integration, algorithmic logic, and the initial appraisal workflow, including error handling.

**Focus Areas:** External API fetching/mocking, data transformation, algorithms, orchestration function, DB schema/RLS, frontend form/display.

**Testing Activities:**

1.  **Unit Testing:**
    *   [ ] **BE:** Data transformations, core algorithmic logic functions.
    *   [ ] **FE:** Appraisal form component (validation), results display components.
2.  **Integration Testing:**
    *   [ ] **BE/API:** Ingestion functions (mocking external APIs), orchestration function (`process-appraisal` mocking ingestion steps, testing algo + DB updates). Verify error handling paths.
    *   [ ] **FE:** Appraisal form <-> state <-> backend service call. Status/results display (mocking backend).
3.  **Database Testing (pgTAP):**
    *   [ ] Test RLS on expanded `appraisals` table (status/user based access). Verify constraints.
4.  **E2E Testing:**
    *   [ ] Test full appraisal initiation flow -> status updates -> view basic results.
5.  **Test Data Management:** Define strategy for generating/mocking realistic appraisal input data. Use `seed.sql` for local setup.

---

**Phase 4: AI Integration Testing (Corresponds to Overall Phase 4)**

**Goal:** Validate the secure and reliable integration of Gemini AI.

**Focus Areas:** Gemini API mocking, prompt generation logic, AI response parsing, updated orchestration flow, frontend display.

**Testing Activities:**

1.  **Unit Testing:**
    *   [ ] **BE:** Prompt generation logic, AI response parsing logic.
2.  **Integration Testing:**
    *   [ ] **BE/API:** Test AI step in orchestration function, mocking the Vertex AI/Gemini API call rigorously. Verify correct data passed to mock and response handling.
    *   [ ] **FE:** Update results display component tests for AI fields.
3.  **Database Testing (pgTAP):**
    *   [ ] Verify new schema columns. Update RLS tests if logic changes.
4.  **E2E Testing:**
    *   [ ] Update appraisal results view test to verify display of AI sections.
5.  **(Optional) Staging Environment Testing:** Perform limited tests against a non-production AI endpoint if available.

---

**Phase 5: Report Generation & Frontend Completion (Corresponds to Overall Phase 5)**

**Goal:** Verify report generation, storage, access, and finalize UI testing including accessibility.

**Focus Areas:** Report generation function, PDF output validation (structural), storage interaction, final UI elements, accessibility.

**Testing Activities:**

1.  **Unit Testing:**
    *   [ ] **BE:** Report generation helper logic.
    *   [ ] **FE:** Remaining UI components (settings, etc.). Integrate `jest-axe` for automated a11y checks in component tests.
2.  **Integration Testing:**
    *   [ ] **BE/API:** Test `generate-report` function (mocking DB fetch, testing PDF lib + Storage interaction).
    *   [ ] **FE:** Test report trigger/download UI interaction (mocking backend).
3.  **Database Testing (pgTAP):**
    *   [ ] Test schema/RLS for report status/path columns.
4.  **E2E Testing:**
    *   [ ] Finalize core E2E flow (Signup -> Create -> View Full -> Generate -> Download). Add tests for other key UI areas.
5.  **Manual Accessibility Testing:** Perform thorough checks (keyboard, screen reader) on core workflows as part of DoD.

---

**Phase 6: Comprehensive Testing & Pre-Deployment (Corresponds to Overall Phase 6)**

**Goal:** Perform exhaustive end-to-end validation, non-functional testing (security, performance, load), and user acceptance testing.

**Focus Areas:** Stability, performance under load, security posture, usability, accessibility compliance, cross-browser checks.

**Testing Activities:**

1.  **Regression Testing:** Execute *all* automated test suites (Unit, Int, E2E, DB) in CI pipeline. Ensure high pass rates.
2.  **End-to-End (E2E) Testing:** Execute full suite across different scenarios/roles. Add edge case tests.
3.  **Security Testing:**
    *   **RLS Deep Dive:** Rigorous manual review and testing (attempt unauthorized access). Use pgTAP for automated checks.
    *   **Function Security Review:** Manual review of JWT verification, input validation (Zod strictness), Service Role usage justification.
    *   **Dependency Vulnerability Scan:** Run `npm audit` / Deno checks / Snyk.
4.  **Performance & Load Testing:**
    *   [ ] **FE:** Lighthouse scores, bundle analysis, manual interaction profiling.
    *   [ ] **BE:** Execute planned load tests (k6, etc.) against critical Edge Functions in a staging environment. Analyze DB query performance (`EXPLAIN ANALYZE`) under load.
5.  **Usability Testing (UAT):** Conduct sessions with target users. Collect and categorize feedback.
6.  **Final Accessibility Testing:** Final automated (Axe) and manual (keyboard, screen reader) checks against WCAG criteria.
7.  **Cross-Browser/Device Testing:** Execute core E2E flows or manual checks on target platforms.
8.  **Deployment Testing:** Test deployment process to staging. Perform post-deployment smoke tests. Test migration rollback procedures if defined.

---

**Phase 7: Ongoing Maintenance (Corresponds to Overall Phase 7)**

**Goal:** Maintain test suite health, ensure continued quality, and use tests to validate fixes and new features.

**Testing Activities:**

1.  **CI/CD Monitoring:** Ensure tests run reliably and gate deployments.
2.  **Regression Testing:** Run full suite before every production deployment.
3.  **Test Maintenance:** Keep tests updated as code evolves. Refactor flaky tests.
4.  **New Feature Testing:** Apply full testing pyramid (Unit, Int, E2E, DB) to new features according to DoD.
5.  **Bug Fix Testing:** Write tests reproducing bugs *before* fixing, ensuring the fix works and prevents recurrence.
6.  **Monitoring Feedback:** Use production monitoring/error data to identify areas needing improved test coverage.

---

**Cross-Cutting Concerns:**

*   **Test Data Management:** Use `supabase/seed.sql` for local dev. Implement strategies for generating/managing realistic data for E2E and staging environments. Avoid using production data for testing.
*   **Test Environment:** Maintain isolated environments. Ensure CI environment can run all test types.
*   **Test Coverage:** Monitor coverage but prioritize testing critical paths and complex logic over raw percentage.
*   **Documentation:** Document complex test setups, E2E scenarios, and test data requirements.

---

## AppraisalHub: Deployment & Operations Roadmap (Updated)

**Hosting Context:** Frontend hosted by **Lovable** (via GitHub sync on `main` branch). Backend managed via **Supabase**.

---

**Phase 1: Foundation & Environment Setup (Corresponds to Overall Phase 0 & 1)**

**Goal:** Establish Git, Supabase projects, environment configurations, and initial documentation for Ops.

**Tasks:**

1.  **Version Control (GitHub):**
    *   [ ] Set up repo, define branching strategy (`main` = Lovable production). Configure `.gitignore`.
2.  **Supabase Project Setup (Remote):**
    *   [ ] Create separate **development/staging** and **production** Supabase projects. Link local CLI to dev.
3.  **Initial Environment Configuration:**
    *   [ ] Document required FE/BE environment variables.
    *   [ ] Set up local `.env*` files (gitignored).
4.  **Initial Ops Documentation:**
    *   [ ] Start sections in README/Docs covering deployment prerequisites and environment setup.
    *   [ ] Create `docs/adr/` for Ops-related decisions.

---

**Phase 2-3: CI Foundations & Secrets Management (Corresponds to Overall Phase 2-3)**

**Goal:** Implement basic CI checks, secure secret management, and establish initial branch protection.

**Tasks:**

1.  **Basic CI Pipeline (GitHub Actions):**
    *   [ ] Workflow on PRs to `main`: Checkout, Setup Env, Install Deps, Lint, Format Check.
    *   [ ] Configure `main` branch protection rules (require CI checks).
2.  **Secrets Management (Supabase):**
    *   [ ] Use `supabase secrets set` for ALL backend secrets in the *development* Supabase project. Document required secrets.

---

**Phase 4-5: CI Enhancements, Staging & Feature Flags Prep (Corresponds to Overall Phase 4-5)**

**Goal:** Integrate comprehensive testing into CI, prepare staging environment, and plan for feature flags.

**Tasks:**

1.  **Enhanced CI Pipeline (GitHub Actions):**
    *   [ ] Add jobs: Backend tests (`deno test`, `supabase test db`), Frontend tests (`npm test`). Ensure tests gate merges.
2.  **Staging Environment Setup (Recommended):**
    *   [ ] Configure "staging" Supabase project (mirror prod).
    *   [ ] Plan Lovable staging deployment strategy (e.g., `staging` branch sync).
    *   [ ] Set up staging secrets in staging Supabase project.
    *   [ ] (Optional) Configure CI job to deploy to staging on merge to `staging` branch.
3.  **Supabase Storage Configuration:**
    *   [ ] Create buckets via migration/dashboard. Define Storage RLS policies (via migration).
4.  **Feature Flagging Strategy:**
    *   [ ] Decide on feature flagging approach (library/custom). Document in ADR. Plan initial flag setup if needed for upcoming features.

---

**Phase 6: Production Deployment & Initial Operations (Corresponds to Overall Phase 6)**

**Goal:** Execute first production deployment, establish monitoring/logging, define incident response, and finalize Ops documentation.

**Tasks:**

1.  **Production Supabase Setup:**
    *   [ ] Ensure separate **production** project exists. Configure Backups, Custom Domain, SMTP.
    *   [ ] **CRITICAL:** Set ALL production secrets securely (`supabase secrets set`). Verify completeness.
2.  **Lovable Production Setup:**
    *   [ ] Configure Lovable app, link to GitHub `main` branch.
    *   [ ] **CRITICAL:** Set production **frontend** environment variables securely within Lovable platform.
3.  **Production CI/CD Pipeline (GitHub Actions):**
    *   [ ] Finalize `main` branch workflow: Tests -> **DB Migrations (Prod)** -> **Function Deploy (Prod)**. Use Supabase Access Token GitHub Secret.
    *   [ ] *Lovable deploys frontend automatically on push to `main`.*
4.  **Migration Rollback Plan:**
    *   [ ] Define procedures for rolling back complex/failed production migrations (e.g., using pre-tested manual "down" migration scripts).
5.  **Initial Deployment & Smoke Testing:**
    *   [ ] Execute first production deployment via merge to `main`. Monitor pipeline.
    *   [ ] Perform thorough manual smoke tests immediately after deployment.
6.  **Monitoring & Alerting Setup:**
    *   [ ] Review Supabase monitoring. Set up external uptime monitoring.
    *   [ ] Configure error tracking (Sentry) via Lovable env vars.
    *   [ ] Configure Supabase log drains/integrations (Logflare etc.) for production backend logs.
    *   [ ] Set up basic alerts for critical function errors / high latency / 5xx errors.
7.  **Logging Setup:**
    *   [ ] Ensure access to Supabase logs. Implement structured JSON logging in functions. Understand Lovable log access.
8.  **Initial Documentation & Incident Response:**
    *   [ ] Finalize deployment runbook, troubleshooting guide.
    *   [ ] Define basic Incident Response Plan (contacts, steps, communication).

---

**Phase 7: Ongoing Operations & Maintenance (Corresponds to Overall Phase 7)**

**Goal:** Maintain application health, manage costs, perform routine updates, optimize performance, and refine operational procedures.

**Tasks:**

1.  **Regular Monitoring & Review:**
    *   [ ] Monitor Supabase usage/costs, external API costs, uptime, error rates, performance metrics.
    *   [ ] Regularly review structured logs and alerts.
2.  **Maintenance & Updates:**
    *   [ ] Keep FE/BE dependencies updated (Dependabot/audit tools). Test updates rigorously.
    *   [ ] Manage Supabase platform updates. Perform periodic backup restore tests.
3.  **Cost Management:**
    *   [ ] Monitor Supabase/GCP billing. Optimize resource usage.
4.  **Security Audits:**
    *   [ ] Periodically review RLS, function permissions, run dependency vulnerability scans.
5.  **Performance Tuning:**
    *   [ ] Use monitoring data to identify bottlenecks. Plan and execute load tests periodically or before expected traffic increases. Optimize queries/functions/frontend as needed.
6.  **Incident Management:**
    *   [ ] Refine Incident Response Plan based on experience. Conduct post-mortems for significant incidents.
7.  **Documentation Maintenance:** Keep ADRs, runbooks, onboarding, troubleshooting guides current.

---

**Key Considerations for Lovable + GitHub Sync:**

*   (As before - Build Process, Environment Variables, Frontend Rollbacks via Git, Backend Deployments are Independent via CI/CD).

## Supabase Specific Development Plan

**Version:** 1.0
**Date:** 2024-03-04

**1. Introduction & Goals**

This document outlines the specific plans, workflows, and best practices for utilizing the Supabase platform within the AppraisalHub project. It consolidates Supabase-centric guidelines from the frontend and backend plans to provide a focused reference for developers and operations.

**Primary Goals:**

*   Ensure consistent, reliable, and secure use of Supabase features (Database, Auth, Functions, Storage, etc.).
*   Prevent common pitfalls related to migrations, client configuration, security, and deployment.
*   Maximize developer productivity and minimize friction when working with Supabase tools and services.
*   Establish clear procedures for managing Supabase environments, schema changes, and deployments.

**2. Core Philosophy for Supabase Usage**

*   **Local-First Development:** Prioritize using the Supabase CLI and local instance (`supabase start`) for development and initial testing.
*   **Migration-Driven Schema:** ALL database schema changes (tables, columns, types, RLS, functions, triggers, indices) MUST be managed via timestamped migration files generated by `supabase db diff`.
*   **Declarative Security:** Define security primarily through Row Level Security (RLS) policies managed via migrations.
*   **Least Privilege:** Apply the principle of least privilege for API keys (`Anon` vs. `Service Role`) and database roles.
*   **Centralized Configuration:** Manage secrets and environment-specific settings through designated Supabase mechanisms (`supabase secrets`, environment variables).

**3. Environment Management**

*   **Separate Projects:** Maintain distinct Supabase projects for `development` (or `staging`) and `production`. **Never use the development project for production data or traffic.**
*   **Local Environment (`supabase start`):**
    *   Use as the primary development environment.
    *   Utilize local Supabase Studio (`localhost:54323`) and direct DB connections (`localhost:54322`) for *making* changes, but always capture these changes via `supabase db diff`.
    *   Use `supabase db reset` frequently to validate the entire migration history.
*   **Linking:** Use `supabase link --project-ref <ref>` primarily to associate the local CLI with the *development* project for initial setup or pulling specific remote changes (use cautiously). Production interactions should ideally be scripted via CI/CD using access tokens.
*   **Environment Variables:** Configure Supabase URLs and Keys via appropriate environment variables (frontend framework `.env.local`, backend `supabase secrets` / `.env` for local).

**4. Database & Migration Workflow (**CRITICAL**)**

*   **Authoritative Source:** The `supabase/migrations/` directory contains the canonical history of the database schema.
*   **Mandatory Workflow:**
    1.  Make schema changes on the *local* Supabase instance (via SQL client, local Studio).
    2.  Immediately generate a migration file: `supabase db diff > supabase/migrations/$(date +%Y%M%d%H%M%S)_descriptive_name.sql`.
    3.  Briefly review the generated SQL for correctness.
    4.  **Validate locally:** `supabase db reset`. Fix the migration file if reset fails and repeat `db reset` until successful.
    5.  Commit the validated migration file to Git.
*   **RLS Policy Implementation:** Create RLS policies (`CREATE POLICY...`) within migration files. Ensure the policy migration timestamp is *later* than the migration creating the referenced table/columns. Test RLS thoroughly with `pgTAP`.
*   **DB Functions/Triggers/Indices:** Define entirely within migration files. Test with `pgTAP`.
*   **No Manual Edits:** **NEVER** manually edit migration files that have already been applied (locally or remotely). Create a *new* migration to make corrections or further changes.
*   **Rollback Planning:** For complex/risky migrations, document rollback steps and create/test manual "down" migration scripts locally *before* applying to production.

**5. Authentication & Authorization (RLS)**

*   **Primary Mechanism:** RLS is the core authorization layer. Design policies carefully to enforce data access rules based on `auth.uid()`, roles, status, etc.
*   **Policy Management:** Define ALL RLS policies via SQL in migration files.
*   **Testing:** Write comprehensive RLS tests using `pgTAP` (`supabase test db`). Test various user roles and scenarios.
*   **JWT Verification:** Edge Functions requiring authentication MUST verify the incoming JWT and extract the `user.id` for context and authorization checks (often implicitly used by RLS in subsequent DB queries).

**6. Edge Functions**

*   **Development:** Use `supabase functions serve` for local development and testing. Leverage Deno's testing framework.
*   **Security:**
    *   Verify JWTs for protected functions.
    *   Implement strict input validation (Zod recommended).
    *   Access secrets *only* via `Deno.env.get()`.
    *   Use `SERVICE_ROLE_KEY` with extreme caution, only when RLS bypass is essential, document the rationale in an ADR, and implement rigorous manual authorization checks within the function.
*   **Configuration:** Pass Supabase URL and relevant Key (`ANON_KEY` or `SERVICE_ROLE_KEY`) via secrets accessed by `Deno.env.get()`.
*   **Logging:** Implement **structured JSON logging** for better observability.
*   **Deployment:** Deploy via `supabase functions deploy <function_name>` (ideally scripted in CI/CD). Ensure functions are deployed *after* any dependent DB migrations.

**7. Storage**

*   **Bucket Creation:** Define bucket creation within migrations (using Supabase helper functions if needed, or manage via dashboard initially and ensure consistent naming).
*   **Access Policies:** Define storage access policies primarily using Supabase Storage RLS capabilities, managed via SQL within migration files (`CREATE POLICY ... ON storage.objects ...`). Test these policies.

**8. Secrets Management (**CRITICAL**)**

*   **Single Source:** Use `supabase secrets set SECRET_NAME=value` for ALL backend secrets needed by Edge Functions (Supabase keys, external API keys, service account keys).
*   **Access:** `Deno.env.get('SECRET_NAME')` within Edge Functions.
*   **Local Development:** Secrets are available via `supabase start`. Alternatively use a `.env` file in `supabase/` (gitignored).
*   **Security:** **NEVER** commit secrets or `.env` files containing secrets to Git. Periodically review secrets for necessity.

**9. Supabase Client Usage**

*   **Frontend:**
    *   Single canonical instance (`src/lib/supabase.ts`).
    *   Initialized *only* with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from framework environment variables.
    *   Imported by all components/hooks/services needing it.
*   **Backend (Edge Functions):**
    *   Instantiated *within* the function scope (or shared backend helper).
    *   Initialized *only* with `SUPABASE_URL` / `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) accessed via `Deno.env.get()` (sourced from `supabase secrets`).

**10. Testing Strategy (Supabase Focus)**

*   **Migration Validation:** `supabase db reset` locally is the primary test that the full migration history is correct.
*   **Database/RLS Testing:** `pgTAP` (`supabase test db`) is mandatory for testing RLS policies, DB functions, triggers, and complex constraints.
*   **Function Testing:** Use `supabase functions serve` for local integration testing. Use Deno test runner for unit tests.

**11. Deployment Workflow (CI/CD)**

*   **Strict Order:**
    1.  Run all tests (lint, unit, integration, DB/pgTAP).
    2.  Apply Database Migrations to target environment (`supabase migration up`). Requires Supabase Access Token.
    3.  Deploy Edge Functions to target environment (`supabase functions deploy`). Requires Supabase Access Token.
    4.  (Frontend deployment via Lovable/GitHub sync happens separately/concurrently).
*   **Automation:** Script these steps in GitHub Actions (or chosen CI/CD tool).
*   **Environment Targeting:** Use `--project-ref` flag or environment variables in CI/CD scripts to target the correct Supabase project (staging/production).

**12. Logging & Monitoring**

*   **Leverage Supabase Dashboard:** Utilize built-in Logs (Database, Functions, Auth) and Usage reports.
*   **Enhance with Integrations:** Set up log drains (e.g., to Logflare, Better Stack) for better searchability, retention, and analysis of backend (especially function) logs. Integrate error tracking (Sentry).
*   **Structured Logging:** Ensure Edge Functions output structured JSON logs to facilitate analysis in integrated tools.

**13. Operations & Maintenance (Supabase Focus)**

*   **Backups:** Configure and regularly test database backups (Point-in-Time Recovery recommended for production).
*   **Updates:** Keep Supabase CLI version up-to-date. Monitor Supabase platform announcements for relevant changes.
*   **Resource Monitoring:** Monitor database, function, storage, and auth usage via the Supabase dashboard and billing section. Adjust compute resources as needed.
*   **Cost Management:** Track Supabase costs and related cloud provider costs (e.g., egress, Gemini).

**14. Advanced/Optional Supabase Features**

*   **`pg_cron`:** Use for database-centric scheduled tasks defined via migrations.
*   **Realtime:** If used, implement listeners securely on the frontend and manage related RLS policies carefully. Test thoroughly.

**15. Conclusion**

This plan establishes the essential rules and workflows for interacting with Supabase throughout the AppraisalHub project. Consistent adherence to these guidelines, particularly regarding migrations, secrets management, client usage, security (RLS), and deployment order, is crucial for building a stable, secure, and maintainable application on the Supabase platform.

## AppraisalHub: Supabase Platform Roadmap

This roadmap focuses specifically on the tasks related to setting up, configuring, migrating, and managing the Supabase platform components (Database, Auth, Functions, Storage, etc.) throughout the AppraisalHub project lifecycle.

---

**Phase 1: Foundation & Core Schema Setup (Corresponds to Overall Phase 0 & 1)**

**Goal:** Establish the foundational Supabase projects, local environment, core database schema via migrations, and basic authentication/RLS.

**Tasks:**

1.  **Project Initialization:**
    *   [ ] Initialize Supabase locally (`supabase init`).
    *   [ ] Create remote Supabase projects (Dev/Staging, Production).
    *   [ ] Link local CLI to the Dev project (`supabase link`).
    *   [ ] Configure local development environment (`supabase start`).
2.  **Core Database Schema & Migrations:**
    *   [ ] Define initial schema SQL for `profiles`, `teams`, `team_members`, `appraisals` (basic), `integrations`.
    *   [ ] Generate initial migration files using the strict `supabase db diff` workflow.
    *   [ ] Apply and validate migrations locally using `supabase db reset`.
3.  **Authentication & Basic RLS:**
    *   [ ] Configure Supabase Auth settings (email templates, etc.).
    *   [ ] Implement initial RLS policies for core tables (`profiles`, basic `appraisals`, `teams`) via migrations.
    *   [ ] Generate migrations for RLS policies. Validate locally via `db reset`.
4.  **Database Functions/Triggers (Initial):**
    *   [ ] Implement trigger/function for `profiles` creation on user signup (via migration).
5.  **Secrets Management (Initial):**
    *   [ ] Set up initial necessary secrets in the Dev project via `supabase secrets set`.

---

**Phase 2: Auth Refinement & API Foundations (Corresponds to Overall Phase 2)**

**Goal:** Solidify RLS policies, set up the Edge Function environment, and prepare for backend API development.

**Tasks:**

1.  **RLS Policy Review & Testing:**
    *   [ ] Refine initial RLS policies based on early requirements.
    *   [ ] Implement initial pgTAP tests (`supabase/tests/db/`) specifically for RLS policies. Run via `supabase test db`.
2.  **Edge Function Environment:**
    *   [ ] Initialize Edge Functions locally if not done (`supabase functions new ...`).
    *   [ ] Deploy a test function to the Dev remote project to verify deployment setup (`supabase functions deploy ...`).
    *   [ ] Configure `import_map.json` for function dependencies.

---

**Phase 3: Data Ingestion & Core Processing Support (Corresponds to Overall Phase 3)**

**Goal:** Expand the database schema to support data ingestion and algorithmic results, refine RLS, and implement related Edge Functions securely accessing Supabase resources.

**Tasks:**

1.  **Database Schema Expansion (Migrations):**
    *   [ ] Update `appraisals` table schema (add columns for ingested data JSONB, algorithmic results, status flags) via `db diff` workflow.
    *   [ ] Validate with `db reset`.
2.  **Edge Function Implementation (Supabase Interaction):**
    *   [ ] Develop ingestion/orchestration Edge Functions (`ingest-*`, `process-appraisal`).
    *   [ ] Implement secure access to Supabase secrets (`Deno.env.get()`) for API keys.
    *   [ ] Implement interaction with Supabase DB using `@supabase/supabase-js` client (initialized securely) within functions.
    *   [ ] Ensure functions respect and rely on RLS by using user context from verified JWTs in queries.
3.  **RLS Refinement & Testing (Migrations & pgTAP):**
    *   [ ] Update RLS policies on `appraisals` based on new columns and processing statuses (via migration).
    *   [ ] Expand pgTAP tests to cover new RLS scenarios.

---

**Phase 4: AI Integration Support (Corresponds to Overall Phase 4)**

**Goal:** Configure secrets for AI, update the database schema for AI results, and ensure Edge Functions securely integrate AI processing using Supabase secrets.

**Tasks:**

1.  **Secrets Management (AI):**
    *   [ ] Securely store Google Service Account Key content via `supabase secrets set` in the Dev project.
2.  **Database Schema Update (Migrations):**
    *   [ ] Add columns to `appraisals` table for AI-generated text outputs (`market_analysis`, `property_description`, etc.) via `db diff` workflow.
    *   [ ] Validate with `db reset`.
3.  **Edge Function Integration:**
    *   [ ] Update Edge Functions to access AI credentials via `Deno.env.get()`.
    *   [ ] Implement logic to store parsed AI results back into the Supabase database.
4.  **RLS Review (If Needed):**
    *   [ ] Review if RLS policies need adjustments based on AI analysis completion status (via migration if changed). Update pgTAP tests.

---

**Phase 5: Report Generation Support (Corresponds to Overall Phase 5)**

**Goal:** Configure Supabase Storage, update schema for report tracking, and implement secure report generation/storage via Edge Functions.

**Tasks:**

1.  **Supabase Storage Setup:**
    *   [ ] Create necessary Storage buckets (e.g., `generated-reports`).
    *   [ ] Define Storage RLS policies (`CREATE POLICY ... ON storage.objects ...`) via migrations to control access to generated reports.
2.  **Database Schema Update (Migrations):**
    *   [ ] Update `appraisals` table schema to track report generation status and storage path/ID (via `db diff` workflow).
    *   [ ] Validate with `db reset`.
3.  **Edge Function (Storage Interaction):**
    *   [ ] Implement logic in `generate-report` function to securely upload generated PDFs to Supabase Storage using `@supabase/supabase-js`.
    *   [ ] Ensure function respects Storage RLS policies.
4.  **RLS Testing (Storage):**
    *   [ ] Write pgTAP tests (or manual tests) for Storage RLS policies.

---

**Phase 6: Production Readiness & Deployment (Corresponds to Overall Phase 6)**

**Goal:** Prepare the production Supabase project, finalize configurations, implement CI/CD for Supabase deployments, and perform final testing.

**Tasks:**

1.  **Production Supabase Project Configuration:**
    *   [ ] Ensure production project exists and is configured (Backups, PITR, Custom Domain, SMTP).
    *   [ ] **CRITICAL:** Set ALL production secrets securely in the production project via `supabase secrets set`.
2.  **CI/CD Pipeline for Supabase:**
    *   [ ] Implement GitHub Actions (or similar) workflow steps for:
        *   Running DB tests (`supabase test db`).
        *   Applying DB migrations to target env (`supabase migration up`).
        *   Deploying Edge Functions to target env (`supabase functions deploy`).
    *   [ ] Securely configure Supabase Access Token in CI/CD environment secrets.
3.  **Final RLS & Security Review:**
    *   [ ] Conduct thorough review and testing (pgTAP + manual) of ALL RLS policies in a production-like environment (staging).
    *   [ ] Review Service Role Key usage justification (ADRs).
4.  **Database Performance Tuning:**
    *   [ ] Analyze critical queries in staging/production environment (`EXPLAIN ANALYZE`).
    *   [ ] Add necessary indices via migrations based on analysis.
5.  **Deployment Dry-Run/Staging Deployment:**
    *   [ ] Execute the full deployment pipeline (migrations + functions) to the staging Supabase project. Verify success and perform smoke tests. Test migration rollback procedures.

---

**Phase 7: Ongoing Operations & Maintenance (Corresponds to Overall Phase 7)**

**Goal:** Monitor Supabase resource usage and costs, manage backups, perform updates, and maintain security posture.

**Tasks:**

1.  **Monitoring & Cost Management:**
    *   [ ] Regularly monitor Supabase Dashboard (Usage, Reports, Billing). Adjust compute add-ons if needed.
2.  **Backup Management:**
    *   [ ] Verify automated backups are running. Perform periodic test restores to ensure validity.
3.  **Platform Updates:**
    *   [ ] Keep Supabase CLI updated. Stay informed about breaking changes or new features in Supabase platform versions.
4.  **Security Maintenance:**
    *   [ ] Periodically review RLS policies and secrets for necessity and correctness.
5.  **Optimization:**
    *   [ ] Continue monitoring database and function performance. Apply optimizations (indexing, query refactoring) via migrations as needed based on production data.
6.  **Utilize Supabase Features:**
    *   [ ] Evaluate and potentially adopt new Supabase features (`pg_cron`, Realtime enhancements, etc.) where beneficial, following the standard migration/testing workflow.

---

**Cross-Cutting Supabase Concerns:**

*   **Migration Workflow:** Continuously enforce the `diff` -> `reset` workflow locally.
*   **Client Configuration:** Ensure frontend and backend use the correct, securely configured Supabase clients.
*   **Secrets Management:** Strictly use `supabase secrets` for backend, managed per environment.
*   **RLS Testing:** Maintain comprehensive pgTAP tests for all RLS policies.