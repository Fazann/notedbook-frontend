import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/lib/env';
import type { Paginated } from '@/lib/list';

import { ApiEndpoint, PUBLIC_ENDPOINTS } from './api-endpoints';
import { type Tokens, tokenStore } from './token-store';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Every success body of the Go API. */
type SuccessBody<T> = { message: string; data: T; status_code: number };

/** Body of a paged list (`response.Paginate` in the Go API). */
type PageBody<T> = { data: T[]; total: number; total_page: number; is_next: boolean; is_prev: boolean };

type ErrorBody = {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
  /** The Go API lists invalid fields here when `code` is `VALIDATION_FAILED`. */
  errors?: { field: string; message: string }[];
};

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/** Query string values; `undefined` ones are left out. */
export type QueryParams = Record<string, string | number | boolean | undefined>;

function fieldErrors(data: ErrorBody): Record<string, string> | undefined {
  if (data.fields) return data.fields;
  if (!data.errors?.length) return undefined;
  return Object.fromEntries(data.errors.map((e) => [e.field, e.message]));
}

function toApiError(error: unknown): unknown {
  if (!axios.isAxiosError<ErrorBody>(error)) return error;
  const res = error.response;
  if (!res) return new ApiError(0, 'network', 'Network error');
  const data: ErrorBody = res.data && typeof res.data === 'object' ? res.data : {};
  return new ApiError(res.status, data.code ?? 'unknown', data.message ?? res.statusText, fieldErrors(data));
}

const isPublic = (url: string | undefined) => url !== undefined && PUBLIC_ENDPOINTS.has(url);

let onUnauthorized: (() => void) | undefined;

/** Registered by the app providers: clears the query cache and goes to /login. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

function endSession() {
  tokenStore.clear();
  onUnauthorized?.();
}

let refreshing: Promise<string | null> | null = null;

/**
 * Trades the refresh token for a new token pair; parallel callers share one request.
 * Resolves `null` when there is no session to refresh (no cookie, or the API rejected it).
 * A network or server error rejects, so a bad connection does not log the user out.
 */
function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return Promise.resolve(null);
  refreshing ??= axios
    .post<SuccessBody<Tokens>>(`${env.apiUrl}${ApiEndpoint.AuthRefreshToken}`, { refresh_token: refreshToken })
    .then(({ data }) => {
      tokenStore.setTokens(data.data);
      return data.data.access_token;
    })
    .catch((error: unknown) => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === undefined || status >= 500) throw error;
      tokenStore.clear();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

const http = axios.create({ baseURL: env.apiUrl });

http.interceptors.request.use(async (config) => {
  // The API translates messages by Accept-Language; send the app's locale, not the browser's.
  if (typeof document !== 'undefined' && document.documentElement.lang) {
    config.headers.set('Accept-Language', document.documentElement.lang, false);
  }
  if (isPublic(config.url)) return config;
  // After a reload only the refresh token is left, so get a new access token before the first call.
  const token = tokenStore.getAccessToken() || (await refreshAccessToken());
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) throw toApiError(error);
  const config = error.config as RetryConfig | undefined;
  if (!config || isPublic(config.url)) throw toApiError(error);

  // Expired access token: refresh once and replay the request.
  if (!config._retried) {
    config._retried = true;
    let token: string | null;
    try {
      token = await refreshAccessToken();
    } catch (refreshError) {
      throw toApiError(refreshError);
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return http(config);
    }
  }

  endSession();
  throw toApiError(error);
});

async function unwrap<T>(request: Promise<AxiosResponse<SuccessBody<T> | ''>>): Promise<T> {
  const { data } = await request;
  // 204 No Content has an empty body.
  return (data === '' ? undefined : data.data) as T;
}

/**
 * The only way the app talks to the API. Adds the access token, refreshes it when it expires,
 * unwraps `{ data }` from the response and throws `ApiError` on failure.
 */
export const apiCall = {
  get: <T>(url: string, params?: QueryParams) => unwrap<T>(http.get(url, { params })),

  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => unwrap<T>(http.post(url, body, config)),

  put: <T>(url: string, body?: unknown, params?: QueryParams) => unwrap<T>(http.put(url, body, { params })),

  patch: <T>(url: string, body?: unknown) => unwrap<T>(http.patch(url, body)),

  delete: <T = void>(url: string, params?: QueryParams) => unwrap<T>(http.delete(url, { params })),

  /** GETs one page of a list (`page` / `limit` query) and returns it as `Paginated<T>`. */
  async getPage<T>(url: string, { page, pageSize, ...params }: QueryParams & { page: number; pageSize: number }) {
    const { data } = await http.get<PageBody<T>>(url, { params: { ...params, page, limit: pageSize } });
    return {
      data: data.data,
      meta: { page, pageSize, total: data.total, totalPages: data.total_page },
    } satisfies Paginated<T>;
  },
};

/** Saves the tokens from login / register; later calls send them automatically. */
export function startSession(tokens: Tokens) {
  tokenStore.setTokens(tokens);
}

/** Forgets the tokens (the API has no logout endpoint yet). */
export function clearSession() {
  tokenStore.clear();
}
