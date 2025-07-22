import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
import { useAuth } from '../AuthContext';
import Signup from '../Signup';

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  const navigateMock = jest.fn();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
    __navigateMock: navigateMock,
  };
});

import * as ReactRouter from 'react-router-dom';

describe('Signup Component', () => {
  const toggleDarkModeMock = jest.fn();
  const signupMock = jest.fn();
  const navigateMock = ReactRouter.__navigateMock;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      signup: signupMock,
      isLoading: false,
    });
  });

  const renderSignup = () =>
    render(
      <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: toggleDarkModeMock }}>
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      </ThemeContext.Provider>
    );

  test('renders signup form fields and buttons', () => {
    renderSignup();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign up with Google/i })).toBeInTheDocument();
  });

  test('shows validation errors on empty submit', async () => {
    renderSignup();
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    expect(await screen.findByText(/First name is required/i)).toBeInTheDocument();
  });

  // test('shows email format validation error', async () => {
  //   renderSignup();
  //   fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
  //   fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
  //   fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'invalidemail' } });
  //   fireEvent.change(screen.getByLabelText(/^Username/i), { target: { value: 'johndoe' } });
  //   fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
  //   fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
  //   fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
  //   expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
  // });

  // test('shows password mismatch error', async () => {
  //   renderSignup();
  //   fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
  //   fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
  //   fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
  //   fireEvent.change(screen.getByLabelText(/^Username/i), { target: { value: 'johndoe' } });
  //   fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
  //   fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password321' } });
  //   fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
  //   expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  // });

  // test('shows error if terms not agreed', async () => {
  //   renderSignup();
  //   fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
  //   fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
  //   fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
  //   fireEvent.change(screen.getByLabelText(/^Username/i), { target: { value: 'johndoe' } });
  //   fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
  //   fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
  //   // do NOT check agreeToTerms checkbox
  //   fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
  //   expect(await screen.findByText(/Please agree to the Terms/i)).toBeInTheDocument();
  // });

  // test('successful signup calls signup and navigates', async () => {
  //   signupMock.mockResolvedValue({ success: true });
  //   window.alert = jest.fn();

  //   renderSignup();

  //   fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
  //   fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
  //   fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
  //   fireEvent.change(screen.getByLabelText(/^Username/i), { target: { value: 'johndoe' } });
  //   fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
  //   fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
  //   fireEvent.click(screen.getByLabelText(/I agree to the Terms/));
  //   fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

  //   await waitFor(() => {
  //     expect(signupMock).toHaveBeenCalledTimes(1);
  //     expect(window.alert).toHaveBeenCalledWith('Account created successfully! You can now log in.');
  //     expect(navigateMock).toHaveBeenCalledWith('/login');
  //   });
  // });

  test('failed signup shows error message', async () => {
    signupMock.mockResolvedValue({ success: false, error: 'Username already taken' });

    renderSignup();

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Username/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByLabelText(/I agree to the Terms/));
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Username already taken/i)).toBeInTheDocument();
    });
  });

  test('toggleDarkMode button works', () => {
    renderSignup();
    fireEvent.click(screen.getByText(/Dark Mode|Light Mode/i));
    expect(toggleDarkModeMock).toHaveBeenCalledTimes(1);
  });

  // test('Google signup button shows alert', () => {
  //   window.alert = jest.fn();
  //   renderSignup();
  //   fireEvent.click(screen.getByRole('button', { name: /Sign up with Google/i }));
  //   expect(window.alert).toHaveBeenCalledWith('Google signup functionality will be implemented when backend is ready!');
  // });
});
