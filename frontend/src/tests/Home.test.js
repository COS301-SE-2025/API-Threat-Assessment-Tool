// Home.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../Home';
import { ThemeContext } from '../App';
import { useAuth } from '../AuthContext';

// -------------------- Mocks --------------------
const mockNavigate = jest.fn();
const mockLogout = jest.fn();
const mockGetUserFullName = jest.fn();
const mockToggleDarkMode = jest.fn();

let mockCurrentUser;
let mockDarkMode;

// react-router-dom hooks/components
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/home' }),
  Link: ({ to, children, className }) => (
    <a href={to} className={className}>{children}</a>
  ),
}));

// Auth context hook
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    logout: mockLogout,
    getUserFullName: mockGetUserFullName,
  }),
}));

// Mock fetch used by dashboardService
const mockFetch = jest.spyOn(global, 'fetch');

// IntersectionObserver for scroll animations
beforeAll(() => {
  global.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ target: el, isIntersecting: true }]); }
    unobserve() {}
    disconnect() {}
  };
});

// confirm() mock for logout flow
const mockWindowConfirm = jest.spyOn(window, 'confirm');

// Helper: render <Home /> with ThemeContext.Provider
const renderHome = () =>
  render(
    <ThemeContext.Provider value={{ darkMode: mockDarkMode, toggleDarkMode: mockToggleDarkMode }}>
      <Home />
    </ThemeContext.Provider>
  );

beforeEach(() => {
  // default authenticated user
  mockCurrentUser = {
    id: 'user123',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@test.com',
  };
  mockGetUserFullName.mockReturnValue('Jane Doe');

  // default theme
  mockDarkMode = false;

  // default successful dashboard overview fetch
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: { totalApis: 5, totalVulnerabilities: 12 },
    }),
  });

  jest.clearAllMocks();
});

afterAll(() => {
  mockFetch.mockRestore();
});

// -------------------- Tests --------------------

test('1. Renders loading state when not authenticated (currentUser is null)', () => {
  mockCurrentUser = null;
  renderHome();
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

test('2. Renders authenticated component with user data and main sections', async () => {
  renderHome();
  await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
  expect(screen.getByText('Welcome back,')).toBeInTheDocument();
  expect(screen.getByText('J')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: /Secure Your APIs with AT-AT/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'What is AT-AT?' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'How AT-AT Works' })).toBeInTheDocument();
});

test('3. Renders navigation links and marks "Home" as active', () => {
  renderHome();
  expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'API Management' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('active');
  expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveClass('active');
});

test('4. Calls the logout function and navigates on confirmation', () => {
  renderHome();
  mockWindowConfirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  expect(mockWindowConfirm).toHaveBeenCalledWith('Are you sure you want to logout?');
  expect(mockLogout).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
});

test('5. Prevents logout when confirmation is cancelled', () => {
  renderHome();
  mockWindowConfirm.mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  expect(mockWindowConfirm).toHaveBeenCalledWith('Are you sure you want to logout?');
  expect(mockLogout).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
});



test('8. Renders all four "What is AT-AT?" feature cards', async () => {
  renderHome();
  await waitFor(() => expect(screen.getByRole('heading', { name: /API Security Scanner/i })).toBeInTheDocument());
  expect(screen.getByRole('heading', { name: /OWASP Compliance/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Automated Testing/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Actionable Reports/i })).toBeInTheDocument();
});

test('9. Renders all four "How AT-AT Works" steps with correct step numbers', async () => {
  renderHome();
  await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Import Your API/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Get Actionable Results/i })).toBeInTheDocument();
});

test('10. Calls the internal dashboardService.getOverview (via fetch) on mount when authenticated', async () => {
  renderHome();
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/overview');
  });
});
