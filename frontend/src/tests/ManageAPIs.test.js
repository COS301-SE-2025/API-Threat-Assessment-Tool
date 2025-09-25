import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate, useLocation, Link } from 'react-router-dom';
import ManageAPIs, { apiService } from '../ManageAPIs';
import { useAuth } from '../AuthContext';
import { ThemeContext } from '../App';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: () => ({ pathname: '/manage-apis' }),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../App', () => {
  const React = jest.requireActual('react');
  return {
    ThemeContext: React.createContext({
      darkMode: false,
      toggleDarkMode: jest.fn(),
    }),
  };
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  observe(element) {
    // Immediately trigger the callback to make elements visible
    this.callback([{
      target: element,
      isIntersecting: true,
      intersectionRatio: 1
    }]);
  }
  unobserve() {}
  disconnect() {}
}

// Set up IntersectionObserver mock before tests
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock fetch globally
global.fetch = jest.fn();

const mockApis = [
  {
    id: 'api-1',
    name: 'Test API 1',
    vulnerabilitiesFound: 5,
    lastScanned: '2023-01-01T10:00:00Z',
    created_at: '2023-01-01T09:00:00Z',
    status: 'Active',
  },
  {
    id: 'api-2',
    name: 'Test API 2',
    vulnerabilitiesFound: 0,
    lastScanned: 'Never',
    created_at: '2023-01-02T09:00:00Z',
    status: 'Inactive',
  },
];

const mockAuthUser = {
  currentUser: {
    id: 'user123',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User'
  },
  logout: jest.fn(),
  getUserFullName: () => 'Test User',
  isAuthenticated: () => true,
  getUserInitials: () => 'TU'
};

const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: jest.fn() }}>
        {children}
      </ThemeContext.Provider>
    </BrowserRouter>
  );
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset useAuth mock
  useAuth.mockReturnValue(mockAuthUser);
  
  // Reset fetch mock with proper response structure
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ 
      success: true, 
      data: { 
        apis: mockApis 
      } 
    }),
  });

  // Clear any existing DOM content
  document.body.innerHTML = '';
});

// Clean up after each test
afterEach(() => {
  jest.restoreAllMocks();
});

describe('ManageAPIs Component Tests', () => {
  test('renders and displays APIs from fetch', async () => {
    // Render the component
    render(
      <TestWrapper>
        <ManageAPIs />
      </TestWrapper>
    );

    // Wait for the loading to complete and APIs to be displayed
    await waitFor(
      () => {
        expect(screen.getByText('Test API 1')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Check that both API names are rendered
    expect(screen.getByText('Test API 1')).toBeInTheDocument();
    expect(screen.getByText('Test API 2')).toBeInTheDocument();
    
    // Check for vulnerabilities text (note: includes emoji in actual component)
    await waitFor(() => {
      expect(screen.getByText('⚠️ 5 vulnerabilities found')).toBeInTheDocument();
    });

    // Verify fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith('/api/apis?user_id=user123');
  });

  test('displays loading state initially', () => {
    // Mock a delayed response
    fetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: { apis: [] } })
        }), 100)
      )
    );

    render(
      <TestWrapper>
        <ManageAPIs />
      </TestWrapper>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles empty API list', async () => {
    // Mock empty response
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: { 
          apis: [] 
        } 
      }),
    });

    render(
      <TestWrapper>
        <ManageAPIs />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No APIs Match Your Criteria')).toBeInTheDocument();
    });
  });

  test('handles fetch error', async () => {
    // Mock fetch error
    fetch.mockRejectedValue(new Error('Failed to fetch APIs.'));

    render(
      <TestWrapper>
        <ManageAPIs />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error fetching APIs/)).toBeInTheDocument();
    });
  });
});

describe('apiService unit tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('fetchUserApis returns API list on success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { apis: [{ id: 1, name: 'API1' }] },
      }),
    });
    
    const result = await apiService.fetchUserApis('user1');
    expect(result).toEqual([{ id: 1, name: 'API1' }]);
    expect(fetch).toHaveBeenCalledWith('/api/apis?user_id=user1');
  });

  test('fetchUserApis throws error on failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    
    await expect(apiService.fetchUserApis('user1')).rejects.toThrow('Failed to fetch APIs.');
  });

  test('fetchUserApis throws error when user ID is missing', async () => {
    await expect(apiService.fetchUserApis()).rejects.toThrow('User ID is required.');
  });
    test('fetchUserApis returns API list on success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { apis: [{ id: 1, name: 'API1' }] },
      }),
    });

    const result = await apiService.fetchUserApis('user1');
    expect(result).toEqual([{ id: 1, name: 'API1' }]);
  });

  test('importApiFile works on success', async () => {
    const file = new Blob(['dummy'], { type: 'text/plain' });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { imported: true } }),
    });

    const result = await apiService.importApiFile(file, 'user1');
    expect(result).toEqual({ imported: true });
  });

  test('deleteApi returns success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, deleted: true }),
    });

    const result = await apiService.deleteApi(5, 'user1');
    expect(result).toEqual({ success: true, deleted: true });
  });

test('updateApiDetails returns data on success', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { updated: true } }),
  });
  const result = await apiService.updateApiDetails(5, 1, { name: 'new' });
  expect(result).toEqual({ success: true, data: { updated: true } });
});

  test('fetchApiEndpoints returns endpoints', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { endpoints: [{ id: 1, path: '/test' }] },
      }),
    });

    const result = await apiService.fetchApiEndpoints(1, 'user1');
    expect(result).toEqual([{ id: 1, path: '/test' }]);
  });

  test('updateEndpointFlag chooses correct endpoint', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, msg: 'ok' }),
    });

    const result = await apiService.updateEndpointFlag(1, 'user1', 99, 'BOLA', 'add');
    expect(result).toEqual({ success: true, msg: 'ok' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/endpoints/flags/add',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('createScan returns scan data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { scanId: 7 } }),
    });

    const result = await apiService.createScan(1, 'user1', 'profile');
    expect(result).toEqual({ scanId: 7 });
  });

  test('startScan throws on backend error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'bad' }),
    });

    await expect(apiService.startScan(1, 'user1', 'prof')).rejects.toThrow('bad');
  });

  test('getScanStatus returns scan status', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { status: 'done' } }),
    });

    const result = await apiService.getScanStatus(42);
    expect(result).toEqual({ status: 'done' });
  });

  test('getScanList returns list', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { scans: [{ id: 1 }] } }),
    });

    const result = await apiService.getScanList(1, 'user1');
    expect(result).toEqual([{ id: 1 }]);
  });

  test('getSchedule returns schedule', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { schedule: { frequency: 'weekly' } } }),
    });

    const result = await apiService.getSchedule(1, 'user1');
    expect(result).toEqual({ frequency: 'weekly' });
  });

  test('saveSchedule returns schedule', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { schedule: 'daily' } }),
    });

    const result = await apiService.saveSchedule(1, 'user1', 'daily', true);
    expect(result).toBe('daily');
  });

  test('deleteSchedule confirms deletion', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, deleted: true }),
    });

    const result = await apiService.deleteSchedule(1, 'user1');
    expect(result).toEqual({ success: true, deleted: true });
  });

test('fetchUserApis handles non-ok response gracefully', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'Server error' }),
  });
  await expect(apiService.fetchUserApis(123)).rejects.toThrow('Failed to fetch APIs.');
});
test('importApiFile throws on non-ok response', async () => {
  const file = new Blob(['dummy'], { type: 'text/plain' });
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'File too large' }),
  });
  await expect(apiService.importApiFile(file, 1)).rejects.toThrow('File too large');
});

test('deleteApi returns data on success', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, deleted: true }),
  });
  const result = await apiService.deleteApi(99, 1);
  expect(result).toEqual({ success: true, deleted: true });
});

test('updateEndpointFlag chooses correct endpoint for remove action', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, msg: 'ok' }),
  });
  const result = await apiService.updateEndpointFlag(1, 1, 10, 'BOLA', 'remove');
  expect(result).toEqual({ success: true, msg: 'ok' });
  expect(fetch).toHaveBeenCalledWith(
    '/api/endpoints/flags/remove',
    expect.objectContaining({ method: 'POST' })
  );
});

test('createScan throws on backend error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Profile not found' }),
    });
    await expect(apiService.createScan(1, 1, 'profile')).rejects.toThrow('Profile not found');
});

test('startScan returns data on success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { scan_id: 123 } }),
    });
    const result = await apiService.startScan(1, 1, 'profile');
    expect(result).toEqual({ scan_id: 123 });
});

test('getScanStatus throws on failure', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'Scan not found' }),
  });
  await expect(apiService.getScanStatus(99)).rejects.toThrow('Scan not found');
});

test('fetchUserApis handles non-ok response gracefully', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'Server error' }),
  });
  await expect(apiService.fetchUserApis(123)).rejects.toThrow('Failed to fetch APIs.');
});

test('getSchedule returns schedule data on success', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { schedule: { frequency: 'weekly' } } }),
  });
  const result = await apiService.getSchedule(1, 1);
  expect(result).toEqual({ frequency: 'weekly' });
});

test('saveSchedule throws on failure', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'fail to save' }),
  });
  await expect(apiService.saveSchedule(1, 1, 'weekly', true)).rejects.toThrow('fail to save');
});

test('deleteSchedule throws on failure', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'fail to delete' }),
  });
  await expect(apiService.deleteSchedule(1, 1)).rejects.toThrow('fail to delete');
});
test('importApiFile throws on missing file', async () => {
  await expect(apiService.importApiFile(null, 1)).rejects.toThrow('A file and user ID are required.');
});

test('deleteApi throws on failure', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'Delete failed' }),
  });
  await expect(apiService.deleteApi(99, 1)).rejects.toThrow('Delete failed');
});

test('fetchApiEndpoints handles error response', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'Endpoints not found' }),
  });
  await expect(apiService.fetchApiEndpoints(1, 1)).rejects.toThrow('Endpoints not found');
});

test('updateEndpointFlag throws on failure', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'Flag update failed' }),
  });
  await expect(apiService.updateEndpointFlag(1, 1, 1, 'BOLA', 'add')).rejects.toThrow('Flag update failed');
});

test('startScan throws on failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Scan failed to start' }),
    });
    await expect(apiService.startScan(1, 1, 'profile')).rejects.toThrow('Scan failed to start');
});

test('saveSchedule throws on invalid schedule data', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'Invalid schedule' }),
  });
  await expect(apiService.saveSchedule(1, 1, 'invalid', false)).rejects.toThrow('Invalid schedule');
});

test('importApiFile throws on backend failure (ok but success:false)', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'Invalid file type' }),
    });
    const file = new Blob(['dummy'], { type: 'text/plain' });
    await expect(apiService.importApiFile(file, 1)).rejects.toThrow('Invalid file type');
});

test('deleteApi throws on backend failure (ok but success:false)', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'API not found' }),
    });
    await expect(apiService.deleteApi(99, 1)).rejects.toThrow('API not found');
});

test('updateApiDetails throws on backend failure (ok but success:false)', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'API not found' }),
    });
    await expect(apiService.updateApiDetails(1, 1, { name: 'new' })).rejects.toThrow('API not found');
});

test('createScan throws on backend failure (ok but success:false)', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'Invalid profile' }),
    });
    await expect(apiService.createScan(1, 1, 'invalid')).rejects.toThrow('Invalid profile');
});

test('fetchUserApis throws if no userId is provided', async () => {
  await expect(apiService.fetchUserApis()).rejects.toThrow('User ID is required.');
});

test('importApiFile throws if no userId is provided', async () => {
  const file = new Blob(['dummy']);
  await expect(apiService.importApiFile(file, null)).rejects.toThrow('A file and user ID are required.');
});

test('deleteApi throws if server responds with success false', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: false, message: 'Not deleted' }),
  });
  await expect(apiService.deleteApi(1, 'u1')).rejects.toThrow('Not deleted');
});

test('updateApiDetails sends correct payload', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { updated: true } }),
  });
  const updates = { name: 'newName' };
  await apiService.updateApiDetails(2, 'u2', updates);
  expect(fetch).toHaveBeenCalledWith(
    '/api/apis/update',
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ api_id: 2, user_id: 'u2', updates }),
    })
  );
});

test('fetchApiEndpoints throws if server fails', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: false, message: 'Bad endpoints' }),
  });
  await expect(apiService.fetchApiEndpoints(2, 'u2')).rejects.toThrow('Bad endpoints');
});

test('updateEndpointFlag throws descriptive error on failure', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: 'Broken' }),
  });
  await expect(apiService.updateEndpointFlag(1, 'u1', 5, 'BOLA', 'add')).rejects.toThrow(
    'Failed to add flag BOLA: Broken'
  );
});

test('createScan sends correct body', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { scanId: 9 } }),
  });
  await apiService.createScan(2, 'u2', 'profileX');
  expect(fetch).toHaveBeenCalledWith(
    '/api/scan/create',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ user_id: 'u2', api_id: 2, scan_profile: 'profileX' }),
    })
  );
});

test('startScan sends correct body', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { scan_id: 55 } }),
  });
  await apiService.startScan(3, 'u3', 'prof');
  expect(fetch).toHaveBeenCalledWith(
    '/api/scan/start',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ api_id: 3, scan_profile: 'prof', user_id: 'u3' }),
    })
  );
});

test('getScanStatus sends correct payload', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { status: 'ok' } }),
  });
  await apiService.getScanStatus(123);
  expect(fetch).toHaveBeenCalledWith(
    '/api/scan/details',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ scan_id: 123 }),
    })
  );
});

test('getScanList throws if data.success is false', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: false, message: 'Denied' }),
  });
  await expect(apiService.getScanList(1, 'u1')).rejects.toThrow('Denied');
});

test('getScanList returns empty array if scans missing', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: {} }),
  });
  const result = await apiService.getScanList(2, 'u2');
  expect(result).toEqual([]);
});

test('getSchedule throws if backend responds with error', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: false, message: 'No schedule' }),
  });
  await expect(apiService.getSchedule(1, 'u1')).rejects.toThrow('No schedule');
});

test('saveSchedule sends correct body', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { schedule: 'weekly' } }),
  });
  await apiService.saveSchedule(1, 'u1', 'weekly', true);
  expect(fetch).toHaveBeenCalledWith(
    '/api/scans/schedule',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ api_id: 1, user_id: 'u1', frequency: 'weekly', is_enabled: true }),
    })
  );
});

test('deleteSchedule sends correct body', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true }),
  });
  await apiService.deleteSchedule(7, 'u7');
  expect(fetch).toHaveBeenCalledWith(
    '/api/scans/schedule',
    expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({ api_id: 7, user_id: 'u7' }),
    })
  );
});

test('fetchUserApis returns [] when no apis present', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { apis: [] } }),
  });
  const result = await apiService.fetchUserApis('uX');
  expect(result).toEqual([]);
});

test('fetchApiEndpoints returns [] when no endpoints present', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { endpoints: [] } }),
  });
  const result = await apiService.fetchApiEndpoints(1, 'u1');
  expect(result).toEqual([]);
});

test('updateEndpointFlag works with remove action and returns success', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, removed: true }),
  });
  const result = await apiService.updateEndpointFlag(1, 'u1', 99, 'BOLA', 'remove');
  expect(result).toEqual({ success: true, removed: true });
});

test('createScan throws default message when no backend message provided', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false }),
  });
  await expect(apiService.createScan(1, 'u1', 'prof')).rejects.toThrow('Failed to create scan');
});

test('startScan throws default message when no backend message provided', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false }),
  });
  await expect(apiService.startScan(1, 'u1', 'prof')).rejects.toThrow('Failed to start scan');
});

test('getScanStatus throws default polling error when no message provided', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false }),
  });
  await expect(apiService.getScanStatus(1)).rejects.toThrow('Polling for scan results failed');
});
});