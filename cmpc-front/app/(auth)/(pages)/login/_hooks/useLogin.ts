'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { ApiError } from '@/services/httpClient';
import { authService } from '../../../_services/authService';
import { loginSchema, type LoginValues } from '../../../_utils/loginSchema';

const AFTER_LOGIN_PATH = '/books';

export function useLogin() {
  const router = useRouter();
  const isHydrated = useIsHydrated();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await authService.login(values);
      router.replace(AFTER_LOGIN_PATH);
    } catch (error) {
      setServerError(toMessage(error));
    }
  });

  return {
    form,
    onSubmit,
    serverError,
    isSubmitting: form.formState.isSubmitting,
    isReady: isHydrated,
  };
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 401
      ? 'Correo o contraseña incorrectos'
      : error.message;
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
