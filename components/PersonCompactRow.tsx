'use client';

import React from 'react';
import { Person } from '@/types/person';
import {
  calculateAge,
  calculateBirthdayInfo,
  formatAge,
  formatDateDisplay,
  getGeneration,
} from '@/lib/age';

type PersonCompactRowProps = {
  person: Person;
  currentDate: Date;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  showCustomReorder?: boolean;
};

export const PersonCompactRow: React.FC<PersonCompactRowProps> = ({
  person,
  currentDate,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  showCustomReorder,
}) => {
  const age = calculateAge(person.dateOfBirth, currentDate);
  const bdayInfo = calculateBirthdayInfo(person.dateOfBirth, currentDate);
  const formattedDob = formatDateDisplay(person.dateOfBirth);
  const ageSummary = formatAge(age);
  const generation = getGeneration(person.dateOfBirth);

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-600',
      'from-cyan-500 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const initial = person.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-all shadow-2xs ${
        bdayInfo.isToday
          ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-500/60 ring-1 ring-amber-400/40'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Left: Avatar, Name, Badges, DOB */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${getAvatarGradient(
            person.name
          )} text-sm font-bold text-white shadow-xs`}
          aria-hidden="true"
        >
          {initial}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
              {person.name}
            </h3>

            {person.group && (
              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                📁 {person.group}
              </span>
            )}

            {generation && (
              <span
                title={`${generation.name} (${generation.yearsRange})`}
                className={`inline-flex items-center rounded-md px-1.5 py-0.2 text-[10px] font-semibold border ${generation.bgClass} ${generation.colorClass} ${generation.borderClass}`}
              >
                {generation.shortName}
              </span>
            )}

            {bdayInfo.isToday && (
              <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/40 animate-pulse">
                🎉 Today! (Turning {bdayInfo.turningAge})
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Born {formattedDob}
          </p>
        </div>
      </div>

      {/* Middle & Right: Age Display, Countdown & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
        <div className="text-left sm:text-right">
          <div className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
            {ageSummary}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {bdayInfo.isToday ? '🎂 Happy Birthday!' : bdayInfo.formattedCountdown}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {showCustomReorder && (
            <div className="flex items-center gap-0.5 mr-1">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                aria-label={`Move ${person.name} up`}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                aria-label={`Move ${person.name} down`}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              >
                ↓
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => onEdit(person)}
            aria-label={`Edit ${person.name}`}
            className="min-h-[36px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(person)}
            aria-label={`Delete ${person.name}`}
            className="min-h-[36px] px-2.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
