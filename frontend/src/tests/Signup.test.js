import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Signup from '../Signup'; 
import { useAuth } from '../AuthContext';
import { ThemeContext } from '../App';

// --- MOCK DEPENDENCIES ---

// Enable fake timers for controlling setTimeout and animation delays
jest.useFakeTimers();

const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();
// Mock console.error to prevent test output from getting cluttered
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

// Mock AuthContext
const mockSignup = jest.fn();
const mockLoginWithGoogle = jest.fn();
const mockIsAuthenticated = jest.fn();
const mockIsLoading = false;

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock ThemeContext
const mockToggleDarkMode = jest.fn();
const mockThemeContext = {
  darkMode: false,
  toggleDarkMode: mockToggleDarkMode,
};

// Mock window.history.replaceState for URL cleanup
const mockReplaceState = jest.spyOn(window.history, 'replaceState');

// --- RENDER UTILITY ---

const defaultAuthProps = {
  signup: mockSignup,
  loginWithGoogle: mockLoginWithGoogle,
  isAuthenticated: mockIsAuthenticated,
  isLoading: mockIsLoading,
};

const renderComponent = (authProps = defaultAuthProps, themeProps = mockThemeContext) => {
  useAuth.mockReturnValue(authProps);
  // Default to a clean location object
  mockUseLocation.mockReturnValue({ pathname: '/signup', search: '', hash: '', state: null });
  
  return render(
    <ThemeContext.Provider value={themeProps}>
      <MemoryRouter initialEntries={['/signup']}>
        <Signup />
      </MemoryRouter>
    </ThemeContext.Provider>
  );
};

// Helper to set all form inputs to valid values
const setupValidForm = (agree = true) => {
  const inputs = {
    firstName: screen.getByPlaceholderText(/e\.g\. John/i),
    lastName: screen.getByPlaceholderText(/e\.g\. Smith/i),
    email: screen.getByPlaceholderText(/e\.g\. john\.smith@example\.com/i),
    username: screen.getByPlaceholderText(/e\.g\. johnny_s/i),
    password: screen.getByPlaceholderText('Enter your password (min 8 characters)'),
    confirmPassword: screen.getByPlaceholderText('Re-enter your password'),
    submitButton: screen.getByRole('button', { name: /Create Account/i }),
    termsCheckbox: screen.getByLabelText(/I agree to the Terms of Service and Privacy Policy/i),
  };

  fireEvent.change(inputs.firstName, { target: { value: 'Test' } });
  fireEvent.change(inputs.lastName, { target: { value: 'User' } });
  fireEvent.change(inputs.email, { target: { value: 'test.user@example.com' } });
  fireEvent.change(inputs.username, { target: { value: 'testuser' } });
  fireEvent.change(inputs.password, { target: { value: 'SecurePass1' } });
  fireEvent.change(inputs.confirmPassword, { target: { value: 'SecurePass1' } });

  if (agree) {
    fireEvent.click(inputs.termsCheckbox);
  }

  return inputs;
};

// --- TEST SUITE ---

describe('Signup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(false); 
    mockReplaceState.mockClear();
    mockConsoleError.mockClear();
  });
  
  // ---------------------------------------------
  // AUTOGUARD / AUTHENTICATED REDIRECTION TESTS
  // ---------------------------------------------

  test('1. Redirects to /dashboard immediately if isAuthenticated is true on mount', () => {
    mockIsAuthenticated.mockReturnValue(true);
    renderComponent();
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });



  test('2. Google signup failure (API error) shows error message', async () => {
    mockLoginWithGoogle.mockResolvedValue({ success: false, error: 'Google signup not enabled' });
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Sign up with Google/i }));

    await waitFor(() => {
        expect(screen.getByText(/Google signup not enabled/i)).toBeInTheDocument();
    });
  });
  

  test('3. Theme toggle button calls toggleDarkMode and updates button text', () => {
    renderComponent();
    
    const toggleButton = screen.getByRole('button', { name: /Switch to dark mode/i });
    expect(toggleButton).toHaveTextContent('🌙 Dark Mode');

    fireEvent.click(toggleButton);
    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
    
    // Simulate dark mode change by rerendering with dark mode prop set
    const darkThemeProps = { darkMode: true, toggleDarkMode: mockToggleDarkMode };
    renderComponent(defaultAuthProps, darkThemeProps);
    
    const darkToggleButton = screen.getByRole('button', { name: /Switch to light mode/i });
    expect(darkToggleButton).toHaveTextContent('☀️ Light Mode');
  });





test('4. Google signup failure shows error message', async () => {
  mockLoginWithGoogle.mockResolvedValue({ success: false, error: 'Google signup not enabled' });
  renderComponent();
  fireEvent.click(screen.getByRole('button', { name: /Sign up with Google/i }));
  await waitFor(() => {
    expect(screen.getByText(/Google signup not enabled/)).toBeInTheDocument();
  });
});



test('5. Theme toggle switches between dark and light mode', async () => {
  renderComponent();
  const toggleButton = screen.getByRole('button', { name: /Switch to dark mode/i });
  fireEvent.click(toggleButton);
  expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  const darkThemeProps = { darkMode: true, toggleDarkMode: mockToggleDarkMode };
  renderComponent(defaultAuthProps, darkThemeProps);
  expect(screen.getByRole('button', { name: /Switch to light mode/i })).toHaveTextContent('☀️ Light Mode');
});


  
});