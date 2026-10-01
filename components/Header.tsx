'use client';

import React from 'react';

type HeaderProps = {
  totalCount: number;
  onAddPerson: () => void;
  onOpenShare: () => void;
  onOpenWidget: () => void;
};

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  onAddPerson,
  onOpenShare,
  onOpenWidget,
}) => {
  return (
    <header className="pt-8 pb-6 sm:pt-10 sm:pb-8">
      {/* Top bar with Privacy Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>100% Private · Stays on your device</span>
        </div>

        {totalCount > 0 && (
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tracking {totalCount} {totalCount === 1 ? 'person' : 'people'}
          </div>
        )}
      </div>

      {/* Main Branding & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xl shadow-md shadow-blue-500/20">
              ⏳
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              AgeBoard
            </h1>
          </div>
          <p className="mt-1.5 text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium">
            Everyone&apos;s age at a glance
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {totalCount > 0 && (
            <>
              <button
                type="button"
                onClick={onOpenWidget}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition-all shadow-xs"
                title="Home Screen Widgets Setup & Preview"
              >
                <span>📱</span>
                <span className="hidden sm:inline">Widgets</span>
              </button>

              <button
                type="button"
                onClick={onOpenShare}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition-all shadow-xs"
              >
                <span>📤</span>
                <span className="hidden sm:inline">Share</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onAddPerson}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-98 transition-all"
          >
            <span className="text-lg font-bold leading-none">+</span>
            <span>Add Person</span>
          </button>
        </div>
      </div>
    </header>
  );
};
