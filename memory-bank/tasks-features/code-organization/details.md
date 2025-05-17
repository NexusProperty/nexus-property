# Task: Codebase Organization

## Status of Reorganization (as of today's date - AI Update)

This document outlines a planned codebase reorganization. A previous attempt confirmed that the target directory structure (Section 3 and 5.1) was created, but most source files listed in the original plan (Section 2 and 4) were not found in their expected locations.

**Recent Progress (This Session):**

1.  **Comprehensive File Inventory:** A new inventory of the project's *actual* current files was performed, locating many previously "missing" files.
2.  **Memory Bank Core Files Addressed:**
    *   Older/duplicate versions of `tasks.md`, `activeContext.md`, `progress.md`, and `implementation-plan.md` were **deleted** from the project root, preserving the more current versions in `memory-bank/`.
    *   `memory-bank/documentation/code-style-guide.md` was **moved and renamed** to `memory-bank/style-guide.md`.
    *   Root files `creative-phase-design.md` and `reflection.md` were **moved** to `memory-bank/creative/` and `memory-bank/reflection/` respectively (new subdirectories created).
3.  **Build Log Note:** The `memory-bank/build_log.md` was not found.
4.  **Target Directory Creation:** Necessary subdirectories within `docs/`, `scripts/`, `config/`, and `supabase/` (like `supabase/schema_dumps`) were **created or confirmed** to exist to facilitate file moves.
5.  **Main File Reorganization - COMPLETED:**
    *   **Markdown Documentation:** All identified Markdown files from the project root (e.g., `supabase-setup.md`, `development-plan.md`, etc.) have been **relocated** to their designated subdirectories within `docs/`.
    *   **Scripts:** All identified script files from the `scripts/` directory (e.g., `test-enhanced-report.js`, `deploy-corelogic-updates.sh`, etc.) and `scripts/manual-fix-instructions.md` have been **relocated** to their designated subdirectories within `scripts/` or `docs/`.
    *   **Other Project Files:**
        *   `deployment.config.js` (root) **moved** to `config/deployment.config.js`.
        *   `nginx.conf` (root) **moved** to `nginx/frontend.conf`.
        *   `schema_dump.sql` (root) **moved and renamed** to `supabase/schema_dumps/schema_dump_YYYY-MM-DD.sql`.
        *   The extensionless `script` file (root) was **renamed and moved** to `supabase/migrations/YYYYMMDDHHMMSS_apply_security_and_base_schema.sql`.
6.  **Dockerfile Update - COMPLETED:** The `COPY` command in the main `Dockerfile` was **updated** to reflect the new path for `nginx/frontend.conf`.
7.  **Empty Directory Deletion - COMPLETED:** The empty `doc/` directory was **deleted** from the project root.
8.  **Guidance on Reading Files:** Proceeded with file moves without reading full content of each file, as per user instruction to proceed with moves.

**Next Steps (Post-Reorganization):**

The primary structural reorganization of files is now largely complete. The following tasks remain, as outlined in the original plan:

1.  **Content Review & Merging (If Applicable):** As per the original plan (e.g., Section 4.1, items 14 & 16), review any documentation files that might be redundant or require merging now that they are in their new locations (e.g., if `deployment-summary.md` was moved and `docs/deployment-guide.md` exists, check for overlap).
2.  **Internal Link Updates (Post-Move Task):** After all changes have settled, a separate pass may be needed to check and update any broken internal links within the moved Markdown files.
3.  **Final Review & Commit:** Review all changes made during this reorganization effort and commit them to version control.

This updated plan leverages the created directory structure and the now-accurate file inventory to complete the reorganization.

## 1. Goal

To reorganize the project's Markdown documentation and script files into a more structured and maintainable layout.

## 2. Analysis of Existing Files

**Note:** Subsequent attempts to reorganize based on this analysis (see Status section above and `memory-bank/build_log.md`) found that the files listed below were largely not present at the specified locations or project-wide. This analysis likely reflects an outdated project state.

### 2.1. Markdown Files (.md)

*   **`README.md`**: Standard project README.
*   **`tasks.md`**: Task tracking, likely ephemeral as per Memory Bank rules.
*   **`supabase-setup.md`**: Instructions and notes related to setting up Supabase.
*   **`development-plan.md`**: High-level development plan.
*   **`report-generation-implementation.md`**: Specifics on implementing report generation.
*   **`schema-documentation.md`**: Documentation for the database schema.
*   **`realtime-implementation-summary.md`**: Summary of real-time features implementation.
*   **`edge-functions-deployment-summary.md`**: Summary related to deploying Supabase Edge Functions.
*   **`fix-database-recommendations.md`**, **`database-setup-fix.md`**: Notes on fixing database issues.
*   **`supabase-connection-status.md`**: Notes related to Supabase connection status/checks.
*   **`supabase-integration-summary.md`**: Summary of Supabase integration.
*   **`edge-functions-setup.md`**: Notes on setting up Edge Functions.
*   **`deployment-summary.md`**: General deployment summary.
*   **`project-setup-guide.md`**: Guide for setting up the project.
*   **`migration-guide.md`**: Guide for database migrations.
*   **`api-documentation.md`**: Documentation for the project's API.
*   **`frontend-guidelines.md`**: Guidelines for frontend development.
*   **`backend-architecture.md`**: Overview of the backend architecture.
*   **`testing-strategy.md`**: Strategy for testing the application.
*   **`security-audit.md`**: Notes from a security audit.
*   **`performance-optimizations.md`**: Notes on performance optimizations.
*   **`style-guide.md`** (in root): Project style guide.
*   **`implementation-plan.md`**: Core Memory Bank planning document.
*   **`scripts/README.md`**: README for the scripts folder.
*   **`scripts/manual-fix-instructions.md`**: Manual instructions for a fix, likely related to CSRF.

### 2.2. Script Files (`scripts/`)

*   `test-enhanced-report.js`: Tests enhanced report generation. (Testing, Reporting)
*   `deploy-corelogic-updates.sh`: Deploys CoreLogic API updates. (Deployment, CoreLogic, Supabase)
*   `performance-report.js`: Generates performance reports. (Testing, Reporting)
*   `verify-supabase-config.js`: Verifies Supabase configuration. (Supabase, Verification, Config)
*   `deploy.js`: General deployment script. (Deployment)
*   `create-test-profile.sql`: SQL to create a test user profile. (Testing, Database, Supabase)
*   CSRF-related scripts (multiple files): Testing and fixing CSRF vulnerabilities. (Security, CSRF, Testing, Database)
*   `supabase-direct-query.sql`: SQL for direct Supabase queries (dev utility). (Supabase, Database, Utility)
*   `apply-migrations.js`: Applies database migrations. (Database, Migration, Supabase)
*   `fix-db-errors.sql`: SQL to fix database errors. (Database, Supabase, Maintenance)
*   `create-tables.sql`: SQL to create tables. (Database, Supabase, Schema)
*   `check-connection.js`: Checks Supabase connection. (Supabase, Verification)
*   `init-schema.sql`: Initializes database schema. (Database, Supabase, Schema)
*   `init-database.js`: Initializes database via JS script. (Database, Supabase, Schema)
*   `setup-supabase-env.js`: Sets up Supabase environment variables. (Supabase, Config)
*   `test-supabase-service-role.js`, `test-supabase-connection.js`: Tests Supabase connection with different roles. (Supabase, Testing, Verification)


## 3. Proposed Organizational Structure

A `docs/` directory will be created (or consolidated if existing) for general documentation. Scripts will be organized into subfolders within `scripts/`. `memory-bank` file paths will be enforced. Configuration files essential for tooling at the root will remain there. Other project-specific configurations might be grouped. Top-level project folders like `.git`, `node_modules`, `.cursor`, `.vscode`, `supabase` (standard subdirs), `.github/workflows` will largely remain as is due to their standard purpose.

## 4. Proposed Changes (File Moves)

**Note:** The file moves proposed below could not be executed as the 'Current' source files were largely not found in the project. The target directory structure *was* created. See Status section and `memory-bank/build_log.md` for details.

### 4.1. Markdown Files:

*   **General Approach for `docs/`:**
    *   The `docs/` directory already exists with `adr/`, `security/`, `archive/` subdirectories and files like `deployment-guide.md` and `database-migration-guide.md`.
    *   The proposed moves will integrate with this structure.
    *   Redundant files (e.g., a root `migration-guide.md` vs. `docs/database-migration-guide.md`) will be noted for review and potential merge/deletion after the initial move.

1.  **Current:** `README.md` -> **Proposed:** `README.md` (No change)
2.  **Current:** `tasks.md` -> **Proposed:** `memory-bank/tasks.md`
3.  **Current:** `supabase-setup.md` -> **Proposed:** `docs/supabase/setup.md`
4.  **Current:** `development-plan.md` (root) -> **Proposed:** `docs/project/development-plan.md`
5.  **Current:** `report-generation-implementation.md` -> **Proposed:** `docs/features/report-generation.md`
6.  **Current:** `schema-documentation.md` (root) -> **Proposed:** `docs/database/schema-documentation.md`
7.  **Current:** `realtime-implementation-summary.md` -> **Proposed:** `docs/features/realtime-summary.md`
8.  **Current:** `edge-functions-deployment-summary.md` -> **Proposed:** `docs/supabase/edge-functions-deployment.md`
9.  **Current:** `fix-database-recommendations.md` -> **Proposed:** `docs/database/maintenance/fix-recommendations.md`
10. **Current:** `database-setup-fix.md` -> **Proposed:** `docs/database/maintenance/setup-fixes.md`
11. **Current:** `supabase-connection-status.md` -> **Proposed:** `docs/supabase/connection-status.md`
12. **Current:** `supabase-integration-summary.md` -> **Proposed:** `docs/supabase/integration-summary.md`
13. **Current:** `edge-functions-setup.md` -> **Proposed:** `docs/supabase/edge-functions-setup.md`
14. **Current:** `deployment-summary.md` (root)
    *   **Proposed:** `docs/deployment/summary.md`.
    *   **Note:** Review against existing `docs/deployment-guide.md`. Merge if overlapping, or keep if distinct summary.
15. **Current:** `project-setup-guide.md` -> **Proposed:** `docs/project/setup-guide.md`
16. **Current:** `migration-guide.md` (root)
    *   **Proposed:** `docs/database/migrations-overview.md` (if content is general and distinct from `docs/database-migration-guide.md`).
    *   **Note:** Review against existing `docs/database-migration-guide.md`. Merge if overlapping, or keep if a distinct general overview. The existing `docs/database-migration-guide.md` should be the primary detailed guide.
17. **Current:** `api-documentation.md` -> **Proposed:** `docs/api/documentation.md`
18. **Current:** `frontend-guidelines.md` -> **Proposed:** `docs/frontend/guidelines.md`
19. **Current:** `backend-architecture.md` -> **Proposed:** `docs/backend/architecture.md`
20. **Current:** `testing-strategy.md` -> **Proposed:** `docs/testing/strategy.md`
21. **Current:** `security-audit.md` (root) -> **Proposed:** `docs/security/audit-notes.md` (integrates with existing `docs/security/`)
22. **Current:** `performance-optimizations.md` -> **Proposed:** `docs/project/performance-optimizations.md`
23. **Current:** `style-guide.md` (root) -> **Proposed:** `memory-bank/style-guide.md`
24. **Current:** `implementation-plan.md` (root) -> **Proposed:** `implementation-plan.md` (Keep at root or move to `memory-bank/` as per project standards for this file. For now, assume root.)
25. **Current:** `scripts/README.md` -> **Proposed:** `scripts/README.md` (No change)
26. **Current:** `scripts/manual-fix-instructions.md` -> **Proposed:** `docs/database/maintenance/csrf-manual-fix-instructions.md`

*   **Existing `docs/` files to note:**
    *   `docs/deployment-guide.md`: Keep (or move to `docs/deployment/guide.md`). Primary deployment doc.
    *   `docs/database-migration-guide.md`: Keep (or move to `docs/database/migrations/guide.md`). Primary migration doc.
    *   `docs/adr/pdf-generation-strategy.md`: Keep.
    *   `docs/security/csrf-protection.md`: Keep.
    *   `docs/archive/technical-implementation-validation.md`: Keep. Consider moving other truly archived docs here later.

### 4.2. Script Files (`scripts/` directory):

**New Subfolders to Create in `scripts/`:**
*   `scripts/testing/`
    *   `scripts/testing/reports/`
    *   `scripts/testing/database/`
*   `scripts/deployment/`
    *   `scripts/deployment/corelogic/`
*   `scripts/database/`
    *   `scripts/database/utils/`
    *   `scripts/database/migrations/`
    *   `scripts/database/maintenance/`
    *   `scripts/database/schema/`
    *   `scripts/database/setup/`
*   `scripts/supabase/`
    *   `scripts/supabase/verification/`
    *   `scripts/supabase/utils/`
    *   `scripts/supabase/config/`
    *   `scripts/supabase/testing/`
*   `scripts/security/`
    *   `scripts/security/csrf/`
        *   `scripts/security/csrf/fixes/`
        *   `scripts/security/csrf/examples/`
*   `scripts/reporting/`

**Proposed Moves for Scripts:**
1.  **Current:** `scripts/test-enhanced-report.js` -> **Proposed:** `scripts/testing/reports/test-enhanced-report.js`
2.  **Current:** `scripts/deploy-corelogic-updates.sh` -> **Proposed:** `scripts/deployment/corelogic/deploy-corelogic-updates.sh`
3.  **Current:** `scripts/performance-report.js` -> **Proposed:** `scripts/reporting/performance-report.js`
4.  **Current:** `scripts/verify-supabase-config.js` -> **Proposed:** `scripts/supabase/verification/verify-config.js`
5.  **Current:** `scripts/deploy.js` -> **Proposed:** `scripts/deployment/deploy.js`
6.  **Current:** `scripts/create-test-profile.sql` -> **Proposed:** `scripts/testing/database/create-test-profile.sql`
7.  **Current:** `scripts/verify-csrf-protection.js` -> **Proposed:** `scripts/security/csrf/verify-csrf-protection.js`
8.  **Current:** `scripts/verify-csrf-alternate.js` -> **Proposed:** `scripts/security/csrf/verify-csrf-alternate.js`
9.  **Current:** `scripts/test-csrf-implementation.sql` -> **Proposed:** `scripts/security/csrf/test-csrf-implementation.sql`
10. **Current:** `scripts/test-csrf-frontend.js` -> **Proposed:** `scripts/security/csrf/test-csrf-frontend.js`
11. **Current:** `scripts/supabase-direct-query.sql` -> **Proposed:** `scripts/supabase/utils/direct-query.sql`
12. **Current:** `scripts/fix-csrf-protection.sql` -> **Proposed:** `scripts/security/csrf/fixes/fix-csrf-protection.sql`
13. **Current:** `scripts/manual-csrf-test.sql` -> **Proposed:** `scripts/security/csrf/manual-csrf-test.sql`
14. **Current:** `scripts/direct-csrf-fix.sql` -> **Proposed:** `scripts/security/csrf/fixes/direct-csrf-fix.sql`
15. **Current:** `scripts/direct-csrf-fix-safe.sql` -> **Proposed:** `scripts/security/csrf/fixes/direct-csrf-fix-safe.sql`
16. **Current:** `scripts/debug-verify-csrf.js` -> **Proposed:** `scripts/security/csrf/debug-verify-csrf.js`
17. **Current:** `scripts/debug-csrf-protection.sql` -> **Proposed:** `scripts/security/csrf/debug-csrf-protection.sql`
18. **Current:** `scripts/csrf-token-test.sql` -> **Proposed:** `scripts/security/csrf/csrf-token-test.sql`
19. **Current:** `scripts/csrf-protection-example.jsx` -> **Proposed:** `scripts/security/csrf/examples/csrf-protection-example.jsx`
20. **Current:** `scripts/csrf-fix-complete.sql` -> **Proposed:** `scripts/security/csrf/fixes/csrf-fix-complete.sql`
21. **Current:** `scripts/csrf-fix-complete-safe.sql` -> **Proposed:** `scripts/security/csrf/fixes/csrf-fix-complete-safe.sql`
22. **Current:** `scripts/csrf-fix-alternate.sql` -> **Proposed:** `scripts/security/csrf/fixes/csrf-fix-alternate.sql`
23. **Current:** `scripts/apply-sql-direct.js` -> **Proposed:** `scripts/database/utils/apply-sql-direct.js`
24. **Current:** `scripts/apply-csrf-fix.js` -> **Proposed:** `scripts/security/csrf/apply-csrf-fix.js`
25. **Current:** `scripts/apply-migrations.js` -> **Proposed:** `scripts/database/migrations/apply-migrations.js`
26. **Current:** `scripts/fix-db-errors.sql` -> **Proposed:** `scripts/database/maintenance/fix-db-errors.sql`
27. **Current:** `scripts/create-tables.sql` -> **Proposed:** `scripts/database/schema/create-tables.sql`
28. **Current:** `scripts/check-connection.js` -> **Proposed:** `scripts/supabase/verification/check-connection.js`
29. **Current:** `scripts/init-schema.sql` -> **Proposed:** `scripts/database/schema/init-schema.sql`
30. **Current:** `scripts/init-database.js` -> **Proposed:** `scripts/database/setup/init-database.js`
31. **Current:** `scripts/setup-supabase-env.js` -> **Proposed:** `scripts/supabase/config/setup-env.js`
32. **Current:** `scripts/test-supabase-service-role.js` -> **Proposed:** `scripts/supabase/testing/test-service-role.js`
33. **Current:** `scripts/test-supabase-connection.js` -> **Proposed:** `scripts/supabase/testing/test-connection.js`

### 4.3. Additional Project Files (Configuration, Docker, SQL, etc.):

*   **Configuration Files (Generally kept at root for tooling compatibility):**
    *   `tailwind.config.ts`: No change.
    *   `eslint.config.js`: No change.
    *   `playwright.config.ts`: No change.
    *   `vitest.config.ts`: No change.
    *   `tsconfig.json` (and related `*.app.json`, `*.node.json`, `*.test.json`): No change.
    *   `vite.config.ts`: No change.
    *   `postcss.config.js`: No change.
    *   `components.json`: No change.
    *   `.dockerignore`: No change.
    *   `Dockerfile`: No change.
    *   `Dockerfile.test`: No change.
    *   `docker-compose.yml`: No change.
    *   `index.html`: No change (assuming it's the Vite entry point).
    *   `bun.lockb`: No change.
    *   `package.json`: No change.
    *   `package-lock.json`: No change.

*   **Files to Reorganize:**
    1.  **Current:** `deployment.config.js`
        *   **Proposed:** `config/deployment.config.js` (New directory: `config/`)
    2.  **Current:** `nginx.conf` (root file)
        *   **Proposed:** `nginx/frontend.conf` (Existing directory: `nginx/`)
        *   **Note:** `Dockerfile` content for `COPY nginx.conf ...` will need to be updated to `COPY nginx/frontend.conf ...`.
    3.  **Current:** `schema_dump.sql`
        *   **Proposed:** `supabase/schema_dumps/schema_dump_YYYY-MM-DD.sql` (New directory: `supabase/schema_dumps/`. Replace YYYY-MM-DD with the current date upon moving).
    4.  **Current:** `script` (file with no extension, contains SQL DDL for CSRF etc.)
        *   **Proposed Rename & Move:** `supabase/migrations/YYYYMMDDHHMMSS_apply_security_and_base_schema.sql` (Use a concrete timestamp upon moving. This should be reviewed if it overlaps with existing Supabase migrations).
    5.  **Current:** `doc/` (root directory and its contents)
        *   **Proposed:** Systematically move contents of `doc/*` to appropriate subdirectories within the main `docs/` directory. For example, if `doc/api-specs.md` exists, it would go to `docs/api/specs.md`. After all contents are moved, delete the empty `doc/` directory.
    6.  **Current:** `src/doc/` (directory and its contents)
        *   **Proposed:** Systematically move contents of `src/doc/*` to `docs/technical/src_documentation/` (New directory: `docs/technical/src_documentation/`). After all contents are moved, delete the empty `src/doc/` directory.

### 4.4. Top-Level Folder Structure Review:

*   `.git/`, `node_modules/`, `.cursor/`, `.vscode/`, `cursor-memory-bank/`: No changes proposed, standard/tool-specific.
*   `scripts/`: Reorganization detailed in section 4.2.
*   `docs/`: Will be the central hub for documentation, integrating existing content with moved/newly structured files. Subdirectories like `adr/`, `security/`, `archive/` will be maintained and utilized.
*   `nginx/`: Will contain `api-proxy.conf` (existing) and the proposed `frontend.conf`.
*   `.github/workflows/`: Standard structure, no changes proposed.
*   `supabase/`: Standard subdirectories (`functions/`, `migrations/`, `tests/`, `config.toml`) remain. New proposed subdirectories `schema_dumps/` will be added. The proposed SQL file moves will integrate here.
*   `public/`: Standard static assets, no changes proposed.
*   `memory-bank/`: Internal structure seems specific to its tooling/purpose. Root `tasks.md` and `style-guide.md` will move here. No other internal changes proposed for now.
*   `src/`: Core application code. `src/doc/` to be moved out. Otherwise, internal structure of `src/` is out of scope for this high-level organization task unless specific files are identified as misplaced.


## 5. Action Plan (Reflects outcome of recent reorganization attempt)

1.  **DONE:** Create the new directory structures outlined above (e.g., `docs/project/`, `scripts/testing/`, `config/`, `supabase/schema_dumps/`, `docs/technical/src_documentation/` etc.) where they don't already exist.
    *   *Status: All planned directories were created.*
2.  **NOT PERFORMED (Source Files Not Found):** Move each identified file to its proposed new location, including renaming where specified (e.g., the `script` file).
    *   *Status: This step could not be completed as the source files listed in Section 2 and Section 4 were not found in the project at the specified locations or via project-wide searches.*
3.  **NOT APPLICABLE:** Carefully review files that might be redundant after moves (e.g., `deployment-summary.md` vs. `docs/deployment-guide.md`; `migration-guide.md` vs `docs/database-migration-guide.md`). Merge unique content and then delete the redundant file.
    *   *Status: No files were moved, so no redundancies to review from this operation.*
4.  **NOT APPLICABLE:** If `nginx.conf` is moved to `nginx/frontend.conf`, update the `COPY` command in the main `Dockerfile`.
    *   *Status: `nginx.conf` was not found, so no move or Dockerfile update occurred.*
5.  **NOT APPLICABLE:** Update any internal links or references within the moved Markdown files if they become broken due to the move (this may require a separate pass or tool assistance).
    *   *Status: No files were moved, so no links to update from this operation.*
6.  **PARTIALLY DONE (Logging):** Review and commit changes in logical groups if possible (e.g., all docs changes, then all script changes).
    *   *Status: Directory creation was a single logical change. No file changes were made. A detailed build log is available at `memory-bank/build_log.md`.*
