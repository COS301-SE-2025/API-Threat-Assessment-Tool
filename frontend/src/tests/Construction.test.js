import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
import { AuthProvider } from '../AuthContext';
import Login from '../Login';
import axios from 'axios';

// Mock axios to simulate requests
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mocking localStorage to simulate it being cleared and set
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage
});

// Simplified custom render function with flexibility
const customRender = (ui) => render(
  <AuthProvider>
    <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: jest.fn() }}>
      <MemoryRouter initialEntries={['/login']}>{ui}</MemoryRouter>
    </ThemeContext.Provider>
  </AuthProvider>
);

describe('Login Component', () => {
  beforeEach(() => {
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
  });

  // test('renders login form', () => {
  //   customRender(<Login />);
  //   expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
  //   expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  // });

  test('shows error on empty submission', async () => {
    customRender(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    expect(await screen.findByText(/Please enter both/i)).toBeInTheDocument();
  });
  // test('shows error on invalid credentials', async () => {
  //   // Mock failed login response
  //   axios.post.mockRejectedValue({
  //     response: {
  //       data: {
  //         message: 'Invalid credentials'
  //       }
  //     }
  //   });

  test
  // test('logs in successfully with valid credentials', async () => {
  //   // Mock successful login response
  //   axios.post.mockResolvedValue({
  //     data: {
  //       data: {
  //         token: 'fake-token',
  //         user: { username: 'johndoe', firstName: 'John', lastName: 'Doe' }
  //       }
  //     }
  //   });

  //   customRender(<Login />);
  //   fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'johndoe' } });
  //   fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
  //   fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

  //   await act(async () => {
  //     jest.runAllTimers(); // Simulate async processing
  //   });

  //   await waitFor(() => {
  //     const user = localStorage.getItem('at_at_current_user');
  //     expect(user).not.toBeNull();
  //     const parsed = JSON.parse(user);
  //     expect(parsed.username).toBe('johndoe');
  //   });
  // });

  // test('fails login with incorrect credentials', async () => {
  //   // Mock failed login response
  //   axios.post.mockRejectedValue({
  //     response: {
  //       data: {
  //         message: 'Invalid credentials'
  //       }
  //     }
  //   });

  //   customRender(<Login />);
  //   fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'johndoe' } });
  //   fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
  //   fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

  //   await act(async () => {
  //     jest.runAllTimers();
  //   });

  //   await waitFor(() => {
  //     expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  //   });
  // });

  // test('demo login works', async () => {
  //   customRender(<Login />);
  //   fireEvent.click(screen.getByRole('button', { name: /Login as John Doe/i }));

  //   await act(async () => {
  //     jest.runAllTimers();
  //   });

  //   await waitFor(() => {
  //     const user = localStorage.getItem('at_at_current_user');
  //     expect(user).not.toBeNull();
  //     const parsed = JSON.parse(user);
  //     expect(parsed.username).toBe('johndoe');
  //   });
  // });

  // test('displays error on demo login failure', async () => {
  //   customRender(<Login />);
  //   fireEvent.click(screen.getByRole('button', { name: /Login as Jane Smith/i }));

  //   await act(async () => {
  //     jest.runAllTimers();
  //   });

  //   await waitFor(() => {
  //     expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  //   });
  // });
});
