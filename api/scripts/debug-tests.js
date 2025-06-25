#!/usr/bin/env node
// scripts/debug-tests.js - Test Debugging Helper

const { spawn } = require('child_process');
const path = require('path');

/**
 * Run tests with detailed output to identify failures
 */
function runTestDebug() {
  console.log('🔍 Running tests in debug mode to identify failures...\n');
  
  const testProcess = spawn('npm', ['test', '--', '--verbose', '--no-coverage'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  testProcess.on('close', (code) => {
    console.log(`\n📊 Test process finished with code: ${code}`);
    
    if (code === 0) {
      console.log('✅ All tests passed! Running coverage analysis...');
      runCoverageAnalysis();
    } else {
      console.log('❌ Some tests failed. Check the output above for details.');
      console.log('\n💡 Common fixes:');
      console.log('   • Check mock engine is properly reset between tests');
      console.log('   • Verify test expectations match Python backend behavior');
      console.log('   • Ensure proper async/await handling');
      console.log('   • Check for timing issues in async operations');
    }
  });

  testProcess.on('error', (err) => {
    console.error('❌ Error running tests:', err.message);
  });
}

/**
 * Run specific test file for debugging
 * @param {string} testFile - Path to test file
 */
function runSpecificTest(testFile) {
  console.log(`🎯 Running specific test: ${testFile}\n`);
  
  const testProcess = spawn('npm', ['test', '--', testFile, '--verbose'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  testProcess.on('close', (code) => {
    console.log(`\n📊 Test finished with code: ${code}`);
  });
}

/**
 * Run coverage analysis with suggestions
 */
function runCoverageAnalysis() {
  console.log('\n📊 Running coverage analysis...\n');
  
  const coverageProcess = spawn('npm', ['run', 'coverage:summary'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  coverageProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n🎯 Coverage Improvement Suggestions:');
      console.log('   • Add tests for error handling paths');
      console.log('   • Test file upload edge cases (size limits, invalid types)');
      console.log('   • Add rate limiting tests');
      console.log('   • Test engine communication failures');
      console.log('   • Add malformed request tests');
      console.log('\n📖 See COVERAGE_IMPROVEMENT.md for detailed guidance');
    }
  });
}

/**
 * Generate coverage improvement suggestions
 */
function suggestCoverageImprovements() {
  console.log('💡 Quick Coverage Improvement Ideas:\n');
  
  const suggestions = [
    {
      area: 'Error Handling',
      tests: [
        'Test invalid JSON in request body',
        'Test missing required fields',
        'Test database connection failures',
        'Test engine communication timeouts'
      ]
    },
    {
      area: 'File Upload',
      tests: [
        'Test file size exceeding 10MB limit',
        'Test invalid file types (not JSON/YAML)',
        'Test corrupted file uploads',
        'Test missing file in request'
      ]
    },
    {
      area: 'Authentication',
      tests: [
        'Test expired JWT tokens',
        'Test invalid JWT signatures',
        'Test missing authorization headers',
        'Test user not found scenarios'
      ]
    },
    {
      area: 'Rate Limiting',
      tests: [
        'Test rate limit exceeded scenarios',
        'Test rate limit window expiration',
        'Test concurrent requests from same IP',
        'Test rate limit reset behavior'
      ]
    }
  ];

  suggestions.forEach(({ area, tests }) => {
    console.log(`🔧 ${area}:`);
    tests.forEach(test => console.log(`   • ${test}`));
    console.log('');
  });

  console.log('📝 Create these tests in your existing test files to boost coverage!');
}

/**
 * Main CLI interface
 */
function main() {
  const command = process.argv[2];
  const testFile = process.argv[3];

  switch (command) {
    case 'debug':
    case undefined:
      runTestDebug();
      break;

    case 'specific':
      if (!testFile) {
        console.error('❌ Please provide a test file path');
        console.log('Usage: node scripts/debug-tests.js specific tests/unit/api.test.js');
        process.exit(1);
      }
      runSpecificTest(testFile);
      break;

    case 'coverage':
      runCoverageAnalysis();
      break;

    case 'suggest':
      suggestCoverageImprovements();
      break;

    case 'help':
      console.log(`
🔍 Test Debugging Helper

Usage: node scripts/debug-tests.js [command] [options]

Commands:
  debug (default)    - Run all tests with verbose output to find failures
  specific <file>    - Run a specific test file with detailed output
  coverage          - Run coverage analysis with improvement suggestions
  suggest           - Show coverage improvement ideas
  help              - Show this help message

Examples:
  npm run test:debug                                    # Debug all tests
  node scripts/debug-tests.js specific tests/unit/api.test.js   # Debug specific file
  node scripts/debug-tests.js suggest                  # Get improvement ideas
      `);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run `node scripts/debug-tests.js help` for usage information.');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runTestDebug,
  runSpecificTest,
  runCoverageAnalysis,
  suggestCoverageImprovements
};