import { ApiError } from '@/services/httpClient';
import { getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  it('usa el mensaje de un ApiError', () => {
    expect(getErrorMessage(new ApiError(400, 'precio inválido'))).toBe('precio inválido');
  });

  it('usa el mensaje por defecto con cualquier otro error', () => {
    expect(getErrorMessage(new Error('interno'))).toBe(
      'Ocurrió un error inesperado. Inténtalo de nuevo.',
    );
  });

  it('acepta un mensaje por defecto propio', () => {
    expect(getErrorMessage('x', 'No se pudo')).toBe('No se pudo');
  });
});
