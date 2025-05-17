#!/usr/bin/env node

/**
 * AppraisalHub Database Migration Script
 * 
 * This script helps apply database migrations to a Supabase project.
 * It provides commands and guidance for applying migrations locally
 * and to production.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const SUPABASE_PROJECT_ID = 'anrpboahhkahdprohtln';
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper function to execute a command and log output
function executeCommand(command, description) {
  console.log(`${colors.cyan}${colors.bright}► ${description}${colors.reset}`);
  console.log(`${colors.yellow}$ ${command}${colors.reset}`);
  
  return new Promise((resolve, reject) => {
    const proc = exec(command, { maxBuffer: 1024 * 1024 * 10 });
    
    proc.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    proc.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}✓ Command completed successfully${colors.reset}\n`);
        resolve();
      } else {
        console.error(`${colors.red}✗ Command failed with exit code ${code}${colors.reset}\n`);
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

// Helper function to list available migration files
function listMigrationFiles() {
  console.log(`${colors.cyan}${colors.bright}Available migration files:${colors.reset}`);
  
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  files.forEach((file, index) => {
    console.log(`${colors.yellow}${index + 1}.${colors.reset} ${file}`);
  });
  
  return files;
}

// Menu for local development
async function localDevelopment() {
  console.log(`\n${colors.bright}=== Local Development ===\n${colors.reset}`);
  
  try {
    // Start local Supabase
    await executeCommand('supabase start', 'Starting local Supabase instance');
    
    // Reset database with migrations
    await executeCommand('supabase db reset', 'Applying migrations to local database');
    
    // Run RLS tests
    await executeCommand('supabase db test', 'Running RLS policy tests');
    
    console.log(`${colors.green}${colors.bright}✓ Local migrations applied successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error applying local migrations:${colors.reset}`, error.message);
  }
}

// Menu for production deployment
async function productionDeployment() {
  console.log(`\n${colors.bright}=== Production Deployment ===\n${colors.reset}`);
  
  try {
    // Link to Supabase project
    await executeCommand(`supabase link --project-ref ${SUPABASE_PROJECT_ID}`, 'Linking to Supabase project');
    
    console.log(`${colors.yellow}${colors.bright}⚠ WARNING: You are about to apply migrations to the PRODUCTION database.${colors.reset}`);
    rl.question(`${colors.yellow}Are you sure you want to continue? (yes/no): ${colors.reset}`, async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        try {
          // Push migrations to production
          await executeCommand('supabase db push', 'Applying migrations to production database');
          
          // Check for differences
          await executeCommand('supabase db diff', 'Checking for differences between local and production');
          
          console.log(`${colors.green}${colors.bright}✓ Production migrations applied successfully!${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}${colors.bright}Error applying production migrations:${colors.reset}`, error.message);
        }
        
        rl.close();
      } else {
        console.log(`${colors.yellow}Production deployment cancelled.${colors.reset}`);
        rl.close();
      }
    });
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error linking to Supabase project:${colors.reset}`, error.message);
    rl.close();
  }
}

// Main menu
function mainMenu() {
  console.log(`\n${colors.bright}==========================================`);
  console.log(`   AppraisalHub Database Migration Script   `);
  console.log(`==========================================\n${colors.reset}`);
  
  console.log(`This script helps you apply database migrations to your Supabase project.\n`);
  
  console.log(`${colors.bright}Available migration files:${colors.reset}`);
  listMigrationFiles();
  
  console.log(`\n${colors.bright}Options:${colors.reset}`);
  console.log(`${colors.yellow}1.${colors.reset} Apply migrations to local development environment`);
  console.log(`${colors.yellow}2.${colors.reset} Apply migrations to production environment`);
  console.log(`${colors.yellow}3.${colors.reset} Exit\n`);
  
  rl.question(`${colors.bright}Select an option (1-3): ${colors.reset}`, (answer) => {
    switch (answer) {
      case '1':
        localDevelopment()
          .finally(() => rl.close());
        break;
      case '2':
        productionDeployment();
        break;
      case '3':
        console.log(`${colors.yellow}Exiting...${colors.reset}`);
        rl.close();
        break;
      default:
        console.log(`${colors.red}Invalid option. Please select 1-3.${colors.reset}`);
        rl.close();
    }
  });
}

// Start the script
mainMenu(); 