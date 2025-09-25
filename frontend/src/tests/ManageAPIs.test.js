import { apiService } from '../ManageAPIs';

// Mock fetch globally
global.fetch = jest.fn();

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

  test('updateApiDetails returns updated data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { updated: true } }),
    });

    const result = await apiService.updateApiDetails(1, 'user1', { name: 'new' });
    expect(result).toEqual({ updated: true });
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
});
