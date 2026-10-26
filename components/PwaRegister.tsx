'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/lib/useOnlineStatus';

export function PwaRegister() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [dismissedOffline, setDismissedOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker in all modern environments
    if ('serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[AgeBoard] ServiceWorker registered with scope:', reg.scope);
            reg.update().catch(() => {});
          })
          .catch((err) => {
            console.warn('[AgeBoard] ServiceWorker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register);
      }
    }

    const resetDismissalOnOnline = () => {
      setDismissedOffline(false);
    };

    window.addEventListener('online', resetDismissalOnOnline);

    return () => {
      window.removeEventListener('online', resetDismissalOnOnline);
    };
  }, []);

  return (
    <>
      {/* Offline Toast */}
      {!isOnline && !dismissedOffline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center justify-between gap-3 rounded-2xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/95 dark:bg-amber-950/95 backdrop-blur-md px-4 py-3 text-sm font-semibold text-amber-900 dark:text-amber-100 shadow-xl shadow-amber-950/10 transition-all max-w-md animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-base">
              ⚡
            </div>
            <div>
              <div className="font-bold text-amber-950 dark:text-amber-100">Working Offline</div>
              <div className="text-xs text-amber-800 dark:text-amber-300 font-normal">
                All ages, countdowns, and documents remain 100% accessible.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissedOffline(true)}
            className="rounded-lg p-1 text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 text-xs font-bold transition-colors"
            aria-label="Dismiss offline banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* Back Online Toast */}
      {wasOffline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/95 dark:bg-emerald-950/95 backdrop-blur-md px-4 py-3 text-sm font-semibold text-emerald-900 dark:text-emerald-100 shadow-xl shadow-emerald-950/10 transition-all max-w-md animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-base">
            🟢
          </div>
          <div>
            <div className="font-bold text-emerald-950 dark:text-emerald-100">Back Online</div>
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-normal">
              Internet connection restored.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
