
# AppraisalHub Navigation Plan

This document outlines the navigation structure for AppraisalHub, an AI-Powered Market Appraisals Platform designed for the real estate industry in New Zealand. The navigation is organized by user roles with distinct portals for each role.

## Overview

AppraisalHub serves three primary user groups:
- **Real Estate Agents**: Professional users who generate detailed appraisals and manage their team
- **Property Owners (Customers)**: Users seeking free initial property appraisals
- **Administrators**: System managers who oversee the platform operations

## Common Entry & Authentication Navigation

| Navigation Item | Purpose | Status |
|----------------|---------|--------|
| Login Screen | The primary gateway for all users | ✅ Completed |
| Forgot Password Screen | Password recovery process | ✅ Completed |
| Registration Screen | Account creation for new users | ✅ Completed |
| Help/Support Link | Access to support resources | ⏳ Pending |

## 1. Agent Portal Navigation

| Navigation Item | Purpose | Status |
|----------------|---------|--------|
| **Dashboard** | Overview of activity and metrics | ✅ Completed |
| **Appraisals** | Create and manage appraisal reports | ✅ Completed |
| **Team Management** | Manage team members and roles | ✅ Completed |
| **Integration Hub** | Manage third-party service connections | ✅ Completed |
| **Appraisal Feed (Leads)** | View customer-initiated appraisals | ✅ Completed |
| **Account Settings / Profile** | Manage personal details | ✅ Completed |
| **Logout** | Securely log out | ✅ Completed |

### Dashboard Sub-Navigation
- Key metrics display
- Recent activity
- Quick action buttons

### Appraisals Sub-Navigation
- Appraisals List View
- Create New Appraisal
- Appraisal Detail View (view/edit individual reports)

### Team Management Sub-Navigation
- Team Member List View
- Add New Team Member
- Team Member Detail/Edit

### Integration Hub Sub-Navigation
- Available integrations
- Configuration forms for each integration
- Integration status monitoring

## 2. Customer Portal Navigation

| Navigation Item | Purpose | Status |
|----------------|---------|--------|
| **Get Free Appraisal** | Initiate property appraisal process | ✅ Completed |
| **My Appraisals** | View previously generated appraisals | ✅ Completed |
| **Account Settings** | Manage personal profile details | ✅ Completed |
| **Logout** | Securely log out | ✅ Completed |

### Get Free Appraisal Sub-Navigation
- Address input form
- Property details confirmation
- Appraisal generation process

### My Appraisals Sub-Navigation
- Appraisal list view
- Limited Appraisal Report view

## 3. Admin Portal Navigation

| Navigation Item | Purpose | Status |
|----------------|---------|--------|
| **Dashboard / Overview** | System status and platform activity | ✅ Completed |
| **User Management** | Manage all user accounts | ✅ Completed |
| **System Monitoring** | Monitor API usage and system health | ✅ Completed |
| **Data Management** | Configure system-wide data settings | ✅ Completed |
| **Subscription / Billing** | Manage plans and payment information | ✅ Completed |
| **Content Management** | Edit static text content | ✅ Completed |
| **Analytics / Reporting** | View detailed usage reports | ✅ Completed |
| **Settings** | Configure system parameters | ✅ Completed |
| **Logout** | Securely log out | ✅ Completed |

### User Management Sub-Navigation
- User List View (searchable/filterable)
- User Detail/Edit screens
- User role management

### System Monitoring Sub-Navigation
- API usage statistics
- Error logs
- System health indicators

### Data Management Sub-Navigation
- Data source configuration
- Data integrity tools
- Data sync status

## Implementation Notes

- Each portal uses a sidebar navigation component for main navigation items
- Mobile devices use a collapsible menu accessible via a hamburger icon
- Active navigation items are visually highlighted
- Breadcrumbs are implemented for complex nested navigation paths
- Role-based access control restricts navigation based on user permissions

## Next Steps

1. Implement Help/Support area with documentation
2. Add notification system across all portals
3. Enhance mobile navigation experience
4. Implement user onboarding flows for new users
5. Add saved searches/favorites functionality

