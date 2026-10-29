import { redirectToLogin } from './navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(
  /\/$/,
  '',
);

const REFRESH_PATH = '/auth/refresh';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly messages: string[] = [message],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  json?: unknown;
  body?: FormData;
  skipRefresh?: boolean;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

interface ErrorBody {
  message?: string | string[];
}

let refreshing: Promise<boolean> | null = null;
let lastRefreshAt = Date.now();

export function getLastRefreshAt(): number {
  return lastRefreshAt;
}

function postRefresh(): Promise<boolean> {
  return fetch(`${API_URL}${REFRESH_PATH}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
    .then((response) => response.ok)
    .catch(() => false);
}

export function refreshSession(): Promise<boolean> {
  refreshing ??= (
    typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('cmpc-auth-refresh', postRefresh)
      : postRefresh()
  )
    .then((ok) => {
      if (ok) lastRefreshAt = Date.now();
      return ok;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as ErrorBody | null;
  const messages = [body?.message ?? response.statusText].flat();
  return new ApiError(response.status, messages.join('. '), messages);
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { json, headers, body, method, signal } = options;
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      signal,
      credentials: 'include',
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : body,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }
}

async function fetchWithSession(
  path: string,
  options: RequestOptions,
): Promise<Response> {
  let response = await send(path, options);

  if (response.status === 401 && !options.skipRefresh) {
    if (await refreshSession()) {
      response = await send(path, options);
    }
    if (response.status === 401 && typeof window !== 'undefined') {
      redirectToLogin();
    }
  }

  return response;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetchWithSession(path, options);

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as Envelope<T>;
  return body.data;
}

export async function requestPage<T>(
  path: string,
  options: RequestOptions = {},
): Promise<Page<T>> {
  const response = await fetchWithSession(path, options);

  if (!response.ok) {
    throw await toApiError(response);
  }

  const body = (await response.json()) as Envelope<T[]> & { meta: PageMeta };
  return { items: body.data, meta: body.meta };
}

export async function requestBlob(
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  const response = await fetchWithSession(path, options);

  if (!response.ok) {
    throw await toApiError(response);
  }
  return response.blob();
}
