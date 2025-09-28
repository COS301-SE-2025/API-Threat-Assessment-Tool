import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('../AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({
    currentUser: null,
    logout: jest.fn(),
    getUserFullName: () => '',
    isAuthenticated: () => false,
  }),
}));

jest.mock('../ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

jest.mock('../LandingPage', () => () => <div data-testid="landing">Landing Page</div>);
jest.mock('../Signup', () => () => <div data-testid="signup">Signup</div>);
jest.mock('../Login', () => () => <div data-testid="login">Login</div>);
jest.mock('../Contact', () => () => <div data-testid="contact">Contact</div>);
jest.mock('../Dashboard', () => () => <div data-testid="dashboard">Dashboard</div>);
jest.mock('../Home', () => () => <div data-testid="home">Home</div>);
jest.mock('../Documentation', () => () => <div data-testid="docs">Docs</div>);
jest.mock('../Construction', () => () => <div data-testid="construction">Construction</div>);
jest.mock('../ManageAPIs', () => () => <div data-testid="manage-apis">Manage APIs</div>);
jest.mock('../Settings', () => () => <div data-testid="settings">Settings</div>);
jest.mock('../ForgotPassword', () => () => <div data-testid="forgot">Forgot</div>);
jest.mock('../PrivacyPolicy', () => () => <div data-testid="privacy">Privacy</div>);
jest.mock('../Recover', () => () => <div data-testid="recover">Recover</div>);

jest.mock('../TermsOfService', () => {
  const React = require('react');
  return function TermsProbe() {
    const { ThemeContext } = require('../App');
    const { darkMode, toggleDarkMode } = React.useContext(ThemeContext);
    return (
      <div data-testid="terms">
        <span data-testid="is-dark">{String(darkMode)}</span>
        <button data-testid="toggle-theme" onClick={toggleDarkMode}>toggle theme</button>
      </div>
    );
  };
});

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  if (!global.IntersectionObserver) {
    global.IntersectionObserver = class {
      constructor(cb) { this._cb = cb; }
      observe(target) { this._cb?.([{ target, isIntersecting: true }]); }
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }
});

beforeEach(() => {
  window.history.pushState({}, '', '/');
  localStorage.clear();
  document.body.classList.remove('dark-mode');
  document.documentElement.classList.remove('dark-mode');
});

test('renders and is light mode by default; shows Landing on "/"', async () => {
  render(<App />);
  await waitFor(() => {
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
  });
  expect(screen.getByTestId('landing')).toBeInTheDocument();
});

test('applies dark mode when localStorage.darkMode = "true"', async () => {
  localStorage.setItem('darkMode', 'true');
  render(<App />);
  await waitFor(() => {
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
  });
  expect(localStorage.getItem('darkMode')).toBe('true');
});

test('navigates directly to /terms and renders Terms page', () => {
  window.history.pushState({}, '', '/terms');
  render(<App />);
  expect(screen.getByTestId('terms')).toBeInTheDocument();
});

test('protected route renders because ProtectedRoute is mocked to passthrough', () => {
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  expect(screen.getByTestId('dashboard')).toBeInTheDocument();
});

test('toggleDarkMode from ThemeContext flips classes and persists to localStorage', async () => {
  window.history.pushState({}, '', '/terms');
  render(<App />);
  expect(screen.getByTestId('is-dark').textContent).toBe('false');
  expect(document.body.classList.contains('dark-mode')).toBe(false);
  expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
  expect(localStorage.getItem('darkMode')).toBe('false');
  fireEvent.click(screen.getByTestId('toggle-theme'));
  await waitFor(() => {
    expect(screen.getByTestId('is-dark').textContent).toBe('true');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
  });
  expect(localStorage.getItem('darkMode')).toBe('true');
});
