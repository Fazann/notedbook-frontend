import { env } from './env';

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

type ErrorBody = {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
  /** The Go API lists invalid fields here when `code` is `VALIDATION_FAILED`. */
  errors?: { field: string; message: string }[];
};

function fieldErrors(data: ErrorBody): Record<string, string> | undefined {
  if (data.fields) return data.fields;
  if (!data.errors?.length) return undefined;
  return Object.fromEntries(data.errors.map((e) => [e.field, e.message]));
}

let onUnauthorized: (() => void) | undefined;

/** Registered by the app providers: clears the query cache and goes to /login. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
      method,
      credentials: 'include',
      // FormData sets its own multipart Content-Type (with the boundary).
      headers: body === undefined || body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network', 'Network error');
  }

  // A 401 from /auth/* means wrong credentials (shown by the form), not an expired session.
  if (res.status === 401 && !path.startsWith('/auth/')) {
    onUnauthorized?.();
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(res.status, data.code ?? 'unknown', data.message ?? res.statusText, fieldErrors(data));
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
