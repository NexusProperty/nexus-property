-- Migration: Add user_id and provider columns to integrations table
-- Date: 2024-06-10

-- Add user_id column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='integrations' AND column_name='user_id'
    ) THEN
        ALTER TABLE integrations ADD COLUMN user_id uuid NOT NULL;
    END IF;
END $$;

-- Add provider column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='integrations' AND column_name='provider'
    ) THEN
        ALTER TABLE integrations ADD COLUMN provider text NOT NULL;
    END IF;
END $$;

-- Add foreign key constraint for user_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='integrations' AND constraint_type='FOREIGN KEY' AND constraint_name='integrations_user_id_fkey'
    ) THEN
        ALTER TABLE integrations ADD CONSTRAINT integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
    END IF;
END $$;

-- Down migration (manual):
-- To reverse, drop the columns if needed:
-- ALTER TABLE integrations DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE integrations DROP COLUMN IF EXISTS provider;
-- ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_user_id_fkey; 