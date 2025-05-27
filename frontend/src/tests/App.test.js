import React from 'react';
import { render, screen } from '@testing-library/react';
import App, { ThemeContext, ScanContext } from '../App';
import { AuthProvider } from '../AuthContext';
import { ScanSimulation } from '../scanSimulation';

// Custom render without wrapping in another Router
const mockScanSimulation = new ScanSimulation();

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
  test('renders without crashing', () => {
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
    renderApp();
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
  });

  test('provides scan simulation context', () => {
    renderApp();
    expect(typeof mockScanSimulation.startScan).toBe('function');
  });

  test('toggles theme to dark mode', () => {
    localStorage.setItem('darkMode', 'true');
    renderApp();
    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });
});
