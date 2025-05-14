/**
 * Apply SQL Directly
 * 
 * This script applies an SQL file directly to the Supabase database.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  try {
    console.log('Reading SQL file...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'csrf-fix-complete-safe.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL...');
    
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sqlContent
    });
    
    if (error) {
      console.error(`Error executing SQL: ${error.message}`);
      console.error('This may be due to missing RPC function. Try running this SQL in the Supabase SQL Editor instead.');
    } else {
      console.log('SQL executed successfully');
      if (data) {
        console.log('Result:', data);
      }
    }
    
    console.log('\nNow run "node debug-verify-csrf.js" to check if the fix worked');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main(); 