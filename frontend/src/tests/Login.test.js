import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Login from '../Login';
import { useAuth } from '../AuthContext';
import { ThemeContext } from '../App';

jest.useFakeTimers();

const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

const mockLogin = jest.fn();
const mockLoginWithGoogle = jest.fn();
const mockIsAuthenticated = jest.fn();
const mockIsLoading = false;

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockToggleDarkMode = jest.fn();
const mockThemeContext = {
  darkMode: false,
  toggleDarkMode: mockToggleDarkMode,
};

const mockReplaceState = jest.spyOn(window.history, 'replaceState');

const defaultAuthProps = {
  login: mockLogin,
  loginWithGoogle: mockLoginWithGoogle,
  isAuthenticated: mockIsAuthenticated,
  isLoading: mockIsLoading,
};

const renderComponent = (authProps = defaultAuthProps, themeProps = mockThemeContext) => {
  useAuth.mockReturnValue(authProps);
  mockUseLocation.mockReturnValue({ pathname: '/login', search: '', hash: '', state: null });

  return render(
    <ThemeContext.Provider value={themeProps}>
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    </ThemeContext.Provider>
  );
};

const setupForm = (identifier = 'testuser', password = 'password123') => {
  const identifierInput = screen.getByPlaceholderText(/Enter your username or email/i);
  const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

  fireEvent.change(identifierInput, { target: { value: identifier } });
  fireEvent.change(passwordInput, { target: { value: password } });

  return { identifierInput, passwordInput, signInButton: screen.getByRole('button', { name: /Sign In/i }) };
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(false);
    mockReplaceState.mockClear();
    mockConsoleError.mockClear();
  });

  test('1. Redirects to /dashboard immediately if isAuthenticated is true on mount', () => {
    mockIsAuthenticated.mockReturnValue(true);
    renderComponent();
    act(() => { jest.advanceTimersByTime(400); });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  test('2. Google button shows "Processing..." when global isLoading is true', async () => {
    const authPropsWithGlobalLoading = {
      ...defaultAuthProps,
      isLoading: true,
    };
    renderComponent(authPropsWithGlobalLoading);
    expect(screen.getByText(/Processing your login.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toHaveTextContent(/Processing.../i);
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeDisabled();
  });

  test('3. Google login failure (API error) shows error message', async () => {
    mockLoginWithGoogle.mockResolvedValue({ success: false, error: 'User not found in organization' });
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
    await waitFor(() => {
      expect(screen.getByText(/User not found in organization/i)).toBeInTheDocument();
    });
  });

  test('4. handleGoogleLogin catches unexpected error and shows generic message', async () => {
    mockLoginWithGoogle.mockRejectedValue(new Error('Google API connection failed'));
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
    await waitFor(() => {
      expect(screen.getByText(/Google login failed. Please try again or use regular login./i)).toBeInTheDocument();
    });
    expect(mockConsoleError).toHaveBeenCalledWith('Google login error:', expect.any(Error));
  });

  test('5. Theme toggle button calls toggleDarkMode', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Switch to dark mode/i }));
    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
    const darkThemeProps = { darkMode: true, toggleDarkMode: mockToggleDarkMode };
    renderComponent(defaultAuthProps, darkThemeProps);
    expect(screen.getByRole('button', { name: /Switch to light mode/i })).toHaveTextContent('☀️ Light Mode');
  });
});
