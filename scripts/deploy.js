#!/usr/bin/env node

/**
 * Deployment script for AppraisalHub
 * 
 * Usage:
 *   node scripts/deploy.js [environment]
 * 
 * Arguments:
 *   environment - The environment to deploy to: development, preview, or production
 *                 Defaults to 'development' if not specified
 * 
 * Environment Variables:
 *   Required for production deployment:
 *   - SUPABASE_ACCESS_TOKEN - Supabase access token
 *   - VERCEL_TOKEN - Vercel deployment token (if using Vercel)
 *   - VERCEL_TEAM_ID - Vercel team ID (if applicable)
 *   - VERCEL_PROJECT_ID - Vercel project ID
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import deployConfig from '../deployment.config.js';

// Load environment variables
dotenv.config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Get the target environment from command line args
const args = process.argv.slice(2);
const targetEnv = args[0] || 'development';

// Validate the environment
if (!['development', 'preview', 'production'].includes(targetEnv)) {
  console.error(`Invalid environment: ${targetEnv}`);
  console.error('Valid environments are: development, preview, production');
  process.exit(1);
}

const config = deployConfig[targetEnv];

console.log(`Deploying to ${targetEnv} environment...`);

// Function to execute commands and handle errors
function runCommand(command, errorMessage) {
  try {
    return execSync(command, { stdio: 'inherit', cwd: rootDir });
  } catch (error) {
    console.error(errorMessage || `Command failed: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

// Validate required environment variables for production
if (targetEnv === 'production') {
  const requiredEnvVars = ['SUPABASE_ACCESS_TOKEN'];
  if (config.hosting.platform === 'vercel') {
    requiredEnvVars.push('VERCEL_TOKEN', 'VERCEL_PROJECT_ID');
  }
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}

// Build the application
console.log('Building application...');
runCommand(`npm run build${targetEnv === 'development' ? ':dev' : ''}`, 'Build failed');

// Deploy Edge Functions if configured
if (config.edge_functions.deploy) {
  console.log('Deploying Edge Functions...');
  
  // Login to Supabase if access token is available
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    runCommand(
      `npx supabase login`,
      'Failed to log in to Supabase'
    );
  }
  
  // Deploy each function
  for (const funcName of config.edge_functions.functions) {
    console.log(`Deploying Edge Function: ${funcName}...`);
    runCommand(
      `npx supabase functions deploy ${funcName} --project-ref ${config.supabase.project}`,
      `Failed to deploy Edge Function: ${funcName}`
    );
  }
}

// Deploy to hosting platform
if (targetEnv !== 'development') {
  console.log(`Deploying to ${config.hosting.platform}...`);
  
  if (config.hosting.platform === 'vercel') {
    // Deploy to Vercel
    const vercelArgs = [
      `--token ${process.env.VERCEL_TOKEN}`,
      `--prod ${targetEnv === 'production' ? 'true' : 'false'}`,
    ];
    
    if (config.hosting.team) {
      vercelArgs.push(`--scope ${config.hosting.team}`);
    }
    
    runCommand(
      `npx vercel deploy ./dist ${vercelArgs.join(' ')}`,
      'Vercel deployment failed'
    );
  } else {
    console.log(`Deployment to ${config.hosting.platform} not implemented.`);
    console.log('Please manually deploy the built application.');
  }
}

console.log(`Deployment to ${targetEnv} environment completed successfully!`); 