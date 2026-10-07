'use client';

import React, { useState } from 'react';
import { ExpiryDashboardSummary } from '@/types/expiry';

type ExpiringDocsBannerProps = {
  summary: ExpiryDashboardSummary;
  onOpenDashboard: () => void;
};

export const ExpiringDocsBanner: React.FC<ExpiringDocsBannerProps> = ({
  summary,
  onOpenDashboard,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (summary.totalAlerts === 0 || isDismissed) {
    return null;
  }

  const hasExpired = summary.expired.length > 0;
  const topAlert = summary.expired[0] || summary.expiringSoon[0];

  return (
    <div
      role="alert"
      className={`relative mb-5 overflow-hidden rounded-2xl border p-4 sm:p-4.5 transition-all animate-fade-in shadow-xs ${
        hasExpired
          ? 'border-rose-300 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/30'
          : 'border-amber-300 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/30'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Pulse dot, Icon & Summary */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${
              hasExpired
                ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            {hasExpired ? '🚨' : '⚠️'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  hasExpired
                    ? 'bg-rose-200 text-rose-900 dark:bg-rose-900/80 dark:text-rose-200'
                    : 'bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping"></span>
                {summary.totalAlerts} {summary.totalAlerts === 1 ? 'Document Alert' : 'Document Alerts'}
              </span>

              {summary.expired.length > 0 && (
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  ({summary.expired.length} expired)
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 truncate">
              {topAlert && (
                <>
                  <strong className="font-bold">{topAlert.person.name}</strong>&apos;s{' '}
                  <span className="font-semibold">{topAlert.document.title}</span> —{' '}
                  <span
                    className={
                      topAlert.expiryStatus.status === 'expired'
                        ? 'text-rose-700 dark:text-rose-400 font-bold'
                        : 'text-amber-700 dark:text-amber-400 font-bold'
                    }
                  >
                    {topAlert.expiryStatus.label}
                  </span>
                  {summary.totalAlerts > 1 && (
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      {' '}
                      and {summary.totalAlerts - 1} more
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: CTA Button & Dismiss */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={onOpenDashboard}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 ${
              hasExpired
                ? 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500'
                : 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500'
            }`}
          >
            <span>Review Alerts</span>
            <span>→</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss banner for now"
            title="Dismiss banner for this session"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
