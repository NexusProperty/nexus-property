
# AppraisalHub: Detailed Development Plan (Post-Navigation Foundation)

This plan details the remaining development work required to build out the functional features and backend logic for AppraisalHub, now that the core navigation structure and routing are in place across all portals.

## 1. Frontend Development (Completing Screen Functionality)

Focus: Building the interactive elements, data display, form logic, and state management for the screens whose routes are already configured.

-   **1.1. Implement Data Fetching and Display Logic:**
    -   Fetch and display lists of data (Appraisals, Users, Team Members, Integration Status, Appraisal Feed leads) on their respective screens using Supabase queries.
    -   Build components to render detailed views of individual items (e.g., single Appraisal view, User Profile detail, Team Member detail).
    -   Integrate loading, error, and empty states into data display components.
    -   Implement filtering, sorting, and search functionality on data lists.
-   **1.2. Build & Integrate Data Forms:**
    -   Complete forms for creating and editing data (Create New Appraisal Wizard, Edit Appraisal, Add/Edit Team Member, Team Settings, Integration Configuration, User Profile forms).
    -   Integrate React Hook Form and Zod validation for all forms.
    -   Implement form submission logic to send data to Supabase/Backend endpoints (INSERT/UPDATE operations).
    -   Handle form submission states (submitting, success, error).
-   **1.3. Develop Dashboard Content:**
    -   Fetch necessary data from backend endpoints/Supabase to populate dashboard widgets (metrics, recent activity).
    -   Implement charts and visualizations using Recharts for analytics data on Admin/Agent dashboards.
    -   Add functionality to quick access buttons/links on dashboards.
-   **1.4. Implement Appraisal Report Display:**
    -   Develop UI components to render the content of a generated appraisal report within the application (this might involve embedding a PDF viewer or rendering structured data formatted like a report).
    -   Ensure agent branding elements are correctly pulled and displayed in Agent portal reports.
-   **1.5. Implement Appraisal Feed (Leads) Actions:**
    -   Build the UI for viewing limited lead details from the feed.
    -   Implement the "Claim Lead" or "Contact Customer" interaction flow (e.g., confirmation modals, sending initial message via a backend endpoint).
    -   Update the feed UI dynamically when a lead is claimed.
-   **1.6. Refine UI/UX & Responsiveness:**
    -   Continue iterating on the visual design and user experience across all screens.
    -   Ensure consistent responsiveness using Tailwind CSS across various devices.
    -   Implement necessary modals, toasts, and other UI feedback mechanisms.

## 2. Backend Development (Supabase Database & Edge Functions / APIs)

Focus: Implementing the core business logic, data persistence, security rules, and backend endpoints required by the frontend.

-   **2.1. Finalize Database Schema & Implement Comprehensive RLS:**
    -   Conduct a final review of all table schemas (`profiles`, `appraisals`, `teams`, `team_members`, `integrations`) to ensure they fully support planned features.
    -   **CRITICAL:** Implement and rigorously test **Row-Level Security (RLS)** policies for *every* table containing user data. Ensure that users can *only* access, insert, update, or delete data they are explicitly permitted to based on their role and relationships (e.g., owner, team member, admin). This is foundational to the platform's security.
-   **2.2. Develop Supabase Edge Functions / API Endpoints:**
    -   Create the necessary backend functions to handle data interactions initiated by the frontend forms and actions:
        -   Endpoint to receive data from the "Create Appraisal" forms (both Customer and Agent) and trigger the data ingestion/AI process (Task 3.4).
        -   Endpoints for listing, retrieving, creating, updating, and deleting `Appraisals`.
        -   Endpoints for listing, retrieving, creating, updating, and deleting `Teams` and `Team_Members` (handle team lead logic).
        -   Endpoints for updating user `Profiles`.
        -   Endpoint for the "Publish Appraisal" action (setting `status` to 'published').
        -   Endpoint for the "Claim Lead" action (updating `appraisals.agent_id` and `status`, ensuring RLS allows this transition).
        -   Endpoints for fetching data for Admin & Agent dashboards (aggregated metrics, recent activity).
        -   Endpoints for fetching the Appraisal Feed data (filtering based on status and `agent_id` being null).
        -   Endpoints for managing `Integrations` (saving credentials securely).
        -   Endpoints for analytics data extraction/aggregation (Planned - 2.3).
        -   Endpoints for triggered notifications (Planned - 2.3).
    -   Implement input validation and sanitization on all incoming data.
-   **2.3. Implement Advanced Backend Logic (Planned):**
    -   Develop backend logic for complex features like analytics data aggregation, notification triggers, data import/export processing, etc.

## 3. API Integrations

Focus: Connecting to external real estate data providers and handling the ingestion and standardization of data.

-   **3.1. Implement CoreLogic NZ Integration:**
    -   Write code to securely connect to the CoreLogic API.
    -   Develop functions to query specific CoreLogic endpoints based on property address to fetch:
        -   Property Attributes
        -   Sales History
        -   AVM (Automated Valuation Model) data
        -   Local Market Data
    -   Implement error handling, rate limit management, and robust parsing of CoreLogic responses.
-   **3.2. Implement REINZ Integration:**
    -   Write code to securely connect to the REINZ API.
    -   Develop functions to query REINZ endpoints to fetch:
        -   Market Statistics (median prices, volumes)
        -   Comparable Sold Properties (key data points for CMA)
    -   Implement error handling, rate limit management, and parsing of REINZ responses.
-   **3.3. Implement Other Potential Integrations (Planned):**
    -   Research, connect, and fetch data from additional sources (Council data, School Zones, Mapping Services) as defined in the initial requirements.
-   **3.4. Develop Data Ingestion & Standardization Pipeline:**
    -   Create a backend service/function (orchestrated by the "initiate Appraisal creation" endpoint) that:
        -   Takes a property address and potentially user inputs.
        -   Calls the necessary integration functions (3.1, 3.2, 3.3).
        -   Combines the data from all sources.
        -   Cleans, standardizes, and validates the collected data.
        -   Prepares the data structure to be passed to the AI Processing step (4.1).

## 4. AI / Core Processing & Report Generation

Focus: Implementing the core valuation logic and generating the final appraisal documents.

-   **4.1. Develop AI Processing and Analysis Logic:**
    -   Receive standardized data from the Data Ingestion pipeline (3.4).
    -   Implement algorithms for:
        -   Matching and validating the subject property.
        -   Selecting the most relevant comparable properties from the ingested data.
        -   Performing valuation modeling (this could involve leveraging third-party AVMs, refining them, or implementing custom logic).
        -   Analyzing local market trends and sentiment.
    -   Structure the processed results into the format required by the `Appraisals` table columns (`property_details`, `estimated_value_min`, `estimated_value_max`, `comparable_properties`, `market_analysis`).
    -   Handle the distinction between generating data for a 'limited' customer appraisal vs. a 'full' agent appraisal.
-   **4.2. Implement Automated Report Generation:**
    -   Develop a process (could be a backend service or triggered function) that takes a completed `Appraisal` record from the database.
    -   Uses a templating engine or PDF generation library to create a professional, formatted document (likely PDF).
    -   Populates the template with all the data from the `Appraisal` record.
    -   Integrates agent-specific details and branding for reports generated in the Agent Portal.
    -   Stores the generated report file (e.g., in Supabase Storage) and updates the `Appraisals` record with a link to the file.

## 5. Testing

Focus: Implementing comprehensive testing across all parts of the application.

-   **5.1. Implement Unit Tests:**
    -   Write tests for Frontend components (especially forms, complex UI logic).
    -   Write tests for Backend logic (Edge Functions, data processing, RLS helper functions).
    -   Write tests for API integration functions (data parsing, error handling, specific query logic).
    -   Write tests for AI processing algorithms (comparable selection, valuation logic).
-   **5.2. Implement Integration Tests:**
    -   Test Frontend components interacting with Backend endpoints.
    -   Test Backend endpoints interacting with the Supabase database.
    -   Test the Data Ingestion pipeline (3.4) calling the Integration functions (3.1, 3.2).
    -   Test the AI Processing logic (4.1) receiving data from Ingestion and producing correct output structure.
    -   Test the Report Generation process (4.2) taking data and creating a file.
    -   **Crucially:** Test RLS policies thoroughly by simulating requests from different authenticated users and roles.
-   **5.3. Implement End-to-End (E2E) Tests:**
    -   Write tests simulating full user workflows:
        -   Customer sign up -> generate limited appraisal -> publish -> logout.
        -   Agent sign up/login -> view feed -> claim lead -> view claimed appraisal -> create new appraisal -> logout.
        -   Admin login -> manage users -> view system metrics -> logout.
-   **5.4. Security Testing:**
    -   Conduct dedicated security testing on authentication flows, RLS enforcement, data handling, and potential vulnerabilities.
-   **5.5. Performance Testing (Planned):**
    -   Measure the performance of the appraisal generation workflow under anticipated load.
    -   Identify and address performance bottlenecks in API calls, data processing, or database queries.

## 6. Deployment & Operations

Focus: Preparing the application for production deployment and ongoing management.

-   **6.1. Configure Production Environment:**
    -   Set up production Supabase project (scaling, backups, monitoring).
    -   Configure frontend hosting (Vercel/Netlify/etc.) for production builds.
    -   Set up production environment variables for API keys and sensitive config (using Supabase Secrets or hosting provider's secrets management).
-   **6.2. Implement CI/CD Pipeline:**
    -   Automate building, testing, and deployment processes using a CI/CD service (GitHub Actions, GitLab CI, etc.).
    -   Ensure automated deployment of Frontend and Supabase Edge Functions/Database migrations.
-   **6.3. Setup Monitoring, Logging, and Alerting:**
    -   Integrate application monitoring (e.g., Sentry) to track errors and performance.
    -   Configure logging for backend processes and integrations.
    -   Set up alerts for critical errors, performance issues, or API integration failures.
-   **6.4. Implement API Key Management:**
    -   Ensure secure storage and retrieval of all third-party API keys in the production environment.
-   **6.5. Plan Backup and Recovery:**
    -   Verify Supabase backup strategy is in place and understood.
-   **6.6. Plan Scaling Strategy (Planned):**
    -   Outline how the application will scale to handle increased user load and appraisal volume (e.g., reviewing Supabase compute add-ons, optimizing queries, considering serverless function scaling).

## 7. Documentation & Help

Focus: Providing resources for users and future developers.

-   **7.1. Create User Documentation:**
    -   Develop help articles or guides for using the Agent Portal and Customer Portal.
    -   Build content for the "Help/Support Link" (Common Navigation).
    -   Include FAQs and troubleshooting steps.
-   **7.2. Create Developer Documentation:**
    -   Document the database schema, API endpoints, integration details, and core logic flows.
    -   Explain the setup and deployment process.
