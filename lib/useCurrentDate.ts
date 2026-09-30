'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook that tracks the current calendar date and triggers a re-render
 * exactly when the date rolls over at local midnight, or when the user returns
 * to the page the next day.
 *
 * This avoids high-frequency polling while guaranteeing real-time calendar accuracy.
 */
export function useCurrentDate(): Date {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    function scheduleNextMidnightUpdate() {
      const now = new Date();
      // Calculate milliseconds until next midnight + 1 second
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
      );
      const delay = Math.max(1000, midnight.getTime() - now.getTime());

      timerId = setTimeout(() => {
        setCurrentDate(new Date());
        scheduleNextMidnightUpdate();
      }, delay);
    }

    scheduleNextMidnightUpdate();

    // Check for date change when tab is refocused or becomes visible
    function handleVisibilityOrFocus() {
      const now = new Date();
      setCurrentDate((prev) => {
        // If calendar day changed, update state
        if (
          now.getDate() !== prev.getDate() ||
          now.getMonth() !== prev.getMonth() ||
          now.getFullYear() !== prev.getFullYear()
        ) {
          return now;
        }
        return prev;
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  return currentDate;
}
