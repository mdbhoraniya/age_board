'use client';

import React from 'react';
import { SortOption, LayoutView } from '@/types/person';
import { ViewToggle } from './ViewToggle';

type SearchAndSortProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  layoutView: LayoutView;
  onLayoutViewChange: (view: LayoutView) => void;
  showSearch: boolean;
};

export const SearchAndSort: React.FC<SearchAndSortProps> = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  layoutView,
  onLayoutViewChange,
  showSearch,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      {/* Search Bar */}
      {showSearch ? (
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-9 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <div />
      )}

      {/* Controls Right: View Toggle + Sort Dropdown */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
        {/* Layout Toggle */}
        <ViewToggle view={layoutView} onViewChange={onLayoutViewChange} />

        {/* Sort Options */}
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="sort-select"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:inline"
          >
            Sort:
          </label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="custom">Custom Order</option>
            <option value="birthday-soon">🎂 Upcoming Birthday</option>
            <option value="age-desc">⏳ Age (Oldest)</option>
            <option value="age-asc">👶 Age (Youngest)</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
