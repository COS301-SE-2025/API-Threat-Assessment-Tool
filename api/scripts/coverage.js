#!/usr/bin/env node
// scripts/coverage.js - Coverage Analysis Helper

const fs = require('fs');
const path = require('path');

/**
 * Parse coverage summary and display formatted results
 */
function displayCoverageSummary() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coveragePath)) {
    console.log('❌ No coverage data found. Run: npm run test:coverage');
    process.exit(1);
  }

  try {
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const total = coverageData.total;
    
    console.log('\n📊 Code Coverage Summary\n');
    console.log('═'.repeat(50));
    
    const metrics = [
      { name: 'Lines', data: total.lines },
      { name: 'Statements', data: total.statements },
      { name: 'Functions', data: total.functions },
      { name: 'Branches', data: total.branches }
    ];

    metrics.forEach(metric => {
      const percentage = metric.data.pct;
      const covered = metric.data.covered;
      const total = metric.data.total;
      const status = getStatusIcon(percentage);
      
      console.log(`${status} ${metric.name.padEnd(12)}: ${percentage.toFixed(1)}% (${covered}/${total})`);
    });

    console.log('═'.repeat(50));
    
    // Show file-level coverage for files with low coverage
    console.log('\n📋 File Coverage Details:\n');
    
    Object.entries(coverageData)
      .filter(([file, _]) => file !== 'total')
      .sort(([_, a], [__, b]) => a.lines.pct - b.lines.pct)
      .slice(0, 10) // Show top 10 files with lowest coverage
      .forEach(([file, data]) => {
        const percentage = data.lines.pct;
        const status = getStatusIcon(percentage);
        const relativePath = path.relative(process.cwd(), file);
        
        console.log(`${status} ${relativePath.padEnd(40)}: ${percentage.toFixed(1)}%`);
      });

    console.log('\n💡 Coverage Tips:');
    console.log('  • Run `npm run test:coverage:watch` for live coverage updates');
    console.log('  • Open `coverage/lcov-report/index.html` for detailed HTML report');
    console.log('  • Aim for >80% coverage on critical business logic');
    
    // Exit with error if coverage is below thresholds
    const minCoverage = 70;
    const overallCoverage = total.lines.pct;
    
    if (overallCoverage < minCoverage) {
      console.log(`\n⚠️  Warning: Overall coverage (${overallCoverage.toFixed(1)}%) is below threshold (${minCoverage}%)`);
      process.exit(1);
    } else {
      console.log(`\n✅ Coverage meets threshold requirements (${minCoverage}%)`);
    }
    
  } catch (error) {
    console.error('❌ Error reading coverage data:', error.message);
    process.exit(1);
  }
}

/**
 * Get status icon based on coverage percentage
 * @param {number} percentage - Coverage percentage
 * @returns {string} Status icon
 */
function getStatusIcon(percentage) {
  if (percentage >= 90) return '🟢';
  if (percentage >= 80) return '🟡';
  if (percentage >= 70) return '🟠';
  return '🔴';
}

/**
 * Generate coverage badge for README
 */
function generateCoverageBadge() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coveragePath)) {
    console.log('❌ No coverage data found. Run: npm run test:coverage');
    return;
  }

  try {
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const percentage = coverageData.total.lines.pct.toFixed(1);
    
    const color = percentage >= 90 ? 'brightgreen' : 
                  percentage >= 80 ? 'yellow' : 
                  percentage >= 70 ? 'orange' : 'red';
    
    const badgeUrl = `https://img.shields.io/badge/coverage-${percentage}%25-${color}`;
    const badgeMarkdown = `![Coverage](${badgeUrl})`;
    
    console.log('\n📛 Coverage Badge for README:');
    console.log(badgeMarkdown);
    console.log('\nCopy this to your README.md file to show coverage status.');
    
  } catch (error) {
    console.error('❌ Error generating badge:', error.message);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'summary':
  case undefined:
    displayCoverageSummary();
    break;
    
  case 'badge':
    generateCoverageBadge();
    break;
    
  case 'help':
    console.log(`
📊 Coverage Analysis Helper

Usage: node scripts/coverage.js [command]

Commands:
  summary (default)  - Display detailed coverage summary
  badge             - Generate coverage badge for README
  help              - Show this help message

Examples:
  npm run test:coverage && node scripts/coverage.js
  npm run test:coverage && node scripts/coverage.js badge
`);
    break;
    
  default:
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run `node scripts/coverage.js help` for usage information.');
    process.exit(1);
}