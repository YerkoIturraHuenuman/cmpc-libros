import {
  ApiError,
  getLastRefreshAt,
  refreshSession,
  request,
  requestBlob,
  requestPage,
} from './httpClient';
import { redirectToLogin } from './navigation';

jest.mock('./navigation', () => ({ redirectToLogin: jest.fn() }));

interface FakeBody {
  data?: unknown;
  meta?: unknown;
  message?: string | string[];
}

function response(status: number, body?: FakeBody, extra: Partial<Response> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `status ${status}`,
    json: jest.fn().mockResolvedValue(body),
    blob: jest.fn().mockResolvedValue(new Blob(['csv'])),
    ...extra,
  } as unknown as Response;
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  jest.mocked(redirectToLogin).mockClear();
});

describe('request', () => {
  it('devuelve el `data` de la respuesta y manda las cookies', async () => {
    fetchMock.mockResolvedValue(response(200, { data: { id: 1 } }));

    await expect(request('/ping')).resolves.toEqual({ id: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/ping',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('envía JSON con su Content-Type', async () => {
    fetchMock.mockResolvedValue(response(200, { data: null }));

    await request('/auth/login', { method: 'POST', json: { a: 1 } });

    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('envía FormData sin Content-Type para que el navegador ponga el boundary', async () => {
    fetchMock.mockResolvedValue(response(200, { data: null }));
    const body = new FormData();

    await request('/books', { method: 'POST', body });

    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe(body);
    expect(init.headers).toEqual({});
  });

  it('devuelve undefined ante un 204', async () => {
    fetchMock.mockResolvedValue(response(204));
    await expect(request('/books/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('lanza ApiError con todos los mensajes de validación', async () => {
    fetchMock.mockResolvedValue(
      response(400, { message: ['price inválido', 'title vacío'] }),
    );

    const error = await request('/books').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: 'price inválido. title vacío',
      messages: ['price inválido', 'title vacío'],
    });
  });

  it('usa el statusText si el cuerpo del error no es JSON', async () => {
    fetchMock.mockResolvedValue(
      response(500, undefined, {
        json: jest.fn().mockRejectedValue(new Error('no json')),
      }),
    );

    await expect(request('/books')).rejects.toMatchObject({
      status: 500,
      message: 'status 500',
    });
  });

  it('traduce un fallo de red a ApiError con status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(request('/books')).rejects.toMatchObject({
      status: 0,
      message: 'No se pudo conectar con el servidor',
    });
  });
});

describe('renovación de sesión ante un 401', () => {
  it('renueva una vez y reintenta la petición', async () => {
    fetchMock
      .mockResolvedValueOnce(response(401, { message: 'expirado' }))
      .mockResolvedValueOnce(response(200, { data: {} }))
      .mockResolvedValueOnce(response(200, { data: 'ok' }));

    await expect(request('/books')).resolves.toBe('ok');

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3001/books',
      'http://localhost:3001/auth/refresh',
      'http://localhost:3001/books',
    ]);
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it('manda a /login si la renovación falla', async () => {
    fetchMock
      .mockResolvedValueOnce(response(401, { message: 'expirado' }))
      .mockResolvedValueOnce(response(401, { message: 'sesión inválida' }));

    await expect(request('/books')).rejects.toMatchObject({ status: 401 });

    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it('manda a /login si el reintento sigue dando 401', async () => {
    fetchMock
      .mockResolvedValueOnce(response(401, { message: 'x' }))
      .mockResolvedValueOnce(response(200, { data: {} }))
      .mockResolvedValueOnce(response(401, { message: 'x' }));

    await expect(request('/books')).rejects.toMatchObject({ status: 401 });

    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it('no intenta renovar con skipRefresh (login)', async () => {
    fetchMock.mockResolvedValue(response(401, { message: 'Credenciales inválidas' }));

    await expect(
      request('/auth/login', { method: 'POST', json: {}, skipRefresh: true }),
    ).rejects.toMatchObject({ status: 401, message: 'Credenciales inválidas' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it('varias peticiones que fallan a la vez comparten una sola renovación', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(response(200, { data: {} }));
      const alreadyRetried = fetchMock.mock.calls.filter(([u]) => u === url).length > 1;
      return Promise.resolve(
        alreadyRetried ? response(200, { data: 'ok' }) : response(401, { message: 'x' }),
      );
    });

    await Promise.all([request('/a'), request('/b')]);

    const refreshes = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith('/auth/refresh'),
    );
    expect(refreshes).toHaveLength(1);
  });
});

describe('refreshSession', () => {
  it('actualiza el momento de la última renovación si sale bien', async () => {
    fetchMock.mockResolvedValue(response(200, { data: {} }));
    const before = getLastRefreshAt();
    jest.spyOn(Date, 'now').mockReturnValue(before + 12_345);

    await expect(refreshSession()).resolves.toBe(true);

    expect(getLastRefreshAt()).toBe(before + 12_345);
    jest.restoreAllMocks();
  });

  it('no lo actualiza si falla y devuelve false ante un error de red', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));
    const before = getLastRefreshAt();

    await expect(refreshSession()).resolves.toBe(false);

    expect(getLastRefreshAt()).toBe(before);
  });

  it('usa navigator.locks cuando existe, para serializar entre pestañas', async () => {
    fetchMock.mockResolvedValue(response(200, { data: {} }));
    const locks = {
      request: jest.fn((_name: string, callback: () => Promise<boolean>) => callback()),
    };
    Object.defineProperty(navigator, 'locks', { value: locks, configurable: true });

    await expect(refreshSession()).resolves.toBe(true);

    expect(locks.request).toHaveBeenCalledWith('cmpc-auth-refresh', expect.any(Function));
    Reflect.deleteProperty(navigator, 'locks');
  });
});

describe('requestPage', () => {
  it('devuelve los items y el meta', async () => {
    const meta = { page: 2, limit: 10, total: 25, totalPages: 3 };
    fetchMock.mockResolvedValue(response(200, { data: [{ id: 'a' }], meta }));

    await expect(requestPage('/books')).resolves.toEqual({ items: [{ id: 'a' }], meta });
  });

  it('lanza ApiError si falla', async () => {
    fetchMock.mockResolvedValue(response(403, { message: 'prohibido' }));
    await expect(requestPage('/books')).rejects.toMatchObject({ status: 403 });
  });
});

describe('requestBlob', () => {
  it('devuelve el archivo', async () => {
    fetchMock.mockResolvedValue(response(200));
    await expect(requestBlob('/books/export')).resolves.toBeInstanceOf(Blob);
  });

  it('lanza ApiError si falla', async () => {
    fetchMock.mockResolvedValue(response(500, { message: 'boom' }));
    await expect(requestBlob('/books/export')).rejects.toMatchObject({ message: 'boom' });
  });
});
