'use client';

import React from 'react';

type EmptyStateProps = {
  onAddPerson: () => void;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddPerson }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-8 sm:p-12 text-center shadow-xs">
      {/* Decorative Icon Graphic */}
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-3xl shadow-inner border border-blue-100 dark:border-blue-900/40">
        <span>👨‍👩‍👧‍👦</span>
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-xs">
          ✨
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        No people added yet
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        Add family members, children, parents, friends, or anyone whose age you want to keep track of at a glance.
      </p>

      {/* Action Button */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onAddPerson}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-98 transition-all"
        >
          <span className="text-base font-bold">+</span>
          <span>Add Person</span>
        </button>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span>🔒</span>
        <span>Your data never leaves your device. Stored locally only.</span>
      </div>
    </div>
  );
};
