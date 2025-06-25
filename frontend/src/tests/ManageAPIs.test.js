import {
  fetchAllTags,
  fetchApiEndpoints,
  addTagsToEndpoint,
  removeTagsFromEndpoint,
  replaceTagsOnEndpoint,
  fetchEndpointDetails,
  saveApisToLocal,
  loadApisFromLocal,
  APIS_LOCAL_STORAGE_KEY,
  EndpointTagEditor,
  default as ManageAPIs
} from '../ManageAPIs'; // Update path as needed
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

describe('ManageAPIs', () => {
  let localStorageMock;

  beforeEach(() => {
    global.fetch = jest.fn();
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: key => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: key => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
test('ManageAPIs renders and shows APIs', () => {
  render(
    <MemoryRouter>
      <ManageAPIs />
    </MemoryRouter>
  );
  expect(screen.getByText(/Your APIs/i)).toBeInTheDocument();
});
  test('fetchAllTags returns tags on success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { tags: ['a', 'b'] } })
    });
    const tags = await fetchAllTags();
    expect(tags).toEqual(['a', 'b']);
  });

  test('fetchAllTags throws on error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'fail' })
    });
    await expect(fetchAllTags()).rejects.toThrow('fail');
  });

  test('fetchApiEndpoints returns data on success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: ['ep1', 'ep2'] })
    });
    const data = await fetchApiEndpoints(1);
    expect(data).toEqual(['ep1', 'ep2']);
  });

  test('addTagsToEndpoint sends tags and returns data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { result: 'ok' } })
    });
    const res = await addTagsToEndpoint({ path: '/x', method: 'GET', tags: ['tag'] });
    expect(res).toEqual({ result: 'ok' });
  });

  test('removeTagsFromEndpoint handles failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'nope' })
    });
    await expect(removeTagsFromEndpoint({ path: '/x', method: 'GET', tags: ['tag'] })).rejects.toThrow('nope');
  });

  test('replaceTagsOnEndpoint returns data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: ['replaced'] })
    });
    const res = await replaceTagsOnEndpoint({ path: '/x', method: 'GET', tags: ['a'] });
    expect(res).toEqual(['replaced']);
  });

  test('fetchEndpointDetails works', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { detail: true } })
    });
    const data = await fetchEndpointDetails({ endpoint_id: 123, path: '/x', method: 'POST' });
    expect(data).toEqual({ detail: true });
  });

  test('saveApisToLocal stores data in localStorage', () => {
    const mockApis = [{ path: '/test', method: 'GET', tags: ['a'] }];
    saveApisToLocal(mockApis);
    const stored = localStorage.getItem('apiList');
    expect(stored).toBe(JSON.stringify(mockApis));
  });

  test('loadApisFromLocal returns parsed data from localStorage', () => {
    const mockData = [{ path: '/test', method: 'POST', tags: ['b'] }];
    localStorage.setItem('apiList', JSON.stringify(mockData));
    const result = loadApisFromLocal();
    expect(result).toEqual(mockData);
  });

  test('loadApisFromLocal returns empty array if nothing in storage', () => {
    localStorage.clear();
    const result = loadApisFromLocal();
    expect(result).toEqual([]);
  });
// Extra tests for ManageAPIs.js

describe('ManageAPIs (extended)', () => {
  let localStorageMock;

  beforeEach(() => {
    global.fetch = jest.fn();
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: key => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: key => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fetchApiEndpoints throws on API-level error', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'No endpoints' })
    });
    await expect(fetchApiEndpoints(99)).rejects.toThrow('No endpoints');
  });

  test('addTagsToEndpoint throws if backend fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Server error' })
    });
    await expect(addTagsToEndpoint({ path: '/y', method: 'POST', tags: ['fail'] }))
      .rejects.toThrow('Server error');
  });

  test('removeTagsFromEndpoint throws on network error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'network fail' })
    });
    await expect(removeTagsFromEndpoint({ path: '/fail', method: 'DELETE', tags: ['a'] }))
      .rejects.toThrow('network fail');
  });

  test('replaceTagsOnEndpoint throws on no response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Replace failed' })
    });
    await expect(replaceTagsOnEndpoint({ path: '/fail', method: 'PUT', tags: [] }))
      .rejects.toThrow('Replace failed');
  });

  test('fetchEndpointDetails throws on invalid response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Endpoint not found' })
    });
    await expect(fetchEndpointDetails({ endpoint_id: 0, path: '/notfound', method: 'GET' }))
      .rejects.toThrow('Endpoint not found');
  });

  test('saveApisToLocal handles large lists', () => {
    const largeList = Array.from({ length: 1000 }, (_, i) => ({ path: `/api/${i}`, method: 'GET', tags: [] }));
    saveApisToLocal(largeList);
    const stored = localStorage.getItem('apiList');
    expect(JSON.parse(stored).length).toBe(1000);
  });

  test('loadApisFromLocal handles corrupted data gracefully', () => {
    localStorage.setItem('apiList', '{ invalid json }');
    const result = loadApisFromLocal();
    expect(result).toEqual([]);
  });

  test('saveApisToLocal with empty list works', () => {
    saveApisToLocal([]);
    const stored = localStorage.getItem('apiList');
    expect(stored).toBe('[]');
  });

  test('addTagsToEndpoint throws with missing params', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Missing parameters' })
    });
    // Missing path and method, should trigger backend failure
    await expect(addTagsToEndpoint({ tags: ['x'] }))
      .rejects.toThrow('Missing parameters');
  });

  test('replaceTagsOnEndpoint throws if tags is not an array', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Invalid tags' })
    });
    // tags is not an array
    await expect(replaceTagsOnEndpoint({ path: '/z', method: 'PATCH', tags: null }))
      .rejects.toThrow('Invalid tags');
  });

  // You can continue for other unexpected server responses or malformed requests!
});



  


  test('fetchApiEndpoints handles empty response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });
    const data = await fetchApiEndpoints(2);
    expect(data).toEqual([]);
  });

  test('addTagsToEndpoint handles empty tags', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { result: 'ok' } })
    });
    const res = await addTagsToEndpoint({ path: '/empty', method: 'GET', tags: [] });
    expect(res).toEqual({ result: 'ok' });
  });

  test('removeTagsFromEndpoint handles no tags', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { result: 'ok' } })
    });
    const res = await removeTagsFromEndpoint({ path: '/no-tags', method: 'POST', tags: [] });
    expect(res).toEqual({ result: 'ok' });
  });
  test('replaceTagsOnEndpoint handles empty tags', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: ['replaced'] })
    });
    const res = await replaceTagsOnEndpoint({ path: '/replace-empty', method: 'PUT', tags: [] });
    expect(res).toEqual(['replaced']);
  });
global.fetch = jest.fn();
beforeEach(() => {
  fetch.mockClear();
  localStorage.clear();
});

test('APIS_LOCAL_STORAGE_KEY has correct value', () => {
  expect(APIS_LOCAL_STORAGE_KEY).toBe('apiList');
});

test('saveApisToLocal and loadApisFromLocal work', () => {
  const apis = [{ id: 1, name: 'Test API', baseUrl: 'url' }];
  saveApisToLocal(apis);
  expect(loadApisFromLocal()).toEqual(apis);
  // Check corrupted JSON fallback
  localStorage.setItem(APIS_LOCAL_STORAGE_KEY, '{notvalidjson}');
  expect(loadApisFromLocal()).toEqual([]);
});

// Example: API fetch error
test('fetchAllTags throws on bad response', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, message: 'fail' })
  });
  await expect(fetchAllTags()).rejects.toThrow();
});

// Example: Render EndpointTagEditor
test('EndpointTagEditor renders with tags', () => {
  render(
    <EndpointTagEditor
      endpoint={{ path: '/foo', method: 'GET' }}
      allTags={['tag1', 'tag2']}
    />
  );
  expect(screen.getByText(/Available tags/i)).toBeInTheDocument();
  expect(screen.getByText('tag1')).toBeInTheDocument();
});


});