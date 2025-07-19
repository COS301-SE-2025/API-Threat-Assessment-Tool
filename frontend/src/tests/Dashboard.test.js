import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeContext, ScanContext } from '../App';
import { AuthProvider } from '../AuthContext';
import { Dashboard } from '../Dashboard';  // Assuming you default export Dashboard
import { ScanSimulation } from '../scanSimulation';

// Mocking axios to avoid issues with import syntax in Jest
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock IntersectionObserver for Jest environment
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const mockScanSimulation = new ScanSimulation();

// Render function
const renderApp = () =>
  render(
    <AuthProvider>
      <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: jest.fn() }}>
        <ScanContext.Provider value={{ scanSimulation: mockScanSimulation }}>
          <Dashboard />
        </ScanContext.Provider>
      </ThemeContext.Provider>
    </AuthProvider>
  );

describe('Dashboard Component Unit Tests', () => {
  
  // Reset or clear localStorage and class list before each test to avoid interference
  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
  });

  test('renders without crashing', () => {
    renderApp();
    expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
  });

  test('provides scan simulation context', () => {
    renderApp();
    expect(typeof mockScanSimulation.startScan).toBe('function');
  });

  test('toggles theme to dark mode', () => {
    const toggleDarkModeMock = jest.fn();
    render(
      <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: toggleDarkModeMock }}>
        <Dashboard />
      </ThemeContext.Provider>
    );
    fireEvent.click(screen.getByTitle(/Toggle Theme/i));
    expect(toggleDarkModeMock).toHaveBeenCalled();
  });
  test('starts a scan when button is clicked', () => {
    renderApp();
    const startScanButton = screen.getByRole('button', { name: /Start Scan/i });
    fireEvent.click(startScanButton);
    expect(mockScanSimulation.startScan).toHaveBeenCalled();
  });
  test('displays scan results after scan completion', async () => {
    renderApp();
    const startScanButton = screen.getByRole('button', { name: /Start Scan/i });
    fireEvent.click(startScanButton);
    
    // Simulate scan completion
    mockScanSimulation.scanResults = [{ id: 1, status: 'completed' }];
    mockScanSimulation.onScanComplete();

    expect(screen.getByText(/Scan Results/i)).toBeInTheDocument();
    expect(screen.getByText(/1 completed/i)).toBeInTheDocument();
  });
  test('handles scan errors gracefully', async () => {
    renderApp();
    const startScanButton = screen.getByRole('button', { name: /Start Scan/i });
    fireEvent.click(startScanButton);
    
    // Simulate scan error
    mockScanSimulation.scanError = 'Network error';
    mockScanSimulation.onScanError();

    expect(screen.getByText(/Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });
  test('updates scan progress during scan', async () => {
    renderApp();
    const startScanButton = screen.getByRole('button', { name: /Start Scan/i });
    fireEvent.click(startScanButton);
    
    // Simulate scan progress
    mockScanSimulation.scanProgress = 50;
    mockScanSimulation.onScanProgress();

    expect(screen.getByText(/Progress: 50%/i)).toBeInTheDocument();
  });
  test('applies dark mode styles when dark mode is enabled', () => {
    localStorage.setItem('darkMode', 'true');
    renderApp();
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
  });
});
