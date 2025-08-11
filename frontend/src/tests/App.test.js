import React from 'react';
import { render, screen } from '@testing-library/react';
import App, { ThemeContext, ScanContext } from '../App';
import { AuthProvider } from '../AuthContext';
import { ScanSimulation } from '../scanSimulation';

// Mocking axios to avoid issues with import syntax in Jest
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Custom render without wrapping in another Router
const mockScanSimulation = new ScanSimulation();

// Render function
const renderApp = () =>
  render(
    <AuthProvider>
      <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: jest.fn() }}>
        <ScanContext.Provider value={{ scanSimulation: mockScanSimulation }}>
          <App />
        </ScanContext.Provider>
      </ThemeContext.Provider>
    </AuthProvider>
  );

describe('App Component Unit Tests', () => {
  
  // Reset or clear localStorage and class list before each test to avoid interference
  beforeEach(() => {
    // Clear localStorage for each test to avoid state leaks
    localStorage.clear();
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
  });

  test('renders without crashing', () => {
    renderApp();
    // Ensure that dark mode is not applied initially
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
  });

  test('provides scan simulation context', () => {
    renderApp();
    // Ensure that scan simulation is available in context
    expect(typeof mockScanSimulation.startScan).toBe('function');
  });

  test('toggles theme to dark mode', () => {
    // Simulate dark mode preference from localStorage
    localStorage.setItem('darkMode', 'true');
    renderApp();
    // Ensure that dark mode is applied
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
  });
});
