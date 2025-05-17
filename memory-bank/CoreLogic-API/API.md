Okay, looking at these CoreLogic NZ API documentation screenshots, we can start planning and even stubbing out the API integration for your AppraisalHub project, even without live sandbox credentials yet.

The key is to understand which API products and specific endpoints will be most relevant to your core functionality: *AI-Powered Market Appraisals*.

**Primary Goals for CoreLogic Integration (based on your project description):**

1.  **Address Validation/Suggestion:** When a user inputs an address, you need to validate it and get a canonical `propertyId`.
2.  **Property Attributes:** Fetch detailed characteristics of the property (land area, floor area, beds/baths, year built, materials, etc.).
3.  **Sales History:** Get previous sale prices and dates.
4.  **Estimated Value Ranges (AVMs):** Obtain CoreLogic's automated valuation.
5.  **Local Market Trends/Statistics:** (May or may not be directly available through these specific "products" but important to note).
6.  **Property Images:** (Nice to have for reports).

**Analysis of Provided CoreLogic API "Products":**

Let's analyze which of the shown API products and their endpoints are most likely to be useful:

1.  **"Cordell Sum Sure" (Insurance Rebuild Cost):**
    *   **Property Attributes Service (`GET /sumsure/nz/products/8/property/{propertyId}`):** This seems to provide property attributes. While geared towards insurance rebuild, it might contain a lot of the core attributes you need.
    *   **NZ Extra Attributes Service (`GET /insurance/nz/properties/{propertyId}/insurance/extra`):** Might offer more detailed attributes.
    *   **Calculate Estimate Service:** *Likely NOT relevant* for your market appraisal, as this is for rebuild cost, not market value.
    *   **Property Image:** Useful.
    *   **Conclusion:** The attribute services and image service are potentially useful.

2.  **"Renovation Calculator" & "Form Pre-population":** These share many common endpoints.
    *   **`suggestion v2` (`GET /property/nz/v2/suggest.json`):** **Highly Relevant.** This is likely an address suggestion/autocomplete service.
    *   **`Address Matcher Service` (`GET /search/nz/matcher/address`):** **Highly Relevant.** This will take a user-input address and return a validated address with a `propertyId`.
    *   **`property-details-location` (`GET /property-details/nz/properties/{propertyId}/location`):** Useful for geo-data, map display.
    *   **`property-details-attributes/core` (`GET /property-details/nz/properties/{propertyId}/attributes/core`):** **Highly Relevant.** This is very likely a primary source for core property attributes.
    *   **`property-details-attributes/additional` (`GET /property-details/nz/properties/{propertyId}/attributes/additional`):** **Highly Relevant.** For more detailed attributes.
    *   **`property-details-images/default` (`GET /property-details/nz/properties/{propertyId}/images/default`):** **Highly Relevant.** For property images.
    *   **`Legal Content`:** May be useful for disclaimers in reports, but not core to valuation.
    *   **Conclusion:** These look like the **most promising set of APIs** for getting address validation, core attributes, and images.

3.  **"PSX APIs" (Property Services eXchange - for loan origination):**
    *   This seems geared towards ordering and managing formal valuations within a lender's workflow.
    *   Endpoints like `/channels/.../expandedSearch`, `/channels/.../valex/find`, `/channels/.../orders` suggest a more complex workflow than simply fetching property data.
    *   **Conclusion:** *Likely NOT directly relevant* for your initial data fetching needs for an automated appraisal, unless you plan to integrate with formal valuation ordering systems later.

4.  **"Equity Calculation or Property Reports for Engagement":**
    *   Shares many endpoints with "Renovation Calculator" (suggestion, address matcher, attributes, images).
    *   **`statistics/v1/statistics.json` (POST):** **Potentially Relevant.** Could provide time-series market statistics. The method is POST, so you'd need to understand the request body.
    *   **`statistics/census` (POST & GET):** **Potentially Relevant.** For demographic/census data, which can influence market analysis.
    *   **`charts/v2/chart.png` & `/charts/census`:** **Potentially Relevant.** Could provide pre-rendered charts for market trends.
    *   **`Current Consumer AVM Service` (`GET /avm/nz/properties/{propertyId}/avm/intellival/consumer/band/current` & `/avm/nz/properties/{propertyId}/avm/intellival/consumer/current`):** **CRITICALLY RELEVANT.** This directly provides CoreLogic's AVM.
    *   **Conclusion:** The AVM service is critical. Statistics and charts are also very interesting.

5.  **"RP Inside" (for CRM integration):**
    *   Seems to provide a broad set of data points, many overlapping with "Renovation Calculator" and "Equity Calculation."
    *   **`property-details-sales` (`GET /property-details/nz/properties/{propertyId}/sales` & `/sales/last`):** **CRITICALLY RELEVANT.** For sales history.
    *   **`property-details-site`:** For site-specific details.
    *   **`property-details-features`:** More specific features.
    *   **`property-details-otm/campaign/sales` & `/rent`:** "On The Market" data for current sales/rent listings. Could be useful for CMA context if REINZ doesn't cover it sufficiently.
    *   **`Search by Radius Service` (various endpoints):** **Potentially Relevant.** For finding comparable properties if you need to implement your own CMA search logic beyond what REINZ provides.
    *   **`Property Search - Last Sale` & `Property Search - OTM For Sale` (various endpoints):** Similar to radius search, but by locality, postcode, street.
    *   **`property-report-controller` (POST):** Could generate pre-defined CoreLogic reports. Might be useful as a supplementary output or if your own report generation is complex initially.
    *   **Conclusion:** Sales history and AVM (from "Equity Calculation") are key. OTM and search services could be backups or enhancements to REINZ data.

6.  **"What's Your Property Worth NZ":**
    *   Appears to be another consumer-facing product packaging, sharing many of the same underlying data endpoints (suggestion, address matcher, attributes, images, statistics, AVM, reports).
    *   **Conclusion:** Reinforces the importance of the common underlying services like Address Matcher, Property Details, AVM, and Statistics.

**Proposed Plan to Build the API Integration for CoreLogic NZ:**

Based on this analysis, here's how you can start structuring the CoreLogic integration in your `AppraisalHub` backend (likely within Supabase Edge Functions or a dedicated backend service):

**Phase 1: Setup & Authentication Stub (Before Credentials)**

1.  **[ ] Create a CoreLogic Service Module:**
    *   In your backend codebase, create a dedicated directory/module for CoreLogic integration (e.g., `src/services/corelogic/`).
    *   Create a central `corelogic.service.ts` (or similar) file.
2.  **[ ] Define Base URL and Configuration:**
    *   In a configuration file or environment variables, define the CoreLogic API Sandbox base URL: `https://api-uat.corelogic.asia` or `https://api-sbox.corelogic.asia` (use the one most consistently shown or the one you expect to get credentials for).
    *   Prepare placeholders for API keys/secrets in your environment variable setup (e.g., `CORELOGIC_API_KEY`, `CORELOGIC_API_SECRET`).
3.  **[ ] Implement an API Client/Wrapper:**
    *   Write a small, reusable function or class to handle making HTTP requests to the CoreLogic API.
    *   This wrapper should:
        *   Accept the endpoint path and request parameters.
        *   Construct the full URL.
        *   **Stub out the authentication header logic.** For now, it might just log a message "Authentication to be implemented" or pass dummy headers. Later, you'll populate this with actual OAuth tokens or API key headers once you know the mechanism.
        *   Use an HTTP client library (e.g., `axios`, `node-fetch`, or Supabase's built-in fetch).
        *   Include basic error handling (network errors, non-2xx responses).

**Phase 2: Implementing Key Endpoint Functions (Stubbed)**

For each critical piece of data you need, create a dedicated function. Initially, these functions will just define the expected parameters and log what they *would* do.

4.  **[ ] Implement `suggestAddress(query: string)` Function:**
    *   **Purpose:** To get address suggestions as the user types.
    *   **CoreLogic Endpoint:** `GET /property/nz/v2/suggest.json` (from "Renovation Calculator," "Form Pre-population," etc.)
    *   **Action:**
        *   Takes a search `query` string.
        *   Constructs the request to the `/suggest.json` endpoint (e.g., with `q=query` parameter).
        *   Calls your API client wrapper.
        *   *Stub:* Log the request it would make. Return a mock success response structure based on what you expect an address suggestion API to return (e.g., array of objects with `displayAddress` and `propertyId`).

5.  **[ ] Implement `matchAddress(addressDetails: object)` Function:**
    *   **Purpose:** To validate a full address and get its `propertyId`.
    *   **CoreLogic Endpoint:** `GET /search/nz/matcher/address` (from "Renovation Calculator," "Form Pre-population," etc.)
    *   **Action:**
        *   Takes an object of `addressDetails` (e.g., street, suburb, postcode).
        *   Constructs the request to the `/matcher/address` endpoint with appropriate query parameters.
        *   Calls your API client wrapper.
        *   *Stub:* Log the request. Return a mock success response with a `propertyId` and validated address components.

6.  **[ ] Implement `getPropertyAttributes(propertyId: string)` Function:**
    *   **Purpose:** To get core and additional property attributes.
    *   **CoreLogic Endpoints:**
        *   `GET /property-details/nz/properties/{propertyId}/attributes/core`
        *   `GET /property-details/nz/properties/{propertyId}/attributes/additional`
        *   (Potentially also: `GET /sumsure/nz/products/8/property/{propertyId}` from Cordell Sum Sure if the above are insufficient or provide different details)
    *   **Action:**
        *   Takes a `propertyId`.
        *   Makes one or more calls to the relevant attribute endpoints using your API client wrapper.
        *   Combines the results if multiple calls are made.
        *   *Stub:* Log the requests. Return a mock object representing comprehensive property attributes (land area, floor area, beds, baths, year built, construction materials, etc.). Define a clear TypeScript interface for this combined attribute object.

7.  **[ ] Implement `getPropertySalesHistory(propertyId: string)` Function:**
    *   **Purpose:** To get past sales data.
    *   **CoreLogic Endpoint:** `GET /property-details/nz/properties/{propertyId}/sales` (from "RP Inside")
    *   **Action:**
        *   Takes a `propertyId`.
        *   Calls the `/sales` endpoint.
        *   *Stub:* Log the request. Return a mock array of sale objects (each with date, price, etc.).

8.  **[ ] Implement `getPropertyAVM(propertyId: string)` Function:**
    *   **Purpose:** To get CoreLogic's Automated Valuation Model estimate.
    *   **CoreLogic Endpoint:** `GET /avm/nz/properties/{propertyId}/avm/intellival/consumer/current` (and potentially `/band/current`) (from "Equity Calculation")
    *   **Action:**
        *   Takes a `propertyId`.
        *   Calls the AVM endpoint(s).
        *   *Stub:* Log the request. Return a mock AVM response (e.g., value range, confidence score, date).

9.  **[ ] Implement `getPropertyImage(propertyId: string)` Function:**
    *   **Purpose:** To get a default property image.
    *   **CoreLogic Endpoint:** `GET /property-details/nz/properties/{propertyId}/images/default`
    *   **Action:**
        *   Takes a `propertyId`.
        *   Calls the image endpoint.
        *   *Stub:* Log the request. Return a mock image URL or a placeholder.

10. **[ ] Implement `getMarketStatistics(params: object)` Function (More Exploratory):**
    *   **Purpose:** To get local market statistics.
    *   **CoreLogic Endpoints:**
        *   `POST /statistics/v1/statistics.json`
        *   `POST /statistics/census`
        *   `GET /statistics/census/summary`
    *   **Action:**
        *   This is more complex as some are POST requests requiring a specific body.
        *   Define what `params` might be needed (e.g., location, date range, data type).
        *   *Stub:* Log the request. Define what kind of statistical data structure you'd expect back. This will require more research once you have sandbox access to understand the request/response schemas for these POST endpoints.

**Phase 3: Data Modeling & Type Definitions**

11. **[ ] Define TypeScript Interfaces/Types:**
    *   For each mock response you defined in Phase 2, create corresponding TypeScript interfaces (e.g., `CoreLogicAddressSuggestion`, `CoreLogicMatchedAddress`, `CoreLogicPropertyAttributes`, `CoreLogicSaleRecord`, `CoreLogicAVMResponse`, `CoreLogicMarketStats`).
    *   Store these in a `types.ts` file within your `corelogic` service module. This will greatly help when you start processing real data.

**Phase 4: Integration into Main Appraisal Workflow (Stubbed)**

12. **[ ] Modify `Data Ingestion Pipeline` (Task 3.4 of your main plan):**
    *   In your main data ingestion logic, add calls to these newly created (but still stubbed) CoreLogic service functions.
    *   For example, after a user enters an address:
        1.  Call `suggestAddress` (if implementing autocomplete).
        2.  Call `matchAddress` to get the `propertyId`.
        3.  If `propertyId` is found, call `getPropertyAttributes`, `getPropertySalesHistory`, `getPropertyAVM`, etc.
        4.  Log the (mock) data received from these stubbed functions.
        5.  Pass this (mock) combined data to your AI Processing step (Task 4.1).

**Phase 5: Activation (When Credentials are Available)**

13. **[ ] Implement Real Authentication:**
    *   Once you have sandbox credentials and understand the authentication mechanism (e.g., OAuth 2.0 client credentials flow, API key in header), update your API client wrapper (from step 3) to handle real authentication. This might involve fetching an access token and including it in subsequent requests.
14. **[ ] Test with Sandbox Endpoints:**
    *   Remove the mock return statements from your service functions (steps 4-10).
    *   Make actual API calls to the CoreLogic sandbox.
    *   `console.log` the *actual* responses extensively.
15. **[ ] Refine Data Parsing and TypeScript Types:**
    *   Compare the actual API responses to your TypeScript interfaces. Adjust your interfaces to accurately reflect the real data structure.
    *   Implement robust parsing of the real API responses.
16. **[ ] Implement Full Error Handling:**
    *   Based on real sandbox responses, implement more specific error handling for different CoreLogic API error codes or scenarios.

**Benefits of this Approach:**

*   **Progress without Blockers:** You can build a significant portion of the integration logic and structure before getting API access.
*   **Clear Interface Definition:** You define what data you expect from CoreLogic, making it easier to integrate when live data flows.
*   **Parallel Development:** Frontend teams can start building UI based on the expected (mocked) data structures originating from these stubbed services.
*   **Easier Debugging:** When you get credentials, you're only focusing on the authentication and the actual data flow, not building the entire structure from scratch.

This structured approach will allow you to make substantial progress. Remember to consult the CoreLogic Developer Portal documentation frequently (once you have full access to it beyond these screenshots) for detailed request/response schemas, authentication guides, and rate limits.