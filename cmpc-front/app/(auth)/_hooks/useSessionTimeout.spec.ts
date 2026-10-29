import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { getLastRefreshAt, refreshSession } from '@/services/httpClient';
import { authService } from '../_services/authService';
import { RENEW_INTERVAL_MS, SESSION_WINDOW_MS, WARNING_MS } from '../_utils/sessionTiming';
import { useSessionTimeout } from './useSessionTimeout';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('sonner', () => ({ toast: { info: jest.fn() } }));
jest.mock('../_services/authService');
jest.mock('@/services/httpClient');

let lastRefresh = 0;

async function mount(refreshOk = true) {
  jest.mocked(refreshSession).mockImplementation(async () => {
    if (refreshOk) lastRefresh = Date.now();
    return refreshOk;
  });
  const hook = renderHook(() => useSessionTimeout());
  await act(async () => {});
  return hook;
}

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

describe('useSessionTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 1_000_000 });
    jest.resetAllMocks();
    lastRefresh = Date.now();
    jest.mocked(getLastRefreshAt).mockImplementation(() => lastRefresh);
    jest.mocked(authService.logout).mockResolvedValue(undefined);
  });
  afterEach(() => jest.useRealTimers());

  it('al entrar renueva la sesión una vez', async () => {
    await mount();
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('si se desmonta antes de que responda la primera renovación, no arranca nada', async () => {
    let finish!: (ok: boolean) => void;
    jest.mocked(refreshSession).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { unmount } = renderHook(() => useSessionTimeout());

    unmount();
    await act(async () => {
      finish(false);
    });
    await advance(SESSION_WINDOW_MS);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('si no puede renovar al entrar, cierra la sesión', async () => {
    await mount(false);

    expect(authService.logout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('no avisa mientras queda tiempo', async () => {
    const { result } = await mount();

    await advance(SESSION_WINDOW_MS - WARNING_MS - 1000);

    expect(result.current.secondsLeft).toBeNull();
  });

  it('avisa con la cuenta regresiva a 60 s del vencimiento', async () => {
    const { result } = await mount();

    await advance(SESSION_WINDOW_MS - WARNING_MS);
    expect(result.current.secondsLeft).toBe(60);

    await advance(10_000);
    expect(result.current.secondsLeft).toBe(50);
  });

  it('cierra la sesión y avisa cuando se acaba el tiempo', async () => {
    const { result } = await mount();

    await advance(SESSION_WINDOW_MS);

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith('Cerramos tu sesión por inactividad');
    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(result.current.secondsLeft).toBeNull();
  });

  it('cierra la sesión una sola vez aunque pasen más ticks', async () => {
    await mount();

    await advance(SESSION_WINDOW_MS + 5000);

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('sigue hacia /login aunque el logout falle', async () => {
    jest.mocked(authService.logout).mockRejectedValue(new Error('401'));
    await mount();

    await advance(SESSION_WINDOW_MS);

    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  describe('actividad', () => {
    it('renueva si la última renovación es antigua', async () => {
      await mount();
      jest.mocked(refreshSession).mockClear();

      await advance(RENEW_INTERVAL_MS);
      act(() => {
        window.dispatchEvent(new Event('keydown'));
      });

      expect(refreshSession).toHaveBeenCalledTimes(1);
    });

    it('no renueva si la última renovación es reciente', async () => {
      await mount();
      jest.mocked(refreshSession).mockClear();

      await advance(RENEW_INTERVAL_MS - 1000);
      act(() => {
        window.dispatchEvent(new Event('pointerdown'));
      });

      expect(refreshSession).not.toHaveBeenCalled();
    });

    it('con el aviso visible la actividad no renueva', async () => {
      const { result } = await mount();
      await advance(SESSION_WINDOW_MS - WARNING_MS);
      expect(result.current.secondsLeft).not.toBeNull();
      jest.mocked(refreshSession).mockClear();

      act(() => {
        window.dispatchEvent(new Event('pointermove'));
      });

      expect(refreshSession).not.toHaveBeenCalled();
    });

    it('al desmontar deja de escuchar', async () => {
      const { unmount } = await mount();
      jest.mocked(refreshSession).mockClear();
      await advance(RENEW_INTERVAL_MS);

      unmount();
      window.dispatchEvent(new Event('keydown'));

      expect(refreshSession).not.toHaveBeenCalled();
    });
  });

  describe('keepAlive', () => {
    it('renueva y quita el aviso', async () => {
      const { result } = await mount();
      await advance(SESSION_WINDOW_MS - WARNING_MS);
      expect(result.current.secondsLeft).toBe(60);

      await act(() => result.current.keepAlive());
      await advance(1000);

      expect(result.current.secondsLeft).toBeNull();
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('si no puede renovar, cierra la sesión', async () => {
      const { result } = await mount();
      jest.mocked(refreshSession).mockResolvedValue(false);

      await act(() => result.current.keepAlive());

      expect(authService.logout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('logoutNow cierra la sesión de inmediato', async () => {
    const { result } = await mount();

    await act(() => result.current.logoutNow());

    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
