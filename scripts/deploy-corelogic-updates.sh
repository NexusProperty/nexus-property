#!/bin/bash

# Script to deploy CoreLogic API integration updates
# This script applies database migrations and deploys the updated edge function

set -e

echo "==== CoreLogic API Integration Deployment ===="
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "Error: supabase CLI is not installed or not in path"
    echo "Please install it from https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "Step 1: Applying database migrations..."
supabase db diff --use-migra --schema public | tee migration-check.sql

read -p "Review the changes above. Proceed with migrations? (y/n) " proceed

if [ "$proceed" != "y" ]; then
    echo "Deployment aborted by user."
    exit 0
fi

echo "Running migrations..."
supabase db reset

echo "Step 2: Copying CoreLogic files to Edge Function directory..."
# Ensure the destination directory exists
mkdir -p ./supabase/functions/property-data

# Copy files from memory-bank directory to Edge Function directory (if needed)
cp -v ./memory-bank/CoreLogic-API/corelogic-types.ts ./supabase/functions/property-data/ 2>/dev/null || echo "corelogic-types.ts already exists"
cp -v ./memory-bank/CoreLogic-API/corelogic-mock.ts ./supabase/functions/property-data/ 2>/dev/null || echo "corelogic-mock.ts already exists"
cp -v ./memory-bank/CoreLogic-API/corelogic-transformers.ts ./supabase/functions/property-data/ 2>/dev/null || echo "corelogic-transformers.ts already exists"
cp -v ./memory-bank/CoreLogic-API/corelogic-service.ts ./supabase/functions/property-data/ 2>/dev/null || echo "corelogic-service.ts already exists"

echo "Step 3: Checking for environment variables..."
# Check if the required environment variables are in .env or .env.local
if [ -f ".env.local" ]; then
    ENV_FILE=".env.local"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
else
    echo "No .env or .env.local file found. Creating a new one..."
    ENV_FILE=".env.local"
    touch "$ENV_FILE"
fi

# Check for CoreLogic API environment variables and prompt if missing
REQUIRED_VARS=("CORELOGIC_API_KEY" "CORELOGIC_API_SECRET" "CORELOGIC_API_URL" "CORELOGIC_USE_MOCK")

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" "$ENV_FILE"; then
        if [ "$var" = "CORELOGIC_USE_MOCK" ]; then
            echo "Adding $var=true to $ENV_FILE (default until sandbox credentials are available)"
            echo "$var=true" >> "$ENV_FILE"
        elif [ "$var" = "CORELOGIC_API_URL" ]; then
            echo "Adding $var=https://api-uat.corelogic.asia to $ENV_FILE (default sandbox URL)"
            echo "$var=https://api-uat.corelogic.asia" >> "$ENV_FILE"
        else
            echo "WARNING: $var is missing in $ENV_FILE"
            echo "Please add it manually once sandbox credentials are available"
            echo "$var=" >> "$ENV_FILE"
        fi
    fi
done

echo "Step 4: Deploying Edge Function..."
supabase functions deploy property-data

echo "Step 5: Setting feature flags..."
echo "Note: By default, real CoreLogic API usage is disabled via feature flags."
echo "When ready to enable it, run the following SQL in the Supabase dashboard:"
echo ""
echo "UPDATE feature_flags"
echo "SET enabled = true, percentage = 10"
echo "WHERE id = 'enable_corelogic_property_data';"
echo ""
echo "This will enable the feature for 10% of requests initially."
echo "Gradually increase the percentage as confidence builds."

echo "==== Deployment Complete ===="
echo ""
echo "Next steps:"
echo "1. Obtain CoreLogic sandbox credentials"
echo "2. Update environment variables with real credentials"
echo "3. Test the sandbox integration"
echo "4. Enable the feature flags when ready for production" 