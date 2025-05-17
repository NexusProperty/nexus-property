# CoreLogic API Integration Implementation Plan

## Overview

This document outlines the plan for integrating the CoreLogic NZ API into the Nexus Property platform to provide accurate property data, valuations, and market insights for our automated appraisal system. Our goal is to replace the current mock data with real CoreLogic data while maintaining the existing application structure.

## Goals

1. Implement CoreLogic API integration to fetch real property data including:
   - Address validation/suggestion
   - Property attributes and details
   - Sales history and comparable properties
   - Automated valuation model (AVM) estimates
   - Market statistics and trends
   - Property images

2. Maintain backward compatibility with the existing application interfaces.
3. Ensure robust error handling and fallback mechanisms.
4. Create comprehensive documentation for the integration.

## Implementation Approach

### Phase 1: Setup & Development (Weeks 1-2)

#### Tasks:

1. **Create CoreLogic Service Module Structure**
   - Establish dedicated module for CoreLogic API integration
   - Define TypeScript interfaces for API requests/responses
   - Implement authentication mechanism for CoreLogic API

2. **Implement Core API Methods**
   - Address Suggestion/Validation: `suggestAddress()`, `matchAddress()`
   - Property Details: `getPropertyAttributes()`
   - Sales History: `getPropertySalesHistory()`
   - Valuation: `getPropertyAVM()`
   - Market Data: `getMarketStatistics()`
   - Property Images: `getPropertyImage()`

3. **Create Data Transformation Layer**
   - Develop conversion functions between CoreLogic data format and our application format
   - Implement helper utilities for data processing and enrichment

4. **Stub Implementation for Development**
   - Create mock responses based on CoreLogic API documentation
   - Enable development without live API access
   - Add toggles to switch between mock and real API

### Phase 2: Integration & Testing (Weeks 3-4)

#### Tasks:

1. **Update Existing Edge Functions**
   - Modify `property-data` function to use CoreLogic API client
   - Implement proper error handling and logging
   - Add caching mechanism for improved performance

2. **Implement Sandbox Integration**
   - Configure sandbox environment variables
   - Test API endpoints with sandbox credentials
   - Refine implementation based on actual API responses

3. **Comprehensive Testing**
   - Unit tests for CoreLogic service methods
   - Integration tests for Edge Functions
   - End-to-end testing with frontend components
   - Test cases for error scenarios and edge cases

4. **Performance Optimization**
   - Implement request batching where applicable
   - Add caching for frequently accessed data
   - Optimize data transformation for speed

### Phase 3: Deployment & Monitoring (Week 5)

#### Tasks:

1. **Finalize Production Configuration**
   - Set up production API credentials
   - Configure monitoring and alerting
   - Implement rate limiting and quota management

2. **Gradual Rollout**
   - Deploy to staging environment
   - Implement feature flags for controlled rollout
   - Monitor performance and error rates

3. **Documentation & Knowledge Transfer**
   - Update technical documentation
   - Create troubleshooting guide
   - Document API usage patterns and limitations

4. **Establish Ongoing Maintenance Plan**
   - Define process for API version updates
   - Create plan for handling API outages
   - Schedule regular review of API usage and costs

## Technical Architecture

### Core Components:

1. **CoreLogic API Client (`corelogic-service.ts`)**
   ```typescript
   export class CoreLogicApiClient {
     // Authentication methods
     private async getAuthToken(): Promise<string>
     
     // Core API methods
     async suggestAddress(query: string): Promise<CoreLogicAddressSuggestion[]>
     async matchAddress(address: string, suburb: string, city: string): Promise<CoreLogicMatchedAddress>
     async getPropertyAttributes(propertyId: string): Promise<CoreLogicPropertyAttributes>
     async getPropertySalesHistory(propertyId: string): Promise<CoreLogicSaleRecord[]>
     async getPropertyAVM(propertyId: string): Promise<CoreLogicAVMResponse>
     async getPropertyImage(propertyId: string): Promise<CoreLogicImageResponse>
     async getMarketStatistics(params: CoreLogicMarketStatsParams): Promise<CoreLogicMarketStats>
   }
   ```

2. **Type Definitions (`corelogic-types.ts`)**
   - Comprehensive TypeScript interfaces for all API requests and responses
   - Mapping to our application's data models

3. **Data Transformers (`corelogic-transformers.ts`)**
   - Conversion functions between CoreLogic and Nexus Property data formats
   - Utilities for data enrichment and processing

4. **Updated Edge Function (`property-data/index.ts`)**
   - Leverages CoreLogic service to fetch real property data
   - Maintains existing request/response interface for backward compatibility

### Environment Configuration:

```
CORELOGIC_API_URL=https://api-uat.corelogic.asia
CORELOGIC_API_KEY=your-api-key
CORELOGIC_API_SECRET=your-api-secret
CORELOGIC_USE_MOCK=false  # Toggle for development/testing
```

## Critical API Endpoints

Based on the CoreLogic documentation, we will focus on these key endpoints:

1. **Address Suggestion/Validation**
   - `GET /property/nz/v2/suggest.json`
   - `GET /search/nz/matcher/address`

2. **Property Details**
   - `GET /property-details/nz/properties/{propertyId}/attributes/core`
   - `GET /property-details/nz/properties/{propertyId}/attributes/additional`

3. **Property Sales**
   - `GET /property-details/nz/properties/{propertyId}/sales`

4. **Automated Valuation**
   - `GET /avm/nz/properties/{propertyId}/avm/intellival/consumer/current`

5. **Market Statistics**
   - `POST /statistics/v1/statistics.json`

6. **Property Images**
   - `GET /property-details/nz/properties/{propertyId}/images/default`

## Risk Management

1. **API Availability**
   - Implement circuit breakers to handle API outages
   - Create fallback to cached data or mock data during disruptions

2. **Data Quality**
   - Validate API responses against expected schema
   - Add data quality checks before using in valuations

3. **Cost Management**
   - Monitor API usage and costs
   - Implement caching to reduce unnecessary API calls

4. **Performance**
   - Add timeouts for API requests
   - Implement performance monitoring

## Success Criteria

1. Successful integration with CoreLogic API
2. All property data comes from CoreLogic instead of mock data
3. Maintain or improve response times compared to mock implementation
4. Zero regression in existing functionality
5. Comprehensive test coverage for new code

## Dependencies

1. CoreLogic API credentials
2. Access to CoreLogic API documentation
3. Development and testing environments
4. Authorization to implement Edge Function changes

## Timeline

**Total Duration: 5 weeks**

- Phase 1 (Setup & Development): Weeks 1-2
- Phase 2 (Integration & Testing): Weeks 3-4
- Phase 3 (Deployment & Monitoring): Week 5

## Next Steps

1. Request CoreLogic API sandbox credentials
2. Create detailed task assignments and timelines
3. Set up development environment for CoreLogic integration
4. Begin implementation of CoreLogic service module
