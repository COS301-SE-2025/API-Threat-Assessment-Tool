// tests/testRunner.js

/**
 * Custom test runner with enhanced reporting and setup
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
    this.verbose = process.argv.includes('--verbose');
    this.coverage = process.argv.includes('--coverage');
    this.watch = process.argv.includes('--watch');
  }

  /**
   * Setup test environment
   */
  async setup() {
    console.log('🔧 Setting up test environment...');
    
    // Ensure test directories exist
    const testDirs = ['tests/unit', 'tests/integration', 'tests/mocks', 'tests/fixtures'];
    testDirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    // Check if dependencies are installed
    try {
      require('jest');
      require('supertest');
    } catch (error) {
      console.log('📦 Installing test dependencies...');
      execSync('npm install --save-dev jest supertest @types/jest jest-environment-node', { stdio: 'inherit' });
    }

    console.log('✅ Test environment setup complete\n');
  }

  /**
   * Run specific test suite
   */
  async runTests(testPattern = '') {
    const startTime = Date.now();
    
    try {
      let command = 'npx jest';
      
      if (testPattern) {
        command += ` --testPathPattern=${testPattern}`;
      }
      
      if (this.coverage) {
        command += ' --coverage';
      }
      
      if (this.watch) {
        command += ' --watch';
      }
      
      if (this.verbose) {
        command += ' --verbose';
      }
      
      // Add CI-friendly options if running in CI
      if (process.env.CI) {
        command += ' --ci --watchAll=false --passWithNoTests';
      }

      console.log(`🧪 Running tests with command: ${command}\n`);
      
      execSync(command, { stdio: 'inherit' });
      
      this.results.duration = Date.now() - startTime;
      console.log(`\n✅ Tests completed in ${this.results.duration}ms`);
      
    } catch (error) {
      console.error('\n❌ Tests failed');
      process.exit(1);
    }
  }

  /**
   * Run linting and code quality checks
   */
  async runLinting() {
    console.log('🔍 Running code quality checks...');
    
    // Check for common issues in test files
    const testFiles = this.findTestFiles();
    
    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for console.log statements (should use mocks in tests)
      if (content.includes('console.log(') && !content.includes('// eslint-disable')) {
        console.warn(`⚠️  Found console.log in ${file} - consider using mocks`);
      }
      
      // Check for hardcoded ports
      if (content.includes(':3001') && !content.includes('TEST_CONFIG')) {
        console.warn(`⚠️  Found hardcoded port in ${file} - use TEST_CONFIG`);
      }
      
      // Check for missing test descriptions
      if (content.includes('test(') && content.includes('test(\'\',')) {
        console.warn(`⚠️  Found empty test description in ${file}`);
      }
    });
    
    console.log('✅ Code quality checks complete\n');
  }

  /**
   * Generate test report
   */
  generateReport() {
    const reportPath = path.join(__dirname, '..', 'test-report.md');
    
    const report = `# Test Report

Generated: ${new Date().toISOString()}

## Summary
- **Total Tests**: ${this.results.total}
- **Passed**: ${this.results.passed}
- **Failed**: ${this.results.failed}
- **Skipped**: ${this.results.skipped}
- **Duration**: ${this.results.duration}ms

## Test Coverage
${this.coverage ? 'Coverage report generated in /coverage directory' : 'Run with --coverage to generate coverage report'}

## Test Structure
- **Unit Tests**: tests/unit/
- **Integration Tests**: tests/integration/
- **Mock Utilities**: tests/mocks/
- **Test Fixtures**: tests/fixtures/

## Commands
- \`npm test\` - Run all tests
- \`npm run test:unit\` - Run unit tests only
- \`npm run test:integration\` - Run integration tests only
- \`npm run test:watch\` - Run tests in watch mode
- \`npm run test:coverage\` - Run tests with coverage report
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📊 Test report generated: ${reportPath}`);
  }

  /**
   * Find all test files
   */
  findTestFiles() {
    const testDir = path.join(__dirname);
    const testFiles = [];
    
    const findFiles = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findFiles(filePath);
        } else if (file.endsWith('.test.js')) {
          testFiles.push(filePath);
        }
      });
    };
    
    findFiles(testDir);
    return testFiles;
  }

  /**
   * Clean up test artifacts
   */
  cleanup() {
    console.log('🧹 Cleaning up test artifacts...');
    
    const artifactPatterns = [
      'test-*.json',
      'endpoint-*.json',
      '*-tags.json',
      'empty.json'
    ];
    
    artifactPatterns.forEach(pattern => {
      try {
        execSync(`rm -f ${pattern}`, { stdio: 'ignore' });
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    
    console.log('✅ Cleanup complete');
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🚀 AT-AT API Test Runner\n');
    
    try {
      await this.setup();
      await this.runLinting();
      
      // Parse command line arguments for test type
      const args = process.argv.slice(2);
      const testType = args.find(arg => arg.startsWith('--type='))?.split('=')[1];
      
      switch (testType) {
        case 'unit':
          await this.runTests('unit');
          break;
        case 'integration':
          await this.runTests('integration');
          break;
        default:
          await this.runTests();
          break;
      }
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}

module.exports = TestRunner;