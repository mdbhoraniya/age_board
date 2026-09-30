'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('AgeNow ServiceWorker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('AgeNow ServiceWorker registration failed:', err);
        });
    }
  }, []);

  return null;
}
