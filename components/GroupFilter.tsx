'use client';

import React from 'react';
import { Person } from '@/types/person';

type GroupFilterProps = {
  groups: string[];
  selectedGroup: string | null;
  onSelectGroup: (group: string | null) => void;
  people: Person[];
};

export const GroupFilter: React.FC<GroupFilterProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  people,
}) => {
  if (groups.length === 0) return null;

  // Calculate count per group
  const counts: Record<string, number> = {};
  for (const p of people) {
    if (p.group) {
      counts[p.group] = (counts[p.group] || 0) + 1;
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar mb-4">
      {/* All Option */}
      <button
        type="button"
        onClick={() => onSelectGroup(null)}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
          selectedGroup === null
            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
        }`}
      >
        <span>All</span>
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] ${
            selectedGroup === null
              ? 'bg-blue-700/60 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          {people.length}
        </span>
      </button>

      {/* Each Custom Group */}
      {groups.map((group) => {
        const isSelected = selectedGroup === group;
        const count = counts[group] || 0;

        return (
          <button
            key={group}
            type="button"
            onClick={() => onSelectGroup(isSelected ? null : group)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <span>📁 {group}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                isSelected
                  ? 'bg-blue-700/60 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
