import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeContext } from '../App';
import { useAuth } from '../AuthContext';
import Home from '../Home';

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  const navigateMock = jest.fn();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: '/home' }),
    Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
    __navigateMock: navigateMock,
  };
});

import * as ReactRouter from 'react-router-dom';

describe('Home Component', () => {
  const toggleDarkModeMock = jest.fn();
  const logoutMock = jest.fn();
  const navigateMock = ReactRouter.__navigateMock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHome = (currentUser = { firstName: 'Jane' }) =>
    render(
      <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: toggleDarkModeMock }}>
        <MemoryRouter>
          {useAuth.mockReturnValue({
            currentUser,
            logout: logoutMock,
            getUserFullName: () => currentUser ? `${currentUser.firstName} Smith` : null,
          })}
          <Home />
        </MemoryRouter>
      </ThemeContext.Provider>
    );

  // test('renders loading state when no current user', () => {
  //   useAuth.mockReturnValue({
  //     currentUser: null,
  //     logout: logoutMock,
  //     getUserFullName: () => null,
  //   });
  //   renderHome(null);
  //   expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  // });

  // test('renders user greeting and nav links', () => {
  //   useAuth.mockReturnValue({
  //     currentUser: { firstName: 'Jane' },
  //     logout: logoutMock,
  //     getUserFullName: () => 'Jane Smith',
  //   });
  //   renderHome();
  //   expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument();
  //   expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  //   expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
  //   expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
  // });

  // test('calls toggleDarkMode when theme button clicked', () => {
  //   useAuth.mockReturnValue({
  //     currentUser: { firstName: 'Jane' },
  //     logout: logoutMock,
  //     getUserFullName: () => 'Jane Smith',
  //   });
  //   renderHome();
  //   fireEvent.click(screen.getByTitle(/Toggle Theme/i));
  //   expect(toggleDarkModeMock).toHaveBeenCalledTimes(1);
  // });

  // test('calls logout and navigates on confirm logout', () => {
  //   useAuth.mockReturnValue({
  //     currentUser: { firstName: 'Jane' },
  //     logout: logoutMock,
  //     getUserFullName: () => 'Jane Smith',
  //   });
  //   window.confirm = jest.fn(() => true);
  //   renderHome();
  //   fireEvent.click(screen.getByTitle(/Logout/i));
  //   expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to logout?');
  //   expect(logoutMock).toHaveBeenCalledTimes(1);
  //   expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  // });

  // test('does not logout if confirmation cancelled', () => {
  //   useAuth.mockReturnValue({
  //     currentUser: { firstName: 'Jane' },
  //     logout: logoutMock,
  //     getUserFullName: () => 'Jane Smith',
  //   });
  //   window.confirm = jest.fn(() => false);
  //   renderHome();
  //   fireEvent.click(screen.getByTitle(/Logout/i));
  //   expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to logout?');
  //   expect(logoutMock).not.toHaveBeenCalled();
  //   expect(navigateMock).not.toHaveBeenCalled();
  // });
});
