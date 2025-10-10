import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate, useLocation, Link } from 'react-router-dom';
import ManageAPIs, { apiService } from '../ManageAPIs';
import { useAuth } from '../AuthContext';
import { ThemeContext } from '../App';

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


class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  observe(element) {

    this.callback([{
      target: element,
      isIntersecting: true,
      intersectionRatio: 1
    }]);
  }
  unobserve() {}
  disconnect() {}
}


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


beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue(mockAuthUser);
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ 
      success: true, 
      data: { 
        apis: mockApis 
      } 
    }),
  });


  document.body.innerHTML = '';
});


afterEach(() => {
  jest.restoreAllMocks();
});


describe('ManageAPIs Component - Working Additional Tests', () => {
  



  test('search input filters APIs', async () => {
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByText('Test API 1')).toBeInTheDocument();
      expect(screen.getByText('Test API 2')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'Test API 1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test API 1')).toBeInTheDocument();
      expect(screen.queryByText('Test API 2')).not.toBeInTheDocument();
    });
  });

  test('sort select changes value', async () => {
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByText('Test API 1')).toBeInTheDocument();
    });
    
    const sortSelect = screen.getByDisplayValue('Sort by Name');
    fireEvent.change(sortSelect, { target: { value: 'vulnerabilities' } });
    
    expect(sortSelect.value).toBe('vulnerabilities');
  });

  test('logout button triggers confirmation', async () => {
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByText('Test API 1')).toBeInTheDocument();
    });
    
    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);
    
    expect(window.confirm).toHaveBeenCalled();
    
    window.confirm = originalConfirm;
  });

  test('theme toggle button exists', async () => {
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByTitle('Toggle Theme')).toBeInTheDocument();
    });
  });

  test('displays statistics cards', async () => {
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByText('Total APIs')).toBeInTheDocument();
      expect(screen.getByText('Active APIs')).toBeInTheDocument();
      expect(screen.getByText('APIs with Issues')).toBeInTheDocument();
    });
  });

  test('shows no APIs message when empty', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { apis: [] } }),
    });
    
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByText('No APIs Match Your Criteria')).toBeInTheDocument();
    });
  });



  test('displays user greeting', async () => {
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome back,')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  test('shows vulnerabilities count', async () => {
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByText('⚠️ 5 vulnerabilities found')).toBeInTheDocument();
    });
  });

  test('filter toggle works', async () => {
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByText('Test API 1')).toBeInTheDocument();
      expect(screen.getByText('Test API 2')).toBeInTheDocument();
    });
    
    const issuesCard = screen.getByText('APIs with Issues').parentElement;
    fireEvent.click(issuesCard);
    
    await waitFor(() => {
      expect(screen.getByText('Test API 1')).toBeInTheDocument();
      expect(screen.queryByText('Test API 2')).not.toBeInTheDocument();
    });
  });


test('shows import modal when import button clicked', async () => {
  render(<TestWrapper><ManageAPIs /></TestWrapper>);
  
  await waitFor(() => {
    expect(screen.getByText('Test API 1')).toBeInTheDocument();
  });
  
  const importButton = screen.getByText('⬆️ Import API Spec');
  fireEvent.click(importButton);
  
  await waitFor(() => {
    expect(screen.getByText('Upload an OpenAPI or Swagger file (.json, .yaml, .yml)')).toBeInTheDocument();
  });
});






test('theme toggle button exists', async () => {
  render(<TestWrapper><ManageAPIs /></TestWrapper>);
  
  await waitFor(() => {
    expect(screen.getByText('Test API 1')).toBeInTheDocument();
  });
  
  expect(screen.getByTitle('Toggle Theme')).toBeInTheDocument();
});







test('theme toggle button triggers toggle function', async () => {
  const mockToggle = jest.fn();
  
  render(
    <BrowserRouter>
      <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: mockToggle }}>
        <ManageAPIs />
      </ThemeContext.Provider>
    </BrowserRouter>
  );
  
  await waitFor(() => {
    expect(screen.getByText('Test API 1')).toBeInTheDocument();
  });
  
  const themeButton = screen.getByTitle('Toggle Theme');
  fireEvent.click(themeButton);
  
  expect(mockToggle).toHaveBeenCalled();
});

test('message auto-clears after timeout', async () => {
  jest.useFakeTimers();
  
  fetch.mockRejectedValueOnce(new Error('Test error'));
  
  render(<TestWrapper><ManageAPIs /></TestWrapper>);
  
  await waitFor(() => {
    expect(screen.getByText(/Error fetching APIs: Test error/)).toBeInTheDocument();
  });

  jest.advanceTimersByTime(4000);
  
  await waitFor(() => {
    expect(screen.queryByText(/Error fetching APIs: Test error/)).not.toBeInTheDocument();
  });
  
  jest.useRealTimers();
});


test('Import modal closes when close button clicked', async () => {
  render(<TestWrapper><ManageAPIs /></TestWrapper>);
  fireEvent.click(await screen.findByText('⬆️ Import API Spec'));
  expect(screen.getByText(/Upload an OpenAPI/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText('×'));
  await waitFor(() => expect(screen.queryByText(/Upload an OpenAPI/i)).not.toBeInTheDocument());
});




test('Statistics card filter toggles off', async () => {
  render(<TestWrapper><ManageAPIs /></TestWrapper>);
  const card = await screen.findByText('APIs with Issues');
  fireEvent.click(card);
  expect(card.closest('.stat-card')).toHaveClass('active');
  fireEvent.click(card);
  expect(card.closest('.stat-card')).not.toHaveClass('active');
});

test('Loading state appears initially', () => {
  render(<TestWrapper><ManageAPIs /></TestWrapper>);
  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
});
test('importApiFile throws if no params', async () => {
  await expect(apiService.importApiFile()).rejects.toThrow('A file and user ID are required.');
});

test('updateApiDetails throws if updates missing', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: false, message: 'No updates' }) });
  await expect(apiService.updateApiDetails(1, 1, {})).rejects.toThrow('No updates');
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

describe('ManageAPIs Component - Working Additional Tests', () => {

  test('displays error message in UI when initial API fetch fails (success: false)', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'Failed to authenticate user.' }),
    });

    render(<TestWrapper><ManageAPIs /></TestWrapper>);

    await waitFor(() => {
      expect(screen.getByText(/Failed to authenticate user/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Test API 1')).not.toBeInTheDocument();
  });
  test('filter by issues shows "No APIs Match" when no API has issues', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          apis: [
            { id: 'api-3', name: 'No Issues', vulnerabilitiesFound: 0, lastScanned: '2023-01-01T10:00:00Z', status: 'Active' },
          ],
        },
      }),
    });
    
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    
    await waitFor(() => {
      expect(screen.getByText('No Issues')).toBeInTheDocument();
    });
    
    const issuesCard = screen.getByText('APIs with Issues').parentElement;
    fireEvent.click(issuesCard);
    
    await waitFor(() => {
      expect(issuesCard).toHaveClass('active');
      expect(screen.queryByText('No Issues')).not.toBeInTheDocument();
      expect(screen.getByText('No APIs Match Your Criteria')).toBeInTheDocument();
    });
  });
  
  test('sort by Last Scanned changes the displayed API order', async () => {
    const mockApisSorted = [
      { id: 'api-3', name: 'Z-Latest', vulnerabilitiesFound: 1, lastScanned: '2025-01-01T10:00:00Z', created_at: '2023-01-03T09:00:00Z', status: 'Active' },
      ...mockApis
    ];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { apis: mockApisSorted } }),
    });
    
    render(<TestWrapper><ManageAPIs /></TestWrapper>);
    await waitFor(() => {
      const apiNames = screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);
      expect(apiNames[0]).toBe('Test API 1');
    });
    const sortSelect = screen.getByDisplayValue('Sort by Name');
    fireEvent.change(sortSelect, { target: { value: 'lastScanned' } });
   
    await waitFor(() => {
      const apiNames = screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);
      expect(apiNames[0]).toBe('Z-Latest'); 
      expect(apiNames[1]).toBe('Test API 1'); 
    });
  });
});

describe('apiService unit tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('deleteApi throws a generic error on network failure (fetch rejected)', async () => {
    fetch.mockRejectedValueOnce(new Error('Network offline'));
    
    await expect(apiService.deleteApi(99, 1)).rejects.toThrow('Network offline');
  });
});