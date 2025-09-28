// src/tests/App.test.js
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import App from '../App';

// --- Minimal axios mock to avoid network calls ---
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// --- AuthContext mock: no-op provider + simple hook ---
// IMPORTANT: include isAuthenticated() because LandingPage calls it.
jest.mock('../AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({
    currentUser: null,
    logout: jest.fn(),
    getUserFullName: () => '',
    isAuthenticated: () => false,  // <-- prevents redirect during tests
  }),
}));

// ---- JSDOM polyfills & shims ----
beforeAll(() => {
  // Polyfill IntersectionObserver used by LandingPage
  if (!global.IntersectionObserver) {
    global.IntersectionObserver = class {
      constructor(cb, _opts) { this._cb = cb; }
      observe(target) {
        // Immediately "intersect"
        this._cb([{ target, isIntersecting: true }]);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }

  // matchMedia (some libs/readers rely on it)
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

  // Prevent Router redirects from actually changing JSDOM location during tests
  delete window.location;
  // eslint-disable-next-line no-restricted-globals
  window.location = { href: 'http://localhost/' };
});

beforeEach(() => {
  localStorage.clear();
  document.body.classList.remove('dark-mode');
  document.documentElement.classList.remove('dark-mode');
});

// ---------------- Tests ----------------

test('renders without crashing and is light mode by default', async () => {
  render(<App />);
  await waitFor(() => {
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
  });
});

test('applies dark mode when localStorage.darkMode = "true"', async () => {
  localStorage.setItem('darkMode', 'true');
  render(<App />);
  await waitFor(() => {
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
  });
});

test('constructs app shell and providers without errors', () => {
  render(<App />);
  expect(document.body.innerHTML.length).toBeGreaterThan(0);
});
