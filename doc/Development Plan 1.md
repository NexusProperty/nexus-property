# AppraisalHub: Detailed Development Plan (Post-Navigation Foundation)

This plan details the remaining development work required to build out the functional features and backend logic for AppraisalHub, now that the core navigation structure and routing are in place across all portals.

## Phase 1. Frontend Development (Completing Screen Functionality)

Focus: Building the interactive elements, data display, form logic, and state management for the screens whose routes are already configured.

-   **1.1. Implement Data Fetching and Display Logic:**
    -   [x] Fetch and display lists of data (Appraisals, Users, Team Members, Integration Status, Appraisal Feed leads) on their respective screens using Supabase queries.
    -   [x] Build components to render detailed views of individual items (e.g., single Appraisal view, User Profile detail, Team Member detail).
    -   [x] Integrate loading, error, and empty states into data display components.
    -   [ ] Implement filtering, sorting, and search functionality on data lists.
-   **1.2. Build & Integrate Data Forms:**
    -   [x] Complete forms for creating and editing data (Create New Appraisal Wizard, Edit Appraisal, Add/Edit Team Member, Team Settings, Integration Configuration, User Profile forms).
    -   [x] Integrate React Hook Form and Zod validation for all forms.
    -   [x] Implement form submission logic to send data to Supabase/Backend endpoints (INSERT/UPDATE operations).
    -   [x] Handle form submission states (submitting, success, error).
-   **1.3. Develop Dashboard Content:**
    -   [x] Fetch necessary data from backend endpoints/Supabase to populate dashboard widgets (metrics, recent activity).
    -   [x] Implement charts and visualizations using Recharts for analytics data on Admin/Agent dashboards.
    -   [x] Add functionality to quick access buttons/links on dashboards.
-   **1.4. Implement Appraisal Report Display:**
    -   [x] Develop UI components to render the content of a generated appraisal report within the application (this might involve embedding a PDF viewer or rendering structured data formatted like a report).
    -   [x] Ensure agent branding elements are correctly pulled and displayed in Agent portal reports.
-   **1.5. Implement Appraisal Feed (Leads) Actions:**
    -   [x] Build the UI for viewing limited lead details from the feed.
    -   [x] Implement the "Claim Lead" or "Contact Customer" interaction flow (e.g., confirmation modals, sending initial message via a backend endpoint).
    -   [x] Update the feed UI dynamically when a lead is claimed.
-   **1.6. Refine UI/UX & Responsiveness:**
    -   [x] Continue iterating on the visual design and user experience across all screens.
    -   [x] Ensure consistent responsiveness using Tailwind CSS across various devices.
    -   [x] Implement necessary modals, toasts, and other UI feedback mechanisms.

## Phase 2. Backend Development (Supabase Database & Edge Functions / APIs)

Focus: Implementing the core business logic, data persistence, security rules, and backend endpoints required by the frontend.

-   **2.1. Finalize Database Schema & Implement Comprehensive RLS:**
    -   [x] Conduct a final review of all table schemas (`profiles`, `appraisals`, `teams`, `team_members`, `integrations`) to ensure they fully support planned features.
    -   [ ] **CRITICAL:** Implement and rigorously test **Row-Level Security (RLS)** policies for *every* table containing user data. Ensure that users can *only* access, insert, update, or delete data they are explicitly permitted to based on their role and relationships (e.g., owner, team member, admin). This is foundational to the platform's security.
-   **2.2. Develop Supabase Edge Functions / API Endpoints:**
    -   [x] Create the necessary backend functions to handle data interactions initiated by the frontend forms and actions:
        -   [x] Endpoint to receive data from the "Create Appraisal" forms (both Customer and Agent) and trigger the data ingestion/AI process (Task 3.4).
        -   [x] Endpoints for listing, retrieving, creating, updating, and deleting `Appraisals`.
        -   [x] Endpoints for listing, retrieving, creating, updating, and deleting `Teams` and `Team_Members` (handle team lead logic).
        -   [x] Endpoints for updating user `Profiles`.
        -   [x] Endpoint for the "Publish Appraisal" action (setting `status` to 'published').
        -   [x] Endpoint for the "Claim Lead" action (updating `appraisals.agent_id` and `status`, ensuring RLS allows this transition).
        -   [ ] Endpoints for fetching data for Admin & Agent dashboards (aggregated metrics, recent activity).
        -   [x] Endpoints for fetching the Appraisal Feed data (filtering based on status and `agent_id` being null).
        -   [ ] Endpoints for managing `Integrations` (saving credentials securely).
        -   [ ] Endpoints for analytics data extraction/aggregation (Planned - 2.3).
        -   [ ] Endpoints for triggered notifications (Planned - 2.3).
    -   [x] Implement input validation and sanitization on all incoming data.
-   **2.3. Implement Advanced Backend Logic (Planned):**
    -   [ ] Develop backend logic for complex features like analytics data aggregation, notification triggers, data import/export processing, etc.

## Phase 3. API Integrations

Focus: Connecting to external real estate data providers and handling the ingestion and standardization of data.

-   **3.1. Implement CoreLogic NZ Integration:**
    -   [ ] Write code to securely connect to the CoreLogic API.
    -   [ ] Develop functions to query specific CoreLogic endpoints based on property address to fetch:
        -   [ ] Property Attributes
        -   [ ] Sales History
        -   [ ] AVM (Automated Valuation Model) data
        -   [ ] Local Market Data
    -   [ ] Implement error handling, rate limit management, and robust parsing of CoreLogic responses.
-   **3.2. Implement REINZ Integration:**
    -   [ ] Write code to securely connect to the REINZ API.
    -   [ ] Develop functions to query REINZ endpoints to fetch:
        -   [ ] Market Statistics (median prices, volumes)
        -   [ ] Comparable Sold Properties (key data points for CMA)
    -   [ ] Implement error handling, rate limit management, and parsing of REINZ responses.
-   **3.3. Implement Other Potential Integrations (Planned):**
    -   [ ] Research, connect, and fetch data from additional sources (Council data, School Zones, Mapping Services) as defined in the initial requirements.
-   **3.4. Develop Data Ingestion & Standardization Pipeline:**
    -   [ ] Create a backend service/function (orchestrated by the "initiate Appraisal creation" endpoint) that:
        -   [ ] Takes a property address and potentially user inputs.
        -   [ ] Calls the necessary integration functions (3.1, 3.2, 3.3).
        -   [ ] Combines the data from all sources.
        -   [ ] Cleans, standardizes, and validates the collected data.
        -   [ ] Prepares the data structure to be passed to the AI Processing step (4.1).

## Phase 4. AI / Core Processing & Report Generation

Focus: Implementing the core valuation logic, leveraging AI for textual analysis/commentary, and generating the final appraisal documents.

This section takes the standardized data gathered from the API Integrations (3.4) and transforms it into the detailed output required for the `Appraisals` table and the final report.

### 4.1. Develop Core Processing and Analysis Logic (Combining Algorithms & AI)

This task orchestrates the data flow and applies different types of processing: traditional algorithms for quantitative analysis and AI (like Gemini) for qualitative analysis and narrative generation.

-   **[ ] Receive standardized data:** Get the cleaned, combined, and structured property and market data from the Data Ingestion pipeline (3.4).
-   **[ ] Implement Algorithmic Processes:** Develop or integrate the necessary algorithms for the quantitative aspects:
    -   **[ ] Matching and validating the subject property:** Algorithms to confirm the accuracy of the property details and location based on multiple data sources.
    -   **[ ] Selecting the most relevant comparable properties:** Algorithms based on factors like proximity, sale date, size, features, and condition to identify the best comparables from the ingested data.
    -   **[ ] Performing Primary Valuation Modeling:** Implement or integrate statistical/machine learning models (AVMs or custom models) to calculate the initial estimated value range (`estimated_value_min`, `estimated_value_max`) based on the subject property and selected comparables. *Note: An LLM like Gemini is generally NOT used for this primary numerical calculation.*
-   **[ ] Integrate and Utilize AI (Gemini or Similar LLM):**
    -   **[ ] Select AI Service:** Choose the specific AI service (e.g., Google Cloud's Vertex AI for Gemini, OpenAI API for GPT models, etc.). This plan assumes Gemini is the target.
    -   **[ ] Secure API Access:** Obtain necessary API keys and set up secure access from your backend (Supabase Edge Function or other service). Ensure API keys are stored securely (e.g., Supabase Secrets).
    -   **[ ] Develop AI Prompt Engineering:** Design and refine the prompts that will be sent to the Gemini API. These prompts will include:
        -   The standardized data about the subject property (facts, condition notes).
        -   Summarized data about the selected comparable properties (address, sale price, date, key features).
        -   Summarized local market trend data.
        -   Clear instructions on the desired output:
            -   Generate a market analysis summary based on the provided data.
            -   Write a compelling property description based on the facts.
            -   Add commentary explaining the relevance of the selected comparables.
            -   Include notes on factors influencing value (positive and negative).
            -   Specify the tone and level of detail (e.g., more concise for customer, more detailed/professional for agent).
            -   Request the output in a structured format if possible (e.g., markdown sections, or even guided JSON if the API supports it well).
    -   **[ ] Build AI API Call Logic:** Write backend code to format the input data into prompts, send requests to the Gemini API, and handle the API responses.
    -   **[ ] Process AI Response:** Parse the text response received from the AI. Extract the different sections (market analysis, property description, etc.) based on the prompt structure.
    -   **[ ] Handle AI Errors & Fallbacks:** Implement logic to handle cases where the AI API call fails, times out, or returns unexpected output. Consider fallback mechanisms (e.g., using pre-written template text, returning an error).
-   **[ ] Structure the processed results:** Combine the output from the algorithmic processes (valuation range, list of comparables) and the AI's textual output (market analysis text, property description text, comparable commentary) into the format required for the `Appraisals` table columns (`property_details` (including AI description), `estimated_value_min`, `estimated_value_max`, `comparable_properties` (including AI commentary), `market_analysis` (AI-generated summary)).
-   **[ ] Handle the distinction between generating data for 'limited' vs. 'full' appraisal:** Control the level of detail in the data passed to the AI and the prompts used, potentially generating less detailed text or omitting certain sections for the 'limited' customer appraisal. The algorithmic parts (matching, selection, core AVM) might also be simplified or use different parameters for the limited version.

### 4.2. Implement Automated Report Generation

This task takes the final structured data from the `Appraisals` table and produces the professional report document.

-   **[ ] Develop Report Generation Process:** Create a backend service or triggered function that runs once the `Appraisal` record in the database is marked as complete (containing all data, including AI-generated text).
-   **[ ] Choose Templating Engine or PDF Library:** Select a suitable library for generating documents from structured data (e.g., Handlebars for HTML/PDF, Puppeteer/Playwright for rendering HTML to PDF, dedicated PDF generation libraries).
-   **[ ] Design Report Templates:** Create distinct templates for the 'limited' customer appraisal and the 'full' agent appraisal, ensuring they have different layouts and sections.
-   **[ ] Populate Templates with Data:** Write logic to pull data from the `Appraisal` record and map it to the placeholders in the selected report template. This includes:
    -   Property address and factual details.
    -   The calculated value range (`estimated_value_min`, `estimated_value_max`).
    -   Details of the comparable properties.
    -   **Crucially:** The AI-generated text fields (`market_analysis`, property description, comparable commentary).
    -   Relevant charts/graphs generated from the data (e.g., showing market trends or price history).
-   **[ ] Integrate Agent-Specific Details:** For Agent portal reports, pull the agent's profile details, branding elements, and disclaimers from the `Profiles` table and integrate them into the report template.
-   **[ ] Generate Document Output:** Use the chosen library to render the populated template into a PDF document.
-   **[ ] Store the Generated Report:** Upload the generated PDF file to secure storage (e.g., Supabase Storage).
-   **[ ] Update Appraisal Record:** Update the corresponding `Appraisal` record in the database with the URL or path to the stored report file.

## Phase 5. Testing

Focus: Implementing comprehensive testing across all parts of the application.

-   **5.1. Implement Unit Tests:**
    -   [ ] Write tests for Frontend components (especially forms, complex UI logic).
    -   [ ] Write tests for Backend logic (Edge Functions, data processing, RLS helper functions).
    -   [ ] Write tests for API integration functions (data parsing, error handling, specific query logic).
    -   [ ] Write tests for AI processing algorithms (comparable selection, valuation logic).
-   **5.2. Implement Integration Tests:**
    -   [ ] Test Frontend components interacting with Backend endpoints.
    -   [ ] Test Backend endpoints interacting with the Supabase database.
    -   [ ] Test the Data Ingestion pipeline (3.4) calling the Integration functions (3.1, 3.2).
    -   [ ] Test the AI Processing logic (4.1) receiving data from Ingestion and producing correct output structure.
    -   [ ] Test the Report Generation process (4.2) taking data and creating a file.
    -   [ ] **Crucially:** Test RLS policies thoroughly by simulating requests from different authenticated users and roles.
-   **5.3. Implement End-to-End (E2E) Tests:**
    -   [ ] Write tests simulating full user workflows:
        -   [ ] Customer sign up -> generate limited appraisal -> publish -> logout.
        -   [ ] Agent sign up/login -> view feed -> claim lead -> view claimed appraisal -> create new appraisal -> logout.
        -   [ ] Admin login -> manage users -> view system metrics -> logout.
-   **5.4. Security Testing:**
    -   [ ] Conduct dedicated security testing on authentication flows, RLS enforcement, data handling, and potential vulnerabilities.
-   **5.5. Performance Testing (Planned):**
    -   [ ] Measure the performance of the appraisal generation workflow under anticipated load.
    -   [ ] Identify and address performance bottlenecks in API calls, data processing, or database queries.

## Phase 6. Deployment & Operations

Focus: Preparing the application for production deployment and ongoing management.

-   **6.1. Configure Production Environment:**
    -   [ ] Set up production Supabase project (scaling, backups, monitoring).
    -   [ ] Configure frontend hosting (Vercel/Netlify/etc.) for production builds.
    -   [ ] Set up production environment variables for API keys and sensitive config (using Supabase Secrets or hosting provider's secrets management).
-   **6.2. Implement CI/CD Pipeline:**
    -   [ ] Automate building, testing, and deployment processes using a CI/CD service (GitHub Actions, GitLab CI, etc.).
    -   [ ] Ensure automated deployment of Frontend and Supabase Edge Functions/Database migrations.
-   **6.3. Setup Monitoring, Logging, and Alerting:**
    -   [ ] Integrate application monitoring (e.g., Sentry) to track errors and performance.
    -   [ ] Configure logging for backend processes and integrations.
    -   [ ] Set up alerts for critical errors, performance issues, or API integration failures.
-   **6.4. Implement API Key Management:**
    -   [ ] Ensure secure storage and retrieval of all third-party API keys in the production environment.
-   **6.5. Plan Backup and Recovery:**
    -   [ ] Verify Supabase backup strategy is in place and understood.
-   **6.6. Plan Scaling Strategy (Planned):**
    -   [ ] Outline how the application will scale to handle increased user load and appraisal volume (e.g., reviewing Supabase compute add-ons, optimizing queries, considering serverless function scaling).

## Phase 7. Documentation & Help

Focus: Providing resources for users and future developers.

-   **7.1. Create User Documentation:**
    -   [ ] Develop help articles or guides for using the Agent Portal and Customer Portal.
    -   [ ] Build content for the "Help/Support Link" (Common Navigation).
    -   [ ] Include FAQs and troubleshooting steps.
-   **7.2. Create Developer Documentation:**
    -   [ ] Document the database schema, API endpoints, integration details, and core logic flows.
    -   [ ] Explain the setup and deployment process.

## Recent Accomplishments

### Team Management
- Implemented comprehensive team management functionality
- Created team service with CRUD operations
- Developed team list and detail components
- Added team member management with role assignment
- Implemented team creation and editing forms
- Added routes for team management

### User Profile Management
- Implemented user profile management functionality
- Created profile service for fetching and updating user data
- Developed user profile component with editing capabilities
- Added avatar upload functionality
- Implemented profile page with proper routing

### Appraisal Management
- Implemented appraisal feed for agents to browse and claim leads
- Created appraisal service with functions for fetching, claiming, and managing appraisals
- Developed appraisal request form for customers
- Added proper routing for appraisal-related pages
- Implemented mock data for development and testing
- Created detailed appraisal view for agents to see comprehensive information and complete appraisals
- Added functionality for agents to mark appraisals as completed with final values and notes

### Dashboard Analytics & Visualization
- Implemented real-time dashboard metrics fetching for agents
- Added bar chart visualization of appraisals completed per month using Recharts
- Enhanced dashboard quick access buttons and links

## Next Steps

1. Implement dashboard analytics with charts and visualizations
2. Develop integration management components
3. Create appraisal status tracking and reporting
4. Implement market analysis features
5. Set up testing infrastructure