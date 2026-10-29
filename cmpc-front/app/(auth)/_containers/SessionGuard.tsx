'use client';

import { SessionTimeoutDialog } from '../_components/SessionTimeoutDialog';
import { useSessionTimeout } from '../_hooks/useSessionTimeout';

export function SessionGuard() {
  const { secondsLeft, keepAlive, logoutNow } = useSessionTimeout();

  return (
    <SessionTimeoutDialog
      secondsLeft={secondsLeft}
      onKeepAlive={keepAlive}
      onLogout={logoutNow}
    />
  );
}
