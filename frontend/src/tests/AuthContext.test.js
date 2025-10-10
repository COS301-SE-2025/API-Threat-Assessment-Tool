import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import axios from 'axios';

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

const TestComponent = () => {
  const { currentUser, login, logout, signup } = useAuth();
  return (
    <div>
      <div data-testid="who">
        {currentUser ? currentUser.username : 'No user logged in'}
      </div>
      <button onClick={() => login('johndoe', 'password123')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button
        onClick={() =>
          signup({
            firstName: 'New',
            lastName: 'User',
            email: 'new.user@example.com',
            username: 'newuser',
            password: 'newpass',
          })
        }
      >
        Signup
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('initializes with no user', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('who').textContent).toBe('No user logged in');
  });

  test('login success sets token and currentUser', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          token: 'fake-token',
          user: { id: '1', username: 'johndoe', firstName: 'John', lastName: 'Doe' },
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(localStorage.getItem('at_at_token')).toBe('fake-token');
      expect(screen.getByTestId('who').textContent).toBe('johndoe');
    });
  });

  test('login failure keeps user unauthenticated and token unset', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Invalid credentials',
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(localStorage.getItem('at_at_token')).toBeNull();
      expect(screen.getByTestId('who').textContent).toBe('No user logged in');
    });
  });

  test('signup success triggers auto-login and sets user + token', async () => {
    axios.post
      .mockResolvedValueOnce({
        data: { success: true },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            token: 'signup-token',
            user: { id: '2', username: 'newuser', firstName: 'New', lastName: 'User' },
          },
        },
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Signup'));

    await waitFor(() => {
      expect(localStorage.getItem('at_at_token')).toBe('signup-token');
      expect(screen.getByTestId('who').textContent).toBe('newuser');
    });
  });

  test('logout clears session and user', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          token: 'fake-token',
          user: { id: '1', username: 'johndoe', firstName: 'John', lastName: 'Doe' },
        },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(localStorage.getItem('at_at_token')).toBe('fake-token');
      expect(screen.getByTestId('who').textContent).toBe('johndoe');
    });

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(localStorage.getItem('at_at_token')).toBeNull();
      expect(screen.getByTestId('who').textContent).toBe('No user logged in');
    });
  });
});
const ExtendedComponent = () => {
  const {
    currentUser,
    updateProfile,
    updatePassword,
    getUserPreferences,
    updatePreferences,
    refreshProfile,
    getUserFullName,
    getUserInitials,
    isAuthenticated,
    hasPermission,
    getAuthHeaders,
  } = useAuth();

  return (
    <div>
      <div data-testid="who-ext">
        {currentUser ? currentUser.username : 'No user'}
      </div>
      <div data-testid="full-ext">{getUserFullName()}</div>
      <div data-testid="init-ext">{getUserInitials()}</div>
      <div data-testid="isauth-ext">{String(isAuthenticated())}</div>
      <div data-testid="hasperm-ext">{String(hasPermission('anything'))}</div>
      <div data-testid="authhdr-ext">
        {getAuthHeaders().Authorization ? 'has' : 'none'}
      </div>

      <button
        data-testid="btn-updateProfile"
        onClick={() => updateProfile({ firstName: 'Alice', lastName: 'Adams' })}
      >
        updProfile
      </button>
      <button
        data-testid="btn-updatePassword"
        onClick={() => updatePassword('oldpw', 'newpw')}
      >
        updPass
      </button>
      <button
        data-testid="btn-getPrefs"
        onClick={() => getUserPreferences()}
      >
        getPrefs
      </button>
      <button
        data-testid="btn-setPrefs"
        onClick={() => updatePreferences({ theme: 'dark' })}
      >
        setPrefs
      </button>
      <button
        data-testid="btn-refresh"
        onClick={() => refreshProfile()}
      >
        refresh
      </button>
    </div>
  );
};

describe('AuthContext – additional coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    localStorage.setItem('at_at_token', 'BOOT_TOKEN');
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: { id: '1', username: 'john', firstName: 'John', lastName: 'Doe', email: 'j@e.com' } },
      },
    });
  });

  test('updateProfile success updates user and full name helpers', async () => {
    const { AuthProvider } = require('../AuthContext');
    axios.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: { id: '1', username: 'john', firstName: 'Alice', lastName: 'Adams', email: 'j@e.com' } },
      },
    });

    render(
      <AuthProvider>
        <ExtendedComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('who-ext').textContent).toBe('john'));

    fireEvent.click(screen.getByTestId('btn-updateProfile'));

    await waitFor(() => {
      expect(screen.getByTestId('full-ext').textContent).toBe('Alice Adams');
      expect(screen.getByTestId('init-ext').textContent).toBe('AA');
    });
  });

  test('updateProfile failure leaves user unchanged', async () => {
    const { AuthProvider } = require('../AuthContext');

    axios.put.mockResolvedValueOnce({ data: { success: false, message: 'nope' } });

    render(
      <AuthProvider>
        <ExtendedComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('who-ext').textContent).toBe('john'));
    const beforeFull = screen.getByTestId('full-ext').textContent;

    fireEvent.click(screen.getByTestId('btn-updateProfile'));

    await waitFor(() => {
      expect(screen.getByTestId('who-ext').textContent).toBe('john');
      expect(screen.getByTestId('full-ext').textContent).toBe(beforeFull);
    });
  });

  test('updatePassword success hits expected endpoint', async () => {
    const { AuthProvider } = require('../AuthContext');

    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthProvider>
        <ExtendedComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('who-ext').textContent).toBe('john'));

    fireEvent.click(screen.getByTestId('btn-updatePassword'));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      const [url] = axios.put.mock.calls[0];
      expect(url).toMatch(/\/api\/user\/password$/);
    });
  });

  test('getUserPreferences success and updatePreferences success call correct endpoints', async () => {
    const { AuthProvider } = require('../AuthContext');

    axios.get.mockResolvedValueOnce({
      data: { success: true, data: { preferences: { theme: 'dark' } } },
    });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <AuthProvider>
        <ExtendedComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('who-ext').textContent).toBe('john'));

    fireEvent.click(screen.getByTestId('btn-getPrefs'));
    fireEvent.click(screen.getByTestId('btn-setPrefs'));

    await waitFor(() => {
      const getCall = axios.get.mock.calls.find(([u]) => /\/api\/user\/preferences$/.test(u));
      const putCall = axios.put.mock.calls.find(([u]) => /\/api\/user\/preferences$/.test(u));
      expect(getCall).toBeTruthy();
      expect(putCall).toBeTruthy();
    });
  });

  test('refreshProfile failure keeps current user intact', async () => {
    const { AuthProvider } = require('../AuthContext');

    axios.get.mockResolvedValueOnce({ data: { success: false, message: 'fail-refresh' } });

    render(
      <AuthProvider>
        <ExtendedComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('who-ext').textContent).toBe('john'));

    fireEvent.click(screen.getByTestId('btn-refresh'));

    await waitFor(() => {
      expect(screen.getByTestId('who-ext').textContent).toBe('john');
      expect(screen.getByTestId('isauth-ext').textContent).toBe('true');
      expect(screen.getByTestId('hasperm-ext').textContent).toBe('true');
      expect(screen.getByTestId('authhdr-ext').textContent).toBe('has');
    });
  });
});
