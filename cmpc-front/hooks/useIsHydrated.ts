'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
