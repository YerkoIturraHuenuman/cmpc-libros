'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getLastRefreshAt, refreshSession } from '@/services/httpClient';
import { authService } from '../_services/authService';
import {
  ACTIVITY_EVENTS,
  RENEW_INTERVAL_MS,
  SESSION_WINDOW_MS,
  WARNING_MS,
} from '../_utils/sessionTiming';

export function useSessionTimeout() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const warningRef = useRef(false);
  const expiredRef = useRef(false);

  const expire = useCallback(async () => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    warningRef.current = false;
    setSecondsLeft(null);
    await authService.logout().catch(() => undefined);
    toast.info('Cerramos tu sesión por inactividad');
    router.replace('/login');
  }, [router]);

  const keepAlive = useCallback(async () => {
    if (await refreshSession()) {
      warningRef.current = false;
      setSecondsLeft(null);
    } else {
      await expire();
    }
  }, [expire]);

  useEffect(() => {
    let active = true;
    let ticker: ReturnType<typeof setInterval> | undefined;

    const onActivity = () => {
      if (warningRef.current || expiredRef.current) return;
      if (Date.now() - getLastRefreshAt() >= RENEW_INTERVAL_MS) {
        void refreshSession();
      }
    };

    const tick = () => {
      const left = getLastRefreshAt() + SESSION_WINDOW_MS - Date.now();
      if (left <= 0) {
        void expire();
        return;
      }
      warningRef.current = left <= WARNING_MS;
      setSecondsLeft(warningRef.current ? Math.ceil(left / 1000) : null);
    };

    void refreshSession().then((ok) => {
      if (!active) return;
      if (!ok) {
        void expire();
        return;
      }
      ticker = setInterval(tick, 1000);
    });

    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, onActivity, { passive: true });
    }

    return () => {
      active = false;
      clearInterval(ticker);
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, onActivity);
      }
    };
  }, [expire]);

  return { secondsLeft, keepAlive, logoutNow: expire };
}
