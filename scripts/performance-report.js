#!/usr/bin/env node

/**
 * Performance Test Reporter
 * 
 * This script processes the results from performance tests and:
 * 1. Compares them against historical baselines
 * 2. Generates a report with trends
 * 3. Alerts on performance regressions
 */

import fs from 'fs/promises';
import path from 'path';

const RESULTS_DIR = 'performance-results';
const REPORT_DIR = 'reports';
const BASELINE_FILE = 'performance-baseline.json';
const REGRESSION_THRESHOLD = 15; // 15% regression threshold

// Create directories if they don't exist
async function ensureDirectories() {
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

// Save current test results
async function saveCurrentResults(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RESULTS_DIR, `performance-${timestamp}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

// Load baseline if it exists, otherwise create a new one
async function loadBaseline() {
  try {
    const baselineContent = await fs.readFile(path.join(RESULTS_DIR, BASELINE_FILE), 'utf8');
    return JSON.parse(baselineContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No baseline found, creating a new one...');
      return {};
    }
    throw error;
  }
}

// Update baseline with new results
async function updateBaseline(baseline, current) {
  // For a real implementation, you might use a more sophisticated algorithm
  // that accounts for historical trends and noise
  const newBaseline = { ...baseline };
  
  for (const [testName, metrics] of Object.entries(current)) {
    if (!newBaseline[testName]) {
      newBaseline[testName] = metrics;
    } else {
      // Update with a weighted average (75% old, 25% new)
      for (const [metricName, metricValue] of Object.entries(metrics)) {
        const oldValue = newBaseline[testName][metricName] || metricValue;
        newBaseline[testName][metricName] = 0.75 * oldValue + 0.25 * metricValue;
      }
    }
  }
  
  await fs.writeFile(
    path.join(RESULTS_DIR, BASELINE_FILE),
    JSON.stringify(newBaseline, null, 2)
  );
  
  return newBaseline;
}

// Check for performance regressions
function detectRegressions(baseline, current) {
  const regressions = [];
  
  for (const [testName, metrics] of Object.entries(current)) {
    if (!baseline[testName]) continue;
    
    for (const [metricName, metricValue] of Object.entries(metrics)) {
      const baselineValue = baseline[testName][metricName];
      if (!baselineValue) continue;
      
      const percentChange = ((metricValue - baselineValue) / baselineValue) * 100;
      
      if (percentChange > REGRESSION_THRESHOLD) {
        regressions.push({
          test: testName,
          metric: metricName,
          baseline: baselineValue,
          current: metricValue,
          percentChange: percentChange.toFixed(2)
        });
      }
    }
  }
  
  return regressions;
}

// Generate a summary report
async function generateReport(baseline, current, regressions) {
  const timestamp = new Date().toISOString();
  const reportPath = path.join(REPORT_DIR, `performance-report-${timestamp.replace(/[:.]/g, '-')}.md`);
  
  let report = `# Performance Test Report\n\n`;
  report += `Generated: ${timestamp}\n\n`;
  
  // Summary section
  report += `## Summary\n\n`;
  report += `Total tests: ${Object.keys(current).length}\n`;
  report += `Regressions detected: ${regressions.length}\n\n`;
  
  // Regressions section
  if (regressions.length > 0) {
    report += `## Performance Regressions\n\n`;
    report += `| Test | Metric | Baseline | Current | Change |\n`;
    report += `| ---- | ------ | -------- | ------- | ------ |\n`;
    
    for (const reg of regressions) {
      report += `| ${reg.test} | ${reg.metric} | ${reg.baseline.toFixed(2)}ms | ${reg.current.toFixed(2)}ms | ${reg.percentChange}% |\n`;
    }
    report += `\n`;
  }
  
  // All metrics section
  report += `## All Metrics\n\n`;
  report += `| Test | Metric | Baseline | Current | Change |\n`;
  report += `| ---- | ------ | -------- | ------- | ------ |\n`;
  
  for (const [testName, metrics] of Object.entries(current)) {
    for (const [metricName, metricValue] of Object.entries(metrics)) {
      const baselineValue = baseline[testName]?.[metricName] || 'N/A';
      const percentChange = baselineValue !== 'N/A' 
        ? ((metricValue - baselineValue) / baselineValue * 100).toFixed(2) + '%'
        : 'N/A';
      
      report += `| ${testName} | ${metricName} | ${baselineValue !== 'N/A' ? baselineValue.toFixed(2) + 'ms' : 'N/A'} | ${metricValue.toFixed(2)}ms | ${percentChange} |\n`;
    }
  }
  
  await fs.writeFile(reportPath, report);
  return reportPath;
}

// Parse Vitest output to extract performance metrics
function parseVitestOutput(output) {
  // This is a simplified parser. In a real implementation,
  // you would parse the actual Vitest output more carefully.
  const results = {};
  
  const lines = output.split('\n');
  let currentTest = null;
  
  for (const line of lines) {
    if (line.includes('should ') && line.includes(' with acceptable performance')) {
      // Extract test name from line like "✓ should retrieve properties with acceptable performance"
      currentTest = line.trim().replace(/^[✓✗]\s+/, '');
    } else if (currentTest && line.includes('performance:')) {
      // Parse a line like "Properties retrieval performance: Avg 123.45ms, Max 234.56ms, Min 89.01ms"
      const match = line.match(/(\w+)\s+performance:\s+Avg\s+([\d.]+)ms,\s+Max\s+([\d.]+)ms,\s+Min\s+([\d.]+)ms/);
      
      if (match) {
        const [, operation, avg, max, min] = match;
        results[currentTest] = {
          averageTime: parseFloat(avg),
          maxTime: parseFloat(max),
          minTime: parseFloat(min)
        };
      }
    }
  }
  
  return results;
}

async function main() {
  try {
    await ensureDirectories();
    
    // In a real CI environment, you'd parse the actual output files
    // For this example, we'll simulate some results
    const simulatedApiOutput = `
✓ should retrieve properties with acceptable performance
Properties retrieval performance: Avg 123.45ms, Max 234.56ms, Min 89.01ms
✓ should retrieve appraisals with acceptable performance
Appraisals retrieval performance: Avg 145.67ms, Max 256.78ms, Min 95.12ms
✓ should search properties by address with acceptable performance
Property search performance: Avg 156.78ms, Max 278.90ms, Min 98.23ms
    `;
    
    const simulatedUiOutput = `
✓ should render AppraisalList component with acceptable performance
AppraisalList render time: 32.45ms
✓ should render PropertyDetail component with acceptable performance
PropertyDetail render time: 28.67ms
✓ should render Dashboard component with acceptable performance
Dashboard render time: 35.78ms
    `;
    
    // Parse test outputs
    const apiResults = parseVitestOutput(simulatedApiOutput);
    const uiResults = {
      'should render AppraisalList component with acceptable performance': {
        renderTime: 32.45
      },
      'should render PropertyDetail component with acceptable performance': {
        renderTime: 28.67
      },
      'should render Dashboard component with acceptable performance': {
        renderTime: 35.78
      }
    };
    
    // Combine results
    const allResults = { ...apiResults, ...uiResults };
    
    // Save current results
    const resultPath = await saveCurrentResults(allResults);
    console.log(`Results saved to ${resultPath}`);
    
    // Load baseline
    const baseline = await loadBaseline();
    
    // Check for regressions
    const regressions = detectRegressions(baseline, allResults);
    
    // Update baseline
    const newBaseline = await updateBaseline(baseline, allResults);
    
    // Generate report
    const reportPath = await generateReport(baseline, allResults, regressions);
    console.log(`Report generated at ${reportPath}`);
    
    // Exit with error if regressions detected
    if (regressions.length > 0) {
      console.error(`Performance regressions detected: ${regressions.length}`);
      process.exit(1);
    }
    
    console.log('Performance tests passed!');
  } catch (error) {
    console.error('Error running performance report:', error);
    process.exit(1);
  }
}

main(); 