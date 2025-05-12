Okay, I have rewritten the Frontend and Backend Development Plans, integrating the details from the updated roadmaps and the additional suggestions discussed previously.

---

## AppraisalHub: Frontend Development Plan (Rewritten - V1.1)

**Version:** 1.1
**Date:** 2024-03-04

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