# Database Setup Instructions

To set up the database schema for the AppraisalHub application, follow these steps:

## Option 1: Using the Supabase UI

1. Log in to the [Supabase Dashboard](https://app.supabase.com/)
2. Select the "anrpboahhkahdprohtln" project
3. Navigate to the "SQL Editor" section
4. Create a new SQL query
5. Copy and paste the contents of the `scripts/init-schema.sql` file
6. Execute the query

## Option 2: Using JavaScript API

1. Run the Node.js script to initialize the database schema:

```bash
node scripts/init-database.js
```

This script uses the Supabase Admin API to execute the SQL commands.

## Option 3: Using Supabase Migration Files

The project includes the following migration files in the `supabase/migrations` directory:

- `20240501000000_initial_schema.sql`
- `20240520000000_complete_schema.sql`
- `20240521000000_rls_tests.sql`
- `20240628_property_access.sql`
- `20240701000000_notifications.sql`

These can be pushed to the remote database using:

```bash
supabase db push
```

Note: You may need to modify the migration files to fix any issues with unsupported PostgreSQL features.

## Verifying the Setup

After executing the schema setup, you can verify that the tables have been created correctly by:

1. In the Supabase Dashboard, navigate to the "Table Editor" section
2. You should see the following tables:
   - profiles
   - teams
   - team_members
   - properties
   - appraisals
   - comparable_properties
   - reports
   - notifications

## Schema Details

The schema includes:

- Tables for users, teams, properties, appraisals, and more
- Proper foreign key relationships between tables
- Triggers to update the `updated_at` timestamp
- Row Level Security (RLS) policies to control data access
- Appropriate indexes for performance

## Next Steps

Once the database schema is set up, you can:

1. Deploy the Edge Functions
2. Configure storage buckets for property images and reports
3. Set up authentication 