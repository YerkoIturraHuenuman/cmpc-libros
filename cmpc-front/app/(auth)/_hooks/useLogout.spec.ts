import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { ApiError } from '@/services/httpClient';
import { authService } from '../_services/authService';
import { useLogout } from './useLogout';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
jest.mock('../_services/authService');

describe('useLogout', () => {
  beforeEach(() => jest.resetAllMocks());

  it('cierra la sesión y va a /login', async () => {
    jest.mocked(authService.logout).mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogout());

    await act(() => result.current.logout());

    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('si falla avisa y se queda en la página', async () => {
    jest.mocked(authService.logout).mockRejectedValue(new ApiError(500, 'caído'));
    const { result } = renderHook(() => useLogout());

    await act(() => result.current.logout());

    expect(toast.error).toHaveBeenCalledWith('caído');
    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.isLoggingOut).toBe(false);
  });
});
