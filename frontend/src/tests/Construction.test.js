import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Construction from '../Construction';
import { useAuth } from '../AuthContext';
import { ThemeContext } from '../App';

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockToggleDarkMode = jest.fn();
const mockThemeContext = {
  darkMode: false,
  toggleDarkMode: mockToggleDarkMode,
};

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/construction/feature' }),
}));

const mockConfirm = jest.spyOn(window, 'confirm');

const mockUser = {
  id: 'u1',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
};

const renderComponent = (authProps, themeProps = mockThemeContext) => {
  useAuth.mockReturnValue(authProps);
  
  return render(
    <ThemeContext.Provider value={themeProps}>
      <MemoryRouter initialEntries={['/construction/feature']}>
        <Construction />
      </MemoryRouter>
    </ThemeContext.Provider>
  );
};

describe('Construction Component', () => {
  const mockLogout = jest.fn();
  const mockGetUserFullName = jest.fn().mockReturnValue('Test User');
  
  const authenticatedAuthProps = {
    currentUser: mockUser,
    isLoading: false,
    logout: mockLogout,
    getUserFullName: mockGetUserFullName,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  test('1. Renders the main "Page Under Construction" heading', () => {
    renderComponent(authenticatedAuthProps);
    expect(screen.getByRole('heading', { name: /Page Under Construction/i })).toBeInTheDocument();
  });

  test('2. Renders the "Back to Dashboard" link', () => {
    renderComponent(authenticatedAuthProps);
    const link = screen.getByRole('link', { name: /Back to Dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  test('3. Calls logout and navigates to /login upon confirmation', () => {
    renderComponent(authenticatedAuthProps);
    
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to logout?');
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  test('4. Does NOT call logout or navigate when confirmation is cancelled', () => {
    mockConfirm.mockReturnValue(false);
    renderComponent(authenticatedAuthProps);
    
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('5. Renders the footer copyright information', () => {
    renderComponent(authenticatedAuthProps);
    expect(screen.getByText(/© 2025 AT-AT \(API Threat Assessment Tool\)/i)).toBeInTheDocument();
    expect(screen.getByText(/COS301 Capstone Project/i)).toBeInTheDocument();
  });
});
