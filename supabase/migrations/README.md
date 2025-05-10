# Supabase Migrations

This directory contains SQL migration files for the Supabase database.

## Row-Level Security (RLS) Policies

The following RLS policies have been implemented to secure the database:

### Profiles Table

- Users can view and update their own profile
- Admins can view, update, and delete all profiles
- Profile creation is allowed during signup

### Appraisals Table

- Customers can view, create, and update their own appraisals
- Agents can view appraisals they've claimed
- Agents can view published appraisals (for the feed)
- Agents can claim published appraisals
- Agents can update appraisals they've claimed
- Admins can view, update, and delete all appraisals

### Teams Table

- Team creators can view, update, and delete their own teams
- Team members can view teams they belong to
- Admins can view, update, and delete all teams

### Team Members Table

- Team creators can view, add, update, and remove members of their teams
- Team members can view other members of their teams
- Admins can view, add, update, and delete all team members

### Integrations Table

- Users can view, create, update, and delete their own integrations
- Team members can view team integrations
- Team creators can create, update, and delete team integrations
- Admins can view, create, update, and delete all integrations

## Applying Migrations

To apply these migrations to your Supabase project, you can use the Supabase CLI:

```bash
supabase db push
```

Or you can manually run the SQL files in the Supabase SQL Editor.

## Testing RLS Policies

It's important to thoroughly test these RLS policies to ensure they work as expected. You can test them by:

1. Creating test users with different roles (admin, agent, customer)
2. Attempting to access, create, update, and delete data with each user
3. Verifying that users can only access data they are permitted to access

## Security Considerations

- These RLS policies are designed to enforce the principle of least privilege
- They ensure that users can only access data they are explicitly permitted to access
- They prevent unauthorized access to sensitive data
- They enforce business rules such as who can claim appraisals and who can manage teams 