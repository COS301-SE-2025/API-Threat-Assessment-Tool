import { renderHook, act } from '@testing-library/react-hooks'; // Correct import for testing hooks
import { AuthProvider, useAuth } from '../AuthContext';
import axios from 'axios';

// Mocking axios to simulate requests
jest.mock('axios');

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

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('initializes with default users', () => {
    // Simulate having users in localStorage
    localStorage.setItem('at_at_users', JSON.stringify([
      { username: 'johndoe', password: 'password123' },
      { username: 'janedoe', password: 'password456' }
    ]));

    renderHook(() => useAuth(), { wrapper });
    const users = JSON.parse(localStorage.getItem('at_at_users'));
    expect(users).toHaveLength(2);
  });

  test('login success with default user', async () => {
    // Mock the axios.post method for successful login
    axios.post.mockResolvedValue({
      data: {
        data: {
          token: 'fake-token',
          user: { username: 'johndoe', firstName: 'John', lastName: 'Doe' }
        }
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('johndoe', 'password123');
    });

    expect(loginResult.success).toBe(true);
    expect(result.current.currentUser.username).toBe('johndoe');
    expect(localStorage.getItem('at_at_token')).toBe('fake-token');
  });

  test('login fails with invalid credentials', async () => {
    // Mock the axios.post method for failed login
    axios.post.mockRejectedValue({
      response: {
        data: {
          message: 'Invalid credentials'
        }
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('wrong', 'creds');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe('Invalid credentials');
  });

  test('signup creates new user', async () => {
    // Mock the axios.post method for successful signup
    axios.post.mockResolvedValue({
      data: {
        success: true,
        data: { token: 'fake-token', user: { username: 'newuser', firstName: 'New', lastName: 'User' } }
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    let signupResult;
    await act(async () => {
      signupResult = await result.current.signup({
        firstName: 'New',
        lastName: 'User',
        email: 'new.user@example.com',
        username: 'newuser',
        password: 'newpass'
      });
    });

    expect(signupResult.success).toBe(true);
    const users = JSON.parse(localStorage.getItem('at_at_users'));
    expect(users.find(u => u.username === 'newuser')).toBeTruthy();
  });

  test('logout clears session', async () => {
    // Simulate user login first
    axios.post.mockResolvedValue({
      data: {
        data: {
          token: 'fake-token',
          user: { username: 'johndoe', firstName: 'John', lastName: 'Doe' }
        }
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('johndoe', 'password123');
    });

    // Now logout
    await act(async () => {
      result.current.logout();
    });

    expect(result.current.currentUser).toBe(null);
    expect(localStorage.getItem('at_at_token')).toBe('');
    expect(localStorage.getItem('at_at_current_user')).toBe(null);
  });
});
