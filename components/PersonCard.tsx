'use client';

import React from 'react';
import { Person } from '@/types/person';
import {
  calculateAge,
  calculateBirthdayInfo,
  formatAge,
  formatDateDisplay,
} from '@/lib/age';

type PersonCardProps = {
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

export const PersonCard: React.FC<PersonCardProps> = ({
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

  // Avatar initial color generator based on person's name
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
    <article
      aria-label={`${person.name}'s age card`}
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md ${
        bdayInfo.isToday
          ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-500/60 ring-2 ring-amber-400/30'
          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90'
      }`}
    >
      {/* Top Header: Avatar, Name, Birthday Badge */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${getAvatarGradient(
                person.name
              )} text-base font-bold text-white shadow-xs`}
              aria-hidden="true"
            >
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {person.name}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Born {formattedDob}
              </p>
            </div>
          </div>

          {/* Birthday status badge */}
          {bdayInfo.isToday ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/40 animate-pulse">
              <span>🎉</span>
              <span>Today!</span>
            </span>
          ) : (
            <span
              title={`Next birthday: ${bdayInfo.formattedNextDate}`}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {bdayInfo.formattedCountdown}
            </span>
          )}
        </div>

        {/* Highlight Banner if Today is Birthday */}
        {bdayInfo.isToday && (
          <div className="mt-4 rounded-xl bg-amber-100/90 dark:bg-amber-900/40 p-2.5 text-center text-xs font-semibold text-amber-800 dark:text-amber-200">
            🎉 Turning {bdayInfo.turningAge} today! Happy Birthday!
          </div>
        )}

        {/* Primary Age Display (Large Numbers Focus) */}
        <div className="mt-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Years */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {age.years}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {age.years === 1 ? 'Year' : 'Years'}
              </div>
            </div>

            {/* Months */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {age.months}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {age.months === 1 ? 'Month' : 'Months'}
              </div>
            </div>

            {/* Days */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {age.days}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {age.days === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          </div>

          {/* Full natural sentence */}
          <p className="mt-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
            {ageSummary}
          </p>
        </div>
      </div>

      {/* Card Footer: Custom Reorder (if active) & Edit/Delete Actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {showCustomReorder ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label={`Move ${person.name} up`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label={`Move ${person.name} down`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              ↓
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            {age.totalDays.toLocaleString()} {age.totalDays === 1 ? 'day' : 'days'} old
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(person)}
            aria-label={`Edit ${person.name}`}
            className="inline-flex items-center justify-center min-h-[38px] px-3 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            Edit
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(person)}
            aria-label={`Delete ${person.name}`}
            className="inline-flex items-center justify-center min-h-[38px] px-3 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
};
