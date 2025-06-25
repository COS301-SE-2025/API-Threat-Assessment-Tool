// ManageAPIs.test.js
import {
  fetchAllTags,
  fetchApiEndpoints,
  addTagsToEndpoint,
  removeTagsFromEndpoint,
  replaceTagsOnEndpoint,
  fetchEndpointDetails
} from '../ManageAPIs';

// Setup fetch mock
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
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
