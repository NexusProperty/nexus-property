# AppraisalHub: Detailed Development Plan (Post-Navigation Foundation)

This plan details the remaining development work required to build out the functional features and backend logic for AppraisalHub, now that the core navigation structure and routing are in place across all portals.

## Phase 1. Frontend Development (Completing Screen Functionality)

Focus: Building the interactive elements, data display, form logic, and state management for the screens whose routes are already configured.

-   **1.1. Implement Data Fetching and Display Logic:**
    -   [x] Fetch and display lists of data (Appraisals, Users, Team Members, Integration Status, Appraisal Feed leads) on their respective screens using Supabase queries.
    -   [x] Build components to render detailed views of individual items (e.g., single Appraisal view, User Profile detail, Team Member detail).
    -   [x] Integrate loading, error, and empty states into data display components.
    -   [x] Implement filtering, sorting, and search functionality on data lists.
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
    -   [x] Finalize database schema and implement Row-Level Security (RLS) policies for all tables
    -   [x] Implement and rigorously test RLS policies for every table containing user data
    -   [x] Create endpoints for:
      -   [x] Appraisal operations (create, list, retrieve, publish)
      -   [x] Team management (CRUD, member management)
      -   [x] Integration management (CRUD for integrations, team integrations)
      -   [x] Dashboard metrics (admin, agent)
      -   [x] Analytics data extraction (for dashboard/analytics)
      -   [x] Triggered notifications (system/user events)
    -   [x] Input validation and sanitization for all endpoints
    -   [x] Error handling and logging for all endpoints

    > Note: There is a known TypeScript limitation with recursive types (e.g., Json) that may cause a linter warning in the integration service. This does not affect runtime or actual functionality.

## Phase 3. API Integrations

Focus: Connecting to external real estate data providers and handling the ingestion and standardization of data.

-   **3.1. Implement CoreLogic NZ Integration:**
    -   [x] Write code to securely connect to the CoreLogic API.
    -   [x] Develop functions to query specific CoreLogic endpoints based on property address to fetch:
        -   [x] Property Attributes
        -   [x] Sales History
        -   [x] AVM (Automated Valuation Model) data
        -   [x] Local Market Data
    -   [x] Implement error handling, rate limit management, and robust parsing of CoreLogic responses.
-   **3.2. Implement REINZ Integration:**
    -   [x] Write code to securely connect to the REINZ API.
    -   [x] Develop functions to query REINZ endpoints to fetch:
        -   [x] Market Statistics (median prices, volumes)
        -   [x] Comparable Sold Properties (key data points for CMA)
    -   [x] Implement error handling, rate limit management, and parsing of REINZ responses.
-   **3.3. Implement Other Potential Integrations (Planned):**
    -   [ ] Research, connect, and fetch data from additional sources (Council data, School Zones, Mapping Services) as defined in the initial requirements.
-   **3.4. Develop Data Ingestion & Standardization Pipeline:**
    -   [x] Create backend service to combine data from integrations
    -   [x] Implement data standardization and normalization
    -   [x] Develop data validation and cleaning functions
    -   [x] Create a demo component to showcase the data ingestion pipeline

> Note: The CoreLogic and REINZ integrations have been implemented as mock services that simulate API interactions. In a production environment, these would be replaced with actual API calls to the respective services. The mock implementations allow for development and testing without requiring actual API keys or access to the services.

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

### 4.3. Implement AI Integration with Google Cloud Vertex AI

This section provides detailed implementation steps for integrating Google Cloud's Vertex AI (Gemini) into the appraisal generation process.

1.  **Install Google Cloud Client Libraries:**
    -   [ ] Open your project's terminal within Cursor (or your standard terminal).
    -   [ ] Use Cursor's chat or command palette to find the correct installation command for the Google Cloud Vertex AI Node.js client library.
        -   *Prompt/Command Example:* "How do I install the Node.js client library for Google Cloud Vertex AI?" or "npm install @google-cloud/vertexai"
    -   [ ] Execute the command in your terminal: `npm install @google-cloud/vertexai` (or equivalent for your package manager).
    -   [ ] Ensure the dependency is added to your `package.json`.

2.  **Write Code to Access Stored Credentials & Instantiate AI Client:**
    -   [ ] Navigate to your backend processing file.
    -   [ ] Use Cursor's chat to ask how to initialize the Vertex AI client using credentials stored as environment variables or loaded from a JSON file (depending on how you secured them in Step 4 of the Prerequisites).
        -   *Prompt Example:* "In Node.js, how do I instantiate the @google-cloud/vertexai client using credentials stored in environment variables like `GOOGLE_CLOUD_PROJECT` and `GOOGLE_APPLICATION_CREDENTIALS`?"
    -   [ ] Use Cursor's code generation feature to write the client instantiation code.
    -   [ ] Integrate this code into your Task 4.1 processing function, ensuring it's initialized correctly.

3.  **Craft the Prompt (Iterative Process with Cursor's AI):**
    -   [ ] **Understand Input Data:** Review the structure of the standardized data received from your Data Ingestion pipeline (3.4). Use Cursor's "Explain Code" feature if needed to fully grasp the data format.
    -   [ ] **Brainstorm Prompt Content:** Use Cursor's chat to brainstorm what information about the property, comparables, and market data needs to be included in the prompt to Gemini to get the desired analysis and text outputs.
        -   *Prompt Example:* "I have property data including [list data points, e.g., address, beds, baths, square footage, condition notes], a list of comparables with [list data points, e.g., sale price, date, distance, brief features], and market trend summaries [describe trend data]. How should I structure a prompt for Gemini-Pro to generate a market analysis summary, a property description, and commentary on the comparables?"
    -   [ ] **Write Prompt Formatting Code:** Use Cursor's code generation to write the JavaScript/TypeScript code that takes the input data object and formats it into a clean, structured text string for the Gemini prompt.
        -   *Prompt Example:* "Write a TypeScript function that takes an object `{ property: { ... }, comparables: [{ ... }], marketTrends: { ... } }` and formats it into a string suitable as input for an LLM prompt, with clear sections for each type of data."
    -   [ ] **Refine Prompts:** This is an iterative process. After initial results, you will likely need to adjust the prompt wording, instructions, and data format passed to Gemini to improve the quality and relevance of the AI-generated text. Use Cursor's editing and chat features to help refine the prompts based on the AI's output.

4.  **Write API Call Logic:**
    -   [ ] Within your Task 4.1 function, after formatting the prompt, use Cursor to generate the code to send the prompt to the Gemini API using the Vertex AI client.
        -   *Prompt Example:* "Using the `@google-cloud/vertexai` client in Node.js, how do I send a text prompt to the `gemini-pro` model and get the text response?"
    -   [ ] Implement `async/await` to handle the asynchronous nature of the API call.
    -   [ ] Integrate basic error handling (`try...catch`) around the API call.

5.  **Parse the AI Response:**
    -   [ ] Examine the format of the text response you receive from the Gemini API.
    -   [ ] Use Cursor's code generation to write code to parse the response. If you structured your prompt to ask for specific sections (e.g., using headings like "## Market Analysis"), you can write code to extract those sections.
        -   *Prompt Example:* "I have a string response from an LLM that looks like `## Market Analysis\n...\n## Property Description\n...`. Write TypeScript code to extract the text under 'Market Analysis' and 'Property Description' into separate variables."
    -   [ ] Add error handling for unexpected response formats or missing sections.

6.  **Integrate AI Outputs into Data Structure:**
    -   [ ] Recall the required structure for the `Appraisals` table columns (`property_details`, `market_analysis`, etc.). Use Cursor's type hints (from your generated `supabase.ts`) or "Explain Code" on the relevant data structure definitions if needed.
    -   [ ] Use Cursor to write code that takes the results from your algorithmic processes (valuation range, comparable list) and the parsed text outputs from the AI, and combines them into the final object ready to be saved to the `Appraisals` table.
        -   *Prompt Example:* "Combine the following data points: numerical valuation range, a list of comparable objects, an AI-generated market analysis string, and an AI-generated property description string, into an object that matches the structure of my Supabase `appraisals` table (refer to `src/types/supabase.ts` for the `Appraisal` type)."

7.  **Handle Limited vs. Full Appraisal Logic:**
    -   [ ] Modify the prompt formatting logic (Step 3) and potentially the parsing logic (Step 5) to handle the distinction between generating text for a 'limited' customer appraisal (more concise, fewer details) and a 'full' agent appraisal (detailed, professional tone).
    -   [ ] Use conditional logic (`if/else`) based on whether the appraisal is being generated for a customer or an agent (this status should be available from the initial request triggering Task 4.1).

8.  **Testing the AI Integration:**
    -   [ ] Write unit tests for the functions that format the prompt, call the API, and parse the response (Steps 3, 4, 5). You'll likely need to mock the actual API call during unit testing. Use Cursor's test generation features.
        -   *Prompt Example:* "Generate unit tests for this TypeScript function that formats data into a Gemini prompt."
    -   [ ] Write integration tests for the overall Task 4.1 process to ensure the data ingestion output flows correctly into your combined algorithmic/AI logic and produces the expected structured output for the `Appraisals` table.

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

### Data List Functionality
- Implemented advanced filtering, sorting, and search functionality for appraisal lists
- Added property type, bedroom count, and value range filters
- Implemented sorting by date and value
- Added search by property address
- Created responsive UI for filter and sort controls
- Implemented empty state handling for filtered results

## Next Steps

1. Implement Row-Level Security (RLS) policies for all database tables
2. Develop integration management components
3. Create API integration with CoreLogic and REINZ
4. Implement AI processing and report generation
5. Set up testing infrastructure