# Database Migration Guide

This guide outlines the process for applying database migrations to the Supabase project for AppraisalHub.

## Migration Files

The following migration files are included in the project:

1. `20240501000000_initial_schema.sql` - Initial schema with basic tables
2. `20240520000000_complete_schema.sql` - Complete schema with all tables and relationships
3. `20240521000000_rls_tests.sql` - pgTAP tests for RLS policies
4. `20240628_property_access.sql` - Property access control with team collaboration features
5. `20240701000000_notifications.sql` - Notifications table and triggers
6. `20240710000000_fix_triggers.sql` - Fixes for database triggers

## Applying Migrations

### Local Development

For local development, use the Supabase CLI to apply migrations:

```bash
# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset

# Run RLS tests
supabase db test
```

### Production Deployment

For production deployment, use the Supabase CLI to apply migrations:

```bash
# Link to your Supabase project
supabase link --project-ref anrpboahhkahdprohtln

# Apply migrations
supabase db push

# Verify tables and functions are created properly
supabase db diff
```

## Verifying Database Structure

After applying migrations, verify the database structure:

1. Check that all tables are created correctly
2. Verify RLS policies are applied properly
3. Confirm proper user access patterns

## Troubleshooting

If you encounter issues during migration:

1. Check the Supabase project logs
2. Review the migration SQL files for syntax errors
3. Inspect RLS policies for permission issues
4. Use pgTAP tests to validate RLS functionality

## Database Schema Documentation

For a complete description of the database schema, refer to the [Schema Documentation](database/schema-documentation.md). 