/**
 * Apply CSRF Protection Fix Script
 * 
 * This script applies the SQL fix for CSRF protection to the Supabase database.
 * It first tries to create helper functions in SQL, then uses those to apply the fixes.
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
    console.log('Setting up SQL execution functions...');
    
    // Read the helper SQL file
    const helperSqlPath = path.join(__dirname, 'supabase-direct-query.sql');
    const helperSqlContent = fs.readFileSync(helperSqlPath, 'utf8');
    
    // Upload the helper SQL to a temporary table
    const { error: uploadError } = await supabase
      .from('temp_sql_uploads')
      .upsert([
        {
          id: 'csrf-fix-helpers',
          sql_content: helperSqlContent,
          created_at: new Date().toISOString()
        }
      ], { onConflict: 'id' });
    
    if (uploadError) {
      console.error(`Error uploading helper SQL: ${uploadError.message}`);
      console.log('Checking if temp_sql_uploads table exists...');
      
      // Create the table if it doesn't exist
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS public.temp_sql_uploads (
            id TEXT PRIMARY KEY,
            sql_content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          
          -- Set RLS
          ALTER TABLE public.temp_sql_uploads ENABLE ROW LEVEL SECURITY;
          
          -- Allow service role full access
          CREATE POLICY "Service role can do anything" ON public.temp_sql_uploads
            USING (true)
            WITH CHECK (true);
        `
      });
      
      if (createTableError) {
        console.error(`Error creating temp table: ${createTableError.message}`);
        console.log('Trying alternative approach...');
      } else {
        // Try upload again
        const { error: retryError } = await supabase
          .from('temp_sql_uploads')
          .upsert([
            {
              id: 'csrf-fix-helpers',
              sql_content: helperSqlContent,
              created_at: new Date().toISOString()
            }
          ], { onConflict: 'id' });
          
        if (retryError) {
          console.error(`Error on retry of uploading helper SQL: ${retryError.message}`);
        } else {
          console.log('Successfully uploaded helper SQL on second attempt');
        }
      }
    } else {
      console.log('Successfully uploaded helper SQL');
    }
    
    console.log('\nApplying CSRF protection fix...');
    
    // Call the apply_csrf_fixes function
    const { data, error } = await supabase.rpc('apply_csrf_fixes');
    
    if (error) {
      console.error(`Error applying CSRF fixes: ${error.message}`);
      console.log('Error details:', error);
      
      // If we can't call the function, we need to try executing directly
      console.log('\nTrying to execute the csrf-fix-helpers SQL directly...');
      
      // Get the SQL from the temp table
      const { data: sqlData, error: sqlError } = await supabase
        .from('temp_sql_uploads')
        .select('sql_content')
        .eq('id', 'csrf-fix-helpers')
        .single();
      
      if (sqlError) {
        console.error(`Error retrieving SQL: ${sqlError.message}`);
      } else {
        // Execute the helper SQL
        const { error: execError } = await supabase.rpc('exec_sql', {
          query: sqlData.sql_content
        });
        
        if (execError) {
          console.error(`Error executing helper SQL: ${execError.message}`);
        } else {
          console.log('Successfully executed helper SQL');
          
          // Try running apply_csrf_fixes again
          const { data: retryData, error: retryError } = await supabase.rpc('apply_csrf_fixes');
          
          if (retryError) {
            console.error(`Error applying CSRF fixes on retry: ${retryError.message}`);
          } else {
            console.log('Successfully applied CSRF fixes on retry');
            console.log('Result:', retryData);
          }
        }
      }
    } else {
      console.log('Successfully applied CSRF fixes');
      console.log('Result:', data);
    }
    
    console.log('\nNow run "npm run verify-csrf" to check if the fix worked');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main(); 