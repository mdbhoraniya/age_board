'use client';

import React from 'react';
import { LayoutView } from '@/types/person';

type ViewToggleProps = {
  view: LayoutView;
  onViewChange: (view: LayoutView) => void;
};

export const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
  return (
    <div
      role="group"
      aria-label="Display Layout Toggle"
      className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-xs"
    >
      <button
        type="button"
        onClick={() => onViewChange('grid')}
        aria-pressed={view === 'grid'}
        title="Card Grid View"
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
          view === 'grid'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <span>▦</span>
        <span className="hidden sm:inline">Cards</span>
      </button>

      <button
        type="button"
        onClick={() => onViewChange('compact')}
        aria-pressed={view === 'compact'}
        title="Compact List View"
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
          view === 'compact'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <span>☰</span>
        <span className="hidden sm:inline">Compact</span>
      </button>

      <button
        type="button"
        onClick={() => onViewChange('timeline')}
        aria-pressed={view === 'timeline'}
        title="Calendar Timeline View"
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
          view === 'timeline'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <span>📅</span>
        <span className="hidden sm:inline">Timeline</span>
      </button>
    </div>
  );
};
