import React from 'react'; 
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';  
import { useAuth } from '../AuthContext';  
import { ThemeContext } from '../App';  

// Mocking navigation and context
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: { from: { pathname: '/dashboard' } } }),
}));

// Mock AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    isAuthenticated: jest.fn(() => false),
    isLoading: false,
    currentUser: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  }),
}));

// Mock ThemeContext properly
jest.mock('../App', () => {
  const { createContext } = require('react');
  const ThemeContext = createContext({
    darkMode: false,
    toggleDarkMode: jest.fn(),
  });

  return { ThemeContext };
});

const renderWithProviders = (ui) => {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      {ui}
    </MemoryRouter>
  );
};

describe('Login Component', () => {
  let localStorageMock;

  beforeEach(() => {
    // Set up localStorage mock
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
      };
    })();
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });

    // Reset localStorage
    localStorage.clear();
    localStorage.setItem('at_at_users', JSON.stringify([{
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      password: 'password123'
    }])); 
    localStorage.removeItem('at_at_current_user');
    localStorage.removeItem('at_at_session_expiry');

    // Clear all mocks
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  // describe('Component Rendering', () => {
  //   test('renders login form with required elements', async () => {
  //     renderWithProviders(<Login />);
      
  //     // Use waitFor to wait for elements to be rendered properly
  //     await waitFor(() => {
  //       expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
  //       expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  //       expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  //     });
  //   });
  // });

  describe('Form Validation', () => {
    test('shows error when submitting empty form', async () => {
      renderWithProviders(<Login />);
      const submitButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/Please enter both identifier and password/i)).toBeInTheDocument();
      });
    });

    // test('shows error when identifier is missing', async () => {
    //   renderWithProviders(<Login />);
    //   fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    //   fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    //   await waitFor(() => {
    //     expect(screen.getByText(/Please enter both identifier and password/i)).toBeInTheDocument();
    //   });
    // });

    test('shows error when password is missing', async () => {
      renderWithProviders(<Login />);
      fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'johndoe' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      await waitFor(() => {
        expect(screen.getByText(/Please enter both identifier and password/i)).toBeInTheDocument();
      });
    });
  });

  // describe('Authentication Flow', () => {
  //   test('logs in successfully with valid credentials', async () => {
  //     const mockLogin = jest.fn().mockResolvedValue({ success: true });
  //     useAuth.mockReturnValue({
  //       login: mockLogin,
  //       isAuthenticated: jest.fn(() => true),
  //       isLoading: false,
  //     });
      
  //     renderWithProviders(<Login />);
  //     fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'johndoe' } });
  //     fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
  //     fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
  //     await waitFor(() => {
  //       expect(mockLogin).toHaveBeenCalledWith('johndoe', 'password123');
  //     });
  //     await waitFor(() => {
  //       expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  //     });
  //   });

  //   test('fails login with invalid credentials', async () => {
  //     const mockLogin = jest.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' });
  //     useAuth.mockReturnValue({
  //       login: mockLogin,
  //       isAuthenticated: jest.fn(() => false),
  //       isLoading: false,
  //     });
      
  //     renderWithProviders(<Login />);
  //     fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'johndoe' } });
  //     fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpassword' } });
  //     fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
      
  //     await waitFor(() => {
  //       expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
  //     });
  //   });
  // });

  // describe('UI Interactions', () => {
  //   test('disables submit button during submission', async () => {
  //     const mockLogin = jest.fn().mockResolvedValue({ success: true });
  //     useAuth.mockReturnValue({
  //       login: mockLogin,
  //       isAuthenticated: jest.fn(() => true),
  //       isLoading: false,
  //     });
      
  //     renderWithProviders(<Login />);
  //     fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'johndoe' } });
  //     fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
      
  //     const submitButton = screen.getByRole('button', { name: /Sign In/i });
  //     fireEvent.click(submitButton);
  //     expect(submitButton).toBeDisabled();
  //   });
  // });

  // test('renders with dark mode', () => {
  //   const theme = { darkMode: true, toggleDarkMode: jest.fn() };
  //   renderWithProviders(
  //     <ThemeContext.Provider value={theme}>
  //       <Login />
  //     </ThemeContext.Provider>
  //   );
  //   expect(screen.getByTestId('login-form')).toHaveClass('dark-mode');
  // });
   
});
