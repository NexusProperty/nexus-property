# AppraisalHub Database Schema Documentation

## Overview

This document provides a comprehensive description of the AppraisalHub database schema, including all tables, relationships, constraints, and Row Level Security (RLS) policies. This schema has been expanded to support the enhanced appraisal generation system with CoreLogic integration, improved reporting capabilities, and agency branding features.

## Tables

### 1. profiles

Stores user profile information, linked to Supabase Auth users.

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, REFERENCES auth.users(id) | User ID from Supabase Auth |
| email | TEXT | NOT NULL | User's email address |
| first_name | TEXT | | User's first name |
| last_name | TEXT | | User's last name |
| phone_number | TEXT | | User's phone number |
| role | TEXT | | User's role (agent, admin, customer) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |
| team_id | UUID | REFERENCES teams(id) | Reference to user's team |
| agent_photo_url | TEXT | | URL to agent's profile photo |
| agent_license_number | TEXT | | Agent's real estate license number |

### 2. teams

Stores information about real estate agencies or teams.

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique team identifier |
| name | TEXT | NOT NULL | Team name |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |
| owner_id | UUID | REFERENCES profiles(id) | Team owner/admin |
| subscription_tier | TEXT | DEFAULT 'basic' | Subscription level |
| subscription_status | TEXT | | Active, inactive, etc. |
| agency_logo_url | TEXT | | URL to agency logo |
| agency_primary_color | TEXT | | Primary brand color (hex code) |
| agency_disclaimer_text | TEXT | | Legal disclaimer for reports |
| agency_contact_details | TEXT | | Contact information for reports |

### 3. team_members

Junction table for many-to-many relationship between profiles and teams.

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique membership ID |
| team_id | UUID | NOT NULL, REFERENCES teams(id) | Team reference |
| profile_id | UUID | NOT NULL, REFERENCES profiles(id) | Profile reference |
| role | TEXT | NOT NULL, DEFAULT 'member' | Role within team (admin, member) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |

### 4. appraisals

Stores property appraisal data, including valuation results, AI-generated text, and CoreLogic data.

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique appraisal ID |
| user_id | UUID | NOT NULL, REFERENCES profiles(id) | User who created the appraisal |
| team_id | UUID | REFERENCES teams(id) | Team the appraisal belongs to |
| property_address | TEXT | NOT NULL | Full property address |
| property_suburb | TEXT | NOT NULL | Property suburb |
| property_city | TEXT | NOT NULL | Property city |
| property_type | TEXT | NOT NULL | Type of property (house, apartment, etc.) |
| bedrooms | INTEGER | | Number of bedrooms |
| bathrooms | INTEGER | | Number of bathrooms |
| land_size | NUMERIC | | Land size in square meters |
| floor_area | NUMERIC | | Floor area in square meters |
| year_built | INTEGER | | Year the property was built |
| valuation_low | NUMERIC | | Lower bound of valuation range |
| valuation_high | NUMERIC | | Upper bound of valuation range |
| valuation_confidence | TEXT | | Confidence level in valuation |
| status | TEXT | NOT NULL, DEFAULT 'pending' | Status of appraisal |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |
| metadata | JSONB | | Additional metadata |
| report_url | TEXT | | URL to generated PDF report |
| report_generated_at | TIMESTAMPTZ | | When report was generated |
| corelogic_property_id | TEXT | | CoreLogic property identifier |
| ai_market_overview | TEXT | | AI-generated market analysis |
| ai_property_description | TEXT | | AI-generated property description |
| ai_comparable_analysis_text | TEXT | | AI-generated comparables analysis |
| corelogic_avm_estimate | NUMERIC | | CoreLogic automated valuation estimate |
| corelogic_avm_range_low | NUMERIC | | CoreLogic AVM lower bound |
| corelogic_avm_range_high | NUMERIC | | CoreLogic AVM upper bound |
| corelogic_avm_confidence | TEXT | | Confidence score for CoreLogic AVM |
| reinz_avm_estimate | NUMERIC | | REINZ valuation estimate |
| property_activity_summary | JSONB | | Summary of property activity |
| market_statistics_corelogic | JSONB | | Market statistics from CoreLogic |
| market_statistics_reinz | JSONB | | Market statistics from REINZ |

### 5. comparable_properties

Stores data about comparable properties used in appraisals.

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique comparable ID |
| appraisal_id | UUID | NOT NULL, REFERENCES appraisals(id) | Reference to appraisal |
| address | TEXT | NOT NULL | Property address |
| suburb | TEXT | NOT NULL | Property suburb |
| city | TEXT | NOT NULL | Property city |
| property_type | TEXT | NOT NULL | Type of property |
| bedrooms | INTEGER | | Number of bedrooms |
| bathrooms | INTEGER | | Number of bathrooms |
| land_size | NUMERIC | | Land size in square meters |
| floor_area | NUMERIC | | Floor area in square meters |
| year_built | INTEGER | | Year property was built |
| sale_date | DATE | | Date property was sold |
| sale_price | NUMERIC | | Sale price |
| similarity_score | INTEGER | | How similar to subject property (0-100) |
| image_url | TEXT | | URL to property image |
| metadata | JSONB | | Additional metadata |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| source | TEXT | | Data source (CoreLogic, REINZ, manual) |

### 6. integrations

Stores team integration configurations for external APIs.

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique integration ID |
| team_id | UUID | NOT NULL, REFERENCES teams(id) | Team reference |
| provider | TEXT | NOT NULL | Integration provider name |
| config | JSONB | NOT NULL | Configuration details (encrypted) |
| active | BOOLEAN | NOT NULL, DEFAULT true | Whether integration is active |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record update timestamp |

## Row Level Security (RLS) Policies

### profiles Table

1. **profiles_owner_read**
   - USING: (auth.uid() = id)
   - Allows users to read their own profile

2. **profiles_owner_update**
   - USING: (auth.uid() = id)
   - WITH CHECK: (auth.uid() = id)
   - Allows users to update their own profile

3. **profiles_team_admin_read**
   - USING: (auth.uid() IN (SELECT profile_id FROM team_members WHERE team_id = profiles.team_id AND role = 'admin'))
   - Allows team admins to read profiles of team members

### teams Table

1. **teams_owner_full_access**
   - USING: (auth.uid() = owner_id)
   - WITH CHECK: (auth.uid() = owner_id)
   - Allows team owners full access to their team records

2. **teams_member_read**
   - USING: (auth.uid() IN (SELECT profile_id FROM team_members WHERE team_id = id))
   - Allows team members to read team data

### team_members Table

1. **team_members_own_read**
   - USING: (auth.uid() = profile_id)
   - Allows users to see their own team memberships

2. **team_members_admin_full_access**
   - USING: (auth.uid() IN (SELECT profile_id FROM team_members WHERE team_id = team_id AND role = 'admin'))
   - WITH CHECK: (auth.uid() IN (SELECT profile_id FROM team_members WHERE team_id = team_id AND role = 'admin'))
   - Allows team admins to manage team memberships

### appraisals Table

1. **appraisals_owner_full_access**
   - USING: (auth.uid() = user_id)
   - WITH CHECK: (auth.uid() = user_id)
   - Allows users full access to their own appraisals

2. **appraisals_team_read**
   - USING: (auth.uid() IN (SELECT profile_id FROM team_members WHERE team_id = appraisals.team_id))
   - Allows team members to read team appraisals

### comparable_properties Table

1. **comparable_properties_appraisal_owner_full_access**
   - USING: (auth.uid() IN (SELECT user_id FROM appraisals WHERE id = comparable_properties.appraisal_id))
   - WITH CHECK: (auth.uid() IN (SELECT user_id FROM appraisals WHERE id = comparable_properties.appraisal_id))
   - Allows appraisal owners full access to related comparable properties

2. **comparable_properties_team_read**
   - USING: (auth.uid() IN (SELECT profile_id FROM team_members WHERE team_id = (SELECT team_id FROM appraisals WHERE id = comparable_properties.appraisal_id)))
   - Allows team members to read team comparable properties

### integrations Table

1. **integrations_team_admin_full_access**
   - USING: (auth.uid() IN (SELECT profile_id FROM team_members WHERE team_id = integrations.team_id AND role = 'admin'))
   - WITH CHECK: (auth.uid() IN (SELECT profile_id FROM team_members WHERE team_id = integrations.team_id AND role = 'admin'))
   - Allows team admins to manage team integrations 
