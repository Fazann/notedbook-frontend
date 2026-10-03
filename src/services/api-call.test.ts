import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '@/lib/env';

import { ApiEndpoint, buildPath } from './api-endpoints';
import { REFRESH_TOKEN_COOKIE, tokenStore } from './token-store';

type Reply = { status: number; data?: unknown } | 'network';
type Handler = (config: InternalAxiosRequestConfig) => Reply;

let handler: Handler;
const calls: { path: string; auth?: string }[] = [];

// Every request (the app instance and the bare refresh call) goes through this fake adapter.
axios.defaults.adapter = async (config) => {
  const path = (config.url ?? '').replace(env.apiUrl, '');
  calls.push({ path, auth: config.headers.Authorization as string | undefined });
  const reply = handler(config);
  if (reply === 'network') throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
  const response: AxiosResponse = {
    status: reply.status,
    statusText: '',
    data: reply.data ?? '',
    headers: {},
    config,
  };
  if (reply.status >= 400) throw new AxiosError('fail', AxiosError.ERR_BAD_REQUEST, config, null, response);
  return response;
};

// Imported after the adapter is set, because `axios.create` copies the defaults.
const { apiCall, ApiError, setUnauthorizedHandler, startSession } = await import('./api-call');

const fakeJwt = (name: string) => `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.${name}`;
const ok = (data: unknown): Reply => ({ status: 200, data: { message: 'SUCCESS', data, status_code: 200 } });
const expired: Reply = { status: 401, data: { code: 'TOKEN_EXPIRED', message: 'expired' } };
const newTokens = { access_token: 'access-2', refresh_token: fakeJwt('refresh-2') };

/** API where `access-1` is expired and the refresh token can be traded for `access-2`. */
const sessionApi: Handler = (config) => {
  if (config.url?.endsWith(ApiEndpoint.AuthRefreshToken)) return ok(newTokens);
  return config.headers.Authorization === 'Bearer access-2' ? ok({ id: 1 }) : expired;
};

const refreshCalls = () => calls.filter((c) => c.path === ApiEndpoint.AuthRefreshToken).length;

describe('apiCall', () => {
  const onUnauthorized = vi.fn();

  beforeEach(() => {
    calls.length = 0;
    tokenStore.clear();
    onUnauthorized.mockReset();
    setUnauthorizedHandler(onUnauthorized);
  });

  it('sends the access token and unwraps `data`', async () => {
    startSession({ access_token: 'access-2', refresh_token: fakeJwt('refresh-1') });
    handler = sessionApi;
    await expect(apiCall.get('/plans')).resolves.toEqual({ id: 1 });
    expect(calls).toEqual([{ path: '/plans', auth: 'Bearer access-2' }]);
  });

  it('refreshes an expired token once for parallel requests and replays them', async () => {
    startSession({ access_token: 'access-1', refresh_token: fakeJwt('refresh-1') });
    handler = sessionApi;
    const results = await Promise.all([apiCall.get('/plans'), apiCall.get('/expenses')]);
    expect(results).toEqual([{ id: 1 }, { id: 1 }]);
    expect(refreshCalls()).toBe(1);
    expect(tokenStore.getAccessToken()).toBe('access-2');
    expect(tokenStore.getRefreshToken()).toBe(newTokens.refresh_token);
  });

  it('refreshes before the first request after a reload (refresh cookie only)', async () => {
    tokenStore.setTokens({ access_token: '', refresh_token: fakeJwt('refresh-1') });
    handler = sessionApi;
    await expect(apiCall.get('/plans')).resolves.toEqual({ id: 1 });
    expect(calls.map((c) => c.path)).toEqual([ApiEndpoint.AuthRefreshToken, '/plans']);
  });

  it('ends the session when the refresh token is rejected', async () => {
    startSession({ access_token: 'access-1', refresh_token: fakeJwt('refresh-1') });
    handler = (config) =>
      config.url?.endsWith(ApiEndpoint.AuthRefreshToken) ? { status: 401, data: { code: 'UNAUTHORIZED' } } : expired;
    await expect(apiCall.get('/plans')).rejects.toMatchObject({ status: 401, code: 'TOKEN_EXPIRED' });
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(document.cookie).not.toContain(`${REFRESH_TOKEN_COOKIE}=`);
  });

  it('keeps the session when the refresh fails on the network', async () => {
    startSession({ access_token: 'access-1', refresh_token: fakeJwt('refresh-1') });
    handler = (config) => (config.url?.endsWith(ApiEndpoint.AuthRefreshToken) ? 'network' : expired);
    await expect(apiCall.get('/plans')).rejects.toMatchObject({ status: 0, code: 'network' });
    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(tokenStore.getRefreshToken()).toBe(fakeJwt('refresh-1'));
  });

  it('does not refresh on a 401 from login (wrong credentials)', async () => {
    startSession({ access_token: 'access-1', refresh_token: fakeJwt('refresh-1') });
    handler = () => ({ status: 401, data: { code: 'INVALID_CREDENTIALS', message: 'Invalid' } });
    const error = await apiCall.post(ApiEndpoint.AuthLogin, {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(refreshCalls()).toBe(0);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('maps validation errors to fields', async () => {
    startSession({ access_token: 'access-2', refresh_token: fakeJwt('refresh-1') });
    handler = () => ({
      status: 400,
      data: { code: 'VALIDATION_FAILED', message: 'bad', errors: [{ field: 'title', message: 'Too long' }] },
    });
    await expect(apiCall.post('/plans', {})).rejects.toMatchObject({ fields: { title: 'Too long' } });
  });

  it('converts a paged body into Paginated and sends `limit`', async () => {
    startSession({ access_token: 'access-2', refresh_token: fakeJwt('refresh-1') });
    let params: unknown;
    handler = (config) => {
      params = config.params;
      return { status: 200, data: { data: [{ id: 1 }], total: 21, total_page: 3, is_next: true, is_prev: true } };
    };
    const page = await apiCall.getPage('/expenses', { page: 2, pageSize: 10, q: undefined });
    expect(params).toEqual({ q: undefined, page: 2, limit: 10 });
    expect(page).toEqual({ data: [{ id: 1 }], meta: { page: 2, pageSize: 10, total: 21, totalPages: 3 } });
  });
});

describe('buildPath', () => {
  it('fills and encodes path params', () => {
    expect(buildPath(ApiEndpoint.PlanSteps, { id: 3 })).toBe('/plans/3/steps');
    expect(buildPath(ApiEndpoint.CategoryDetail, { id: 'a/b' })).toBe('/categories/a%2Fb');
  });

  it('throws on a missing param', () => {
    expect(() => buildPath(ApiEndpoint.PlanDetail, {})).toThrow('Missing path param "id"');
  });
});
