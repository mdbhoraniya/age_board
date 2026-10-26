'use client';

import { useSyncExternalStore, useState, useEffect, useRef } from 'react';

export type OnlineStatus = {
  isOnline: boolean;
  wasOffline: boolean;
};

function subscribeOnline(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function getServerSnapshot(): boolean {
  return true;
}

/**
 * Custom hook that tracks browser network connectivity in real-time.
 * Uses React 19's useSyncExternalStore for hydration-safe external store subscription.
 */
export function useOnlineStatus(): OnlineStatus {
  const isOnline = useSyncExternalStore(subscribeOnline, getSnapshot, getServerSnapshot);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const prevOnlineRef = useRef<boolean>(isOnline);

  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      setWasOffline(true);
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  return { isOnline, wasOffline };
}
