import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initializes with default users', () => {
    renderHook(() => useAuth(), { wrapper });
    const users = JSON.parse(localStorage.getItem('at_at_users'));
    expect(users).toHaveLength(2);
  });

  test('login success with default user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('johndoe', 'password123');
    });
    expect(loginResult.success).toBe(true);
    expect(result.current.currentUser.username).toBe('johndoe');
  });

  test('login fails with invalid credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('wrong', 'creds');
    });
    expect(loginResult.success).toBe(false);
  });

  test('signup creates new user', async () => {
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
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('johndoe', 'password123');
      result.current.logout();
    });
    expect(result.current.currentUser).toBe(null);
    expect(localStorage.getItem('at_at_current_user')).toBe(null);
  });
});
