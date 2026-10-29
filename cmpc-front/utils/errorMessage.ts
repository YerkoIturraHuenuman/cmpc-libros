import { ApiError } from '@/services/httpClient';

export function getErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo.',
): string {
  return error instanceof ApiError ? error.message : fallback;
}
