import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard'; 
import { useAuth } from '../AuthContext';
import { ThemeContext } from '../App';

global.fetch = jest.fn();

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

const mockLogout = jest.fn();
const mockGetUserFullName = jest.fn();
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockToggleDarkMode = jest.fn();
const mockThemeContext = {
  darkMode: false,
  toggleDarkMode: mockToggleDarkMode,
};

const mockConfirm = jest.spyOn(window, 'confirm');
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

const mockUser = {
  id: 'user-123',
  username: 'dashuser',
  firstName: 'Dash',
  lastName: 'User',
};

const mockApis = [
    { id: 'api-1', name: 'Billing Service API' },
    { id: 'api-2', name: 'User Auth API' },
];

const mockDashboardData = {
    total_apis: 2,
    total_scans: 15,
    total_vulnerabilities: 8,
    critical_vulnerabilities: 3,
    scan_activity_weekly: [
        { day: 'Mon', scans: 2, vulnerabilities: 1 },
        { day: 'Tue', scans: 5, vulnerabilities: 4 },
        { day: 'Wed', scans: 8, vulnerabilities: 3 },
        { day: 'Thu', scans: 0, vulnerabilities: 0 },
        { day: 'Fri', scans: 0, vulnerabilities: 0 },
        { day: 'Sat', scans: 0, vulnerabilities: 0 },
        { day: 'Sun', scans: 0, vulnerabilities: 0 },
    ],
    top_vuln_types: [
        { type: 'Broken Access Control', count: 3 },
        { type: 'Injection', count: 2 },
    ],
    recent_scans: [
        { id: 'scan-1', apiName: 'Billing Service API', date: new Date().toISOString(), status: 'Complete', vulnerabilities: 3 },
        { id: 'scan-2', apiName: 'User Auth API', date: new Date(Date.now() - 3600000).toISOString(), status: 'Failed', vulnerabilities: 0 },
    ],
};

const renderComponent = (authProps, themeProps = mockThemeContext) => {
    useAuth.mockReturnValue(authProps);
    return render(
        <ThemeContext.Provider value={themeProps}>
            <MemoryRouter initialEntries={['/dashboard']}>
                <Dashboard />
            </MemoryRouter>
        </ThemeContext.Provider>
    );
};

const mockSuccessfulFetch = (data = mockDashboardData, apis = mockApis) => {
    global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: data }),
        })
    );
    global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { apis: apis } }),
        })
    );
};

const mockOverviewFailure = () => {
    global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: false, message: 'Overview API Error' }),
        })
    );
    global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { apis: mockApis } }),
        })
    );
};

describe('Dashboard Component', () => {
  const authenticatedAuthProps = {
    currentUser: mockUser,
    logout: mockLogout,
    getUserFullName: mockGetUserFullName.mockReturnValue('Dash User'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    useAuth.mockReturnValue(authenticatedAuthProps);
  });

  test('1. Renders correct summary statistics from API data', async () => {
    mockSuccessfulFetch(mockDashboardData);
    renderComponent(authenticatedAuthProps);

    await waitFor(() => {
        expect(screen.getByText('Total APIs Managed').nextElementSibling.textContent).toBe('2');
        expect(screen.getByText('Total Scans').nextElementSibling.textContent).toBe('15');
        expect(screen.getByText('Critical Alerts').nextElementSibling.textContent).toBe('3');
    });
  });

  test('2. Displays error banner on dashboard overview fetch failure', async () => {
    mockOverviewFailure();
    renderComponent(authenticatedAuthProps);

    await waitFor(() => {
        expect(screen.getByText(/Could not load dashboard data: Overview API Error/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Total APIs Managed').nextElementSibling.textContent).toBe('0');
  });

  test('3. Calls logout and navigates to /login on confirmed logout', async () => {
    mockSuccessfulFetch();
    renderComponent(authenticatedAuthProps);

    await waitFor(() => expect(screen.getByRole('heading', { name: /Security Dashboard/i })).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to logout?');
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  test('4. Checks navigation links in the header are present and correct', async () => {
    mockSuccessfulFetch();
    renderComponent(authenticatedAuthProps);
    
    await waitFor(() => expect(screen.getByRole('heading', { name: /Security Dashboard/i })).toBeInTheDocument());

    const homeLink = screen.getByRole('link', { name: /Home/i });
    const manageApisLink = screen.getByRole('link', { name: /API Management/i });
    
    expect(homeLink).toHaveAttribute('href', '/home');
    expect(manageApisLink).toHaveAttribute('href', '/manage-apis');
    
    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveClass('active');
  });
});
