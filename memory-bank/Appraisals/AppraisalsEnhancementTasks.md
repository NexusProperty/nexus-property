# Appraisal Generation System Enhancement Tasks

**Last Updated**: 2025-05-20
**Priority**: High
**Estimated Timeline**: 3-4 Weeks

## Overview
This task list outlines the steps required to enhance the appraisal generation system with CoreLogic integration, improved reporting capabilities, and agency branding features. The enhancements will result in more detailed, visually appealing, and branded appraisal reports.

## Task Breakdown

### Phase 1: Database Schema Modifications

#### Task 1.1: Update Appraisals Table Schema
- [x] Add `corelogic_property_id TEXT` field
- [x] Add AI-generated text fields:
  - [x] `ai_market_overview TEXT`
  - [x] `ai_property_description TEXT`
  - [x] `ai_comparable_analysis_text TEXT`
- [x] Add CoreLogic data fields:
  - [x] `corelogic_avm_estimate NUMERIC`
  - [x] `corelogic_avm_range_low NUMERIC`
  - [x] `corelogic_avm_range_high NUMERIC`
  - [x] `corelogic_avm_confidence TEXT`
  - [x] `reinz_avm_estimate NUMERIC`
  - [x] `property_activity_summary JSONB`
  - [x] `market_statistics_corelogic JSONB`
  - [x] `market_statistics_reinz JSONB`
- [x] Update `metadata` JSONB structure documentation

#### Task 1.2: Update Teams Table Schema
- [x] Add agency branding fields:
  - [x] `agency_logo_url TEXT`
  - [x] `agency_primary_color TEXT`
  - [x] `agency_disclaimer_text TEXT`
  - [x] `agency_contact_details TEXT`

#### Task 1.3: Update Profiles Table
- [x] Add or enhance agent fields:
  - [x] `agent_photo_url TEXT`
  - [x] `agent_license_number TEXT`
- [x] Verify contact info fields are comprehensive

#### Task 1.4: Update TypeScript Types
- [x] Run `supabase gen types typescript` command
- [x] Update type imports across the codebase

### Phase 2: Data Ingestion Enhancement

#### Task 2.1: Implement CoreLogic API Integration
- [x] Create Edge Function endpoint for CoreLogic
- [x] Implement API calls for:
  - [x] Property Attributes
  - [x] Sales History
  - [x] AVM (Automated Valuation Model)
  - [x] Property Images
  - [x] Market Statistics
  - [x] Activity Summary
  - [x] Title Details
  - [x] Comparables
- [x] Create data transformation utilities

#### Task 2.2: Implement REINZ API Integration
- [x] Create Edge Function endpoint for REINZ
- [x] Implement API calls for:
  - [x] Comparable properties
  - [x] Market statistics
  - [x] Active listings
- [x] Create data transformation utilities

#### Task 2.3: Create Data Orchestrator
- [x] Create `data-ingestion-orchestrator` Edge Function
- [x] Implement logic to fetch data from both sources
- [x] Create data consolidation strategies
- [x] Update database with fetched data

### Phase 3: Valuation Algorithm Enhancement

#### Task 3.1: Update Property Valuation Algorithm
- [x] Modify `calculateValuation` function
- [x] Update outlier detection
- [x] Enhance price adjustment calculations
- [x] Implement improved confidence scoring

#### Task 3.2: Enhance AI Integration
- [x] Create dedicated module for AI prompt engineering
- [x] Develop prompts for:
  - [x] Market overview
  - [x] Property description
  - [x] Comparable analysis
- [x] Store AI-generated content in database

### Phase 4: Report Generation Enhancement

#### Task 4.1: Select PDF Generation Strategy
- [ ] Evaluate Puppeteer/Playwright vs pdfMake
- [ ] Set up selected library in Edge Function
- [ ] Create test templates

#### Task 4.2: Implement Branding Integration
- [ ] Create function to retrieve branding data
- [ ] Implement fallback branding
- [ ] Add branding elements to report templates

#### Task 4.3: Enhance Report Template Design
- [ ] Create wireframes for report layout
- [ ] Implement new sections for CoreLogic and AI content
- [ ] Design data visualizations for market trends
- [ ] Implement consistent styling with branding

#### Task 4.4: Update Report Generation Edge Function
- [ ] Update data aggregation for new fields
- [ ] Implement template rendering with new design
- [ ] Add support for agent/agency branding
- [ ] Optimize image handling

### Phase 5: Frontend Updates

#### Task 5.1: Update Team Management UI
- [ ] Create logo upload component
- [ ] Add color picker for brand color
- [ ] Create form for agency disclaimer text
- [ ] Implement save functionality

#### Task 5.2: Update Profile Management UI
- [ ] Add profile photo upload
- [ ] Create fields for license number and contact info
- [ ] Implement branding preview

#### Task 5.3: Update Appraisal Detail View
- [ ] Create UI components for CoreLogic AVM data
- [ ] Add sections for REINZ market data
- [ ] Update report preview

### Phase 6: Testing and Documentation

#### Task 6.1: Create Test Cases
- [ ] Write unit tests for data transformation
- [ ] Create integration tests for API integrations
- [ ] Develop end-to-end tests for report generation

#### Task 6.2: Update Documentation
- [ ] Document database schema changes
- [ ] Create API documentation
- [ ] Update user guide for branding features

#### Task 6.3: Performance Testing
- [ ] Measure report generation time
- [ ] Optimize data fetching
- [ ] Create loading indicators and progress feedback

## Implementation Sequence

1. **Database Updates** (Phase 1): Foundation for storing enhanced data
2. **Data Ingestion** (Phase 2): Fetch and store richer property data
3. **Valuation Algorithm** (Phase 3): Utilize new data sources
4. **Report Generation** (Phase 4): Create new design and generation process
5. **Frontend Updates** (Phase 5): Add UI for managing branding and viewing data
6. **Testing & Documentation** (Phase 6): Ensure quality and usability

## Dependencies

- CoreLogic API access and documentation
- REINZ API access and documentation
- Design mockups for new report templates
- Agency branding guidelines

## Tracking Progress

| Phase | Completed Tasks | Total Tasks | Progress |
|-------|----------------|-------------|----------|
| 1     | 15             | 15          | 100%     |
| 2     | 15             | 15          | 100%     |
| 3     | 8              | 8           | 100%     |
| 4     | 0              | 13          | 0%       |
| 5     | 0              | 10          | 0%       |
| 6     | 0              | 9           | 0%       |
| Total | 38             | 70          | 54%      |
