import { act, renderHook } from '@testing-library/react';
import { ApiError } from '@/services/httpClient';
import { authService } from '../../../_services/authService';
import { useLogin } from './useLogin';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('../../../_services/authService');

function setup() {
  const hook = renderHook(() => useLogin());
  act(() => {
    hook.result.current.form.setValue('email', 'admin@cmpc.test');
    hook.result.current.form.setValue('password', 'Admin1234!');
  });
  return hook;
}

describe('useLogin', () => {
  beforeEach(() => jest.resetAllMocks());

  it('inicia sesión y va a /books', async () => {
    jest.mocked(authService.login).mockResolvedValue({} as never);
    const { result } = setup();

    await act(() => result.current.onSubmit());

    expect(authService.login).toHaveBeenCalledWith({
      email: 'admin@cmpc.test',
      password: 'Admin1234!',
    });
    expect(mockReplace).toHaveBeenCalledWith('/books');
  });

  it('está listo en el cliente', () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.isReady).toBe(true);
  });

  it('no consulta la API con datos inválidos', async () => {
    const { result } = renderHook(() => useLogin());

    await act(() => result.current.onSubmit());

    expect(authService.login).not.toHaveBeenCalled();
    expect(result.current.form.formState.errors.email?.message).toBe('Ingresa tu correo');
  });

  it('un 401 muestra un mensaje genérico de credenciales', async () => {
    jest.mocked(authService.login).mockRejectedValue(new ApiError(401, 'Credenciales inválidas'));
    const { result } = setup();

    await act(() => result.current.onSubmit());

    expect(result.current.serverError).toBe('Correo o contraseña incorrectos');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('otros errores de la API muestran su mensaje', async () => {
    jest.mocked(authService.login).mockRejectedValue(new ApiError(0, 'No se pudo conectar'));
    const { result } = setup();

    await act(() => result.current.onSubmit());

    expect(result.current.serverError).toBe('No se pudo conectar');
  });

  it('un error desconocido muestra un mensaje general', async () => {
    jest.mocked(authService.login).mockRejectedValue(new Error('raro'));
    const { result } = setup();

    await act(() => result.current.onSubmit());

    expect(result.current.serverError).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
