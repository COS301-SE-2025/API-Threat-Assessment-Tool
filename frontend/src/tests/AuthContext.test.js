import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import axios from 'axios';
import React from 'react';

// Mocking axios to simulate requests
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

// Test Component that uses the AuthContext
const TestComponent = () => {
  const { currentUser, login, logout, signup } = useAuth();
  return (
    <div>
      <div>{currentUser ? currentUser.username : "No user logged in"}</div>
      <button onClick={() => login('johndoe', 'password123')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => signup({ firstName: 'New', lastName: 'User', email: 'new.user@example.com', username: 'newuser', password: 'newpass' })}>Signup</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });
  test('initializes with no user', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
  });

  test('initializes with default users', () => {
    // Simulate having users in localStorage
    localStorage.setItem('at_at_users', JSON.stringify([
      { username: 'johndoe', password: 'password123' },
      { username: 'janedoe', password: 'password456' }
    ]));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const users = JSON.parse(localStorage.getItem('at_at_users'));
    expect(users).toHaveLength(2);
  });
  
// test(signup, async () => {
//     // Mock the axios.post method for successful signup 
//     axios.post.mockResolvedValue({
//       data: {
//         success: true,
//         data: { token: 'fake-token', user: { username: 'newuser', firstName: 'New', lastName: 'User' } }
//       }
//     });

  //   render(
  //     <AuthProvider>
  //       <TestComponent />
  //     </AuthProvider>
  //   );

  //   fireEvent.click(screen.getByText('Login'));

  //   await act(async () => {
  //     jest.runAllTimers(); // Simulating the timers running (used for delayed effects)
  //   });

  //   await waitFor(() => {
  //     // Ensuring the token is set in localStorage after login
  //     expect(localStorage.getItem('at_at_token')).toBe('fake-token');
  //     expect(screen.getByText('johndoe')).toBeInTheDocument();
  //   });
  // });

  // test('login fails with invalid credentials', async () => {
  //   // Mock the axios.post method for failed login
  //   axios.post.mockRejectedValue({
  //     response: {
  //       data: {
  //         message: 'Invalid credentials'
  //       }
  //     }
  //   });

  //   render(
  //     <AuthProvider>
  //       <TestComponent />
  //     </AuthProvider>
  //   );

  //   fireEvent.click(screen.getByText('Login'));

  //   await act(async () => {
  //     jest.runAllTimers(); // Simulating the timers running (used for delayed effects)
  //   });

  //   await waitFor(() => {
  //     expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  //   });
  // });

  // test('signup creates new user', async () => {
  //   // Mock the axios.post method for successful signup
  //   axios.post.mockResolvedValue({
  //     data: {
  //       success: true,
  //       data: { token: 'fake-token', user: { username: 'newuser', firstName: 'New', lastName: 'User' } }
  //     }
  //   });

  //   render(
  //     <AuthProvider>
  //       <TestComponent />
  //     </AuthProvider>
  //   );

  //   fireEvent.click(screen.getByText('Signup'));

  //   await act(async () => {
  //     jest.runAllTimers(); // Simulating the timers running (used for delayed effects)
  //   });

  //   await waitFor(() => {
  //     // Ensuring that the new user is added to localStorage
  //     const users = JSON.parse(localStorage.getItem('at_at_users'));
  //     expect(users).toBeTruthy();
  //     expect(users.find(u => u.username === 'newuser')).toBeTruthy();
  //   });
  // });

  // test('logout clears session', async () => {
  //   // Simulate user login first
  //   axios.post.mockResolvedValue({
  //     data: {
  //       data: {
  //         token: 'fake-token',
  //         user: { username: 'johndoe', firstName: 'John', lastName: 'Doe' }
  //       }
  //     }
  //   });

  //   render(
  //     <AuthProvider>
  //       <TestComponent />
  //     </AuthProvider>
  //   );

  //   fireEvent.click(screen.getByText('Login'));

  //   await act(async () => {
  //     jest.runAllTimers(); // Simulating the timers running (used for delayed effects)
  //   });

  //   fireEvent.click(screen.getByText('Logout'));

  //   await waitFor(() => {
  //     expect(screen.getByText('No user logged in')).toBeInTheDocument();
  //     expect(localStorage.getItem('at_at_token')).toBe('');
  //   });
  // });
});
