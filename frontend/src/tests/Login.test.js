import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
import { AuthProvider } from '../AuthContext';
import Login from '../Login';

beforeAll(() => {
  window.alert = jest.fn();
  jest.useFakeTimers();
});

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

const customRender = (ui) =>
  render(
    <AuthProvider>
      <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: jest.fn() }}>
        <MemoryRouter initialEntries={['/login']}>{ui}</MemoryRouter>
      </ThemeContext.Provider>
    </AuthProvider>
  );

describe('Login Component', () => {
  beforeEach(() => {
    localStorage.setItem('at_at_users', JSON.stringify([
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'password123'
      }
    ]));
    localStorage.removeItem('at_at_current_user');
    localStorage.removeItem('at_at_session_expiry');
  });

  test('renders login form', () => {
    customRender(<Login />);
    expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('shows error on empty submission', async () => {
    customRender(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    expect(await screen.findByText(/Please enter both/i)).toBeInTheDocument();
  });

  test('logs in successfully with valid credentials', async () => {
    customRender(<Login />);
    fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      const user = localStorage.getItem('at_at_current_user');
      expect(user).not.toBeNull();
      const parsed = JSON.parse(user);
      expect(parsed && parsed.username).toBe('johndoe');
    });
  });

  test('fails login with incorrect credentials', async () => {
    customRender(<Login />);
    fireEvent.change(screen.getByLabelText(/Username or Email/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByText((text) => text.toLowerCase().includes('invalid'))).toBeInTheDocument();
    });
  });

//   test('Google login fallback message', async () => {
//     jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
//       if (key === 'at_at_users') return JSON.stringify([]);
//       return null;
//     });

//     customRender(<Login />);
//     fireEvent.click(screen.getByText(/Continue with Google/i));

//     await act(async () => {
//       jest.runAllTimers();
//     });

//     await waitFor(() => {
//       expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Google login successful'));
//     });
//   });

  test('demo login works', async () => {
    customRender(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /Login as John Doe/i }));

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      const user = localStorage.getItem('at_at_current_user');
      expect(user).not.toBeNull();
    expect(user).not.toBeNull();
    if (user) {
    const parsed = JSON.parse(user);
    expect(parsed.username).toBe('johndoe');
    }
    });
  });

  test('displays error on demo login failure', async () => {
    customRender(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /Login as Jane Smith/i }));

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByText((text) => text.toLowerCase().includes('invalid'))).toBeInTheDocument();
    });
  });
});
