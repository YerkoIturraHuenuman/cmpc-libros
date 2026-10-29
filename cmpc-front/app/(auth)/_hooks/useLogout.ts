'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';
import { authService } from '../_services/authService';

export function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      router.replace('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo cerrar la sesión'));
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}
