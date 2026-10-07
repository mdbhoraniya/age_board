'use client';

import React from 'react';
import { Person } from '@/types/person';
import {
  calculateAge,
  calculateBirthdayInfo,
  formatAge,
  getGeneration,
  parseDateParts,
} from '@/lib/age';

type TimelineViewProps = {
  people: Person[];
  currentDate: Date;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onOpenDocuments?: (person: Person) => void;
  documentCounts?: Record<string, number>;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const TimelineView: React.FC<TimelineViewProps> = ({
  people,
  currentDate,
  onEdit,
  onDelete,
  onOpenDocuments,
  documentCounts = {},
}) => {
  const currentMonthIndex = currentDate.getMonth(); // 0-indexed

  // Group people by birth month
  const monthGroups = Array.from({ length: 12 }, (_, monthIdx) => {
    const list = people.filter((p) => {
      const parts = parseDateParts(p.dateOfBirth);
      return parts ? parts[1] - 1 === monthIdx : false;
    });

    // Sort people within this month by birth day ascending
    list.sort((a, b) => {
      const dayA = parseDateParts(a.dateOfBirth)?.[2] ?? 0;
      const dayB = parseDateParts(b.dateOfBirth)?.[2] ?? 0;
      return dayA - dayB;
    });

    return {
      monthIdx,
      name: MONTH_NAMES[monthIdx],
      people: list,
      isCurrentMonth: monthIdx === currentMonthIndex,
    };
  });

  // Filter to months that have people (or keep current month visible)
  const activeMonths = monthGroups.filter(
    (g) => g.people.length > 0 || g.isCurrentMonth
  );

  const getDayOrdinal = (day: number) => {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  };

  return (
    <div className="space-y-6">
      {activeMonths.map((group) => (
        <section
          key={group.monthIdx}
          aria-labelledby={`month-${group.monthIdx}`}
          className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs ${
            group.isCurrentMonth
              ? 'border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          {/* Month Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3
                id={`month-${group.monthIdx}`}
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                📅 {group.name}
              </h3>
              {group.isCurrentMonth && (
                <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Current Month
                </span>
              )}
            </div>

            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {group.people.length}{' '}
              {group.people.length === 1 ? 'birthday' : 'birthdays'}
            </span>
          </div>

          {/* Month people list */}
          {group.people.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 italic text-center">
              No birthdays in {group.name}
            </p>
          ) : (
            <div className="space-y-2.5">
              {group.people.map((person) => {
                const parts = parseDateParts(person.dateOfBirth);
                const day = parts ? parts[2] : 1;
                const bdayInfo = calculateBirthdayInfo(person.dateOfBirth, currentDate);
                const age = calculateAge(person.dateOfBirth, currentDate);
                const ageSummary = formatAge(age);
                const generation = getGeneration(person.dateOfBirth);

                return (
                  <div
                    key={person.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border p-3 transition-colors ${
                      bdayInfo.isToday
                        ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/40 ring-1 ring-amber-400/30'
                        : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {/* Left: Day Badge + Person info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <span className="text-xs font-black text-slate-900 dark:text-white leading-none">
                          {day}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                          {getDayOrdinal(day).slice(-2)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {person.name}
                          </h4>

                          {person.group && (
                            <span className="rounded-md bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                              📁 {person.group}
                            </span>
                          )}

                          {generation && (
                            <span
                              title={`${generation.name} (${generation.yearsRange})`}
                              className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold border ${generation.bgClass} ${generation.colorClass} ${generation.borderClass}`}
                            >
                              {generation.shortName}
                            </span>
                          )}

                          {bdayInfo.isToday && (
                            <span className="rounded-full bg-amber-400/20 px-2 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/40 animate-pulse">
                              🎉 Today!
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Currently: <strong>{ageSummary}</strong> · Turns{' '}
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {bdayInfo.turningAge}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Countdown & Action buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span className="rounded-full bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {bdayInfo.isToday ? '🎉 Today!' : bdayInfo.formattedCountdown}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenDocuments?.(person)}
                          aria-label={`Documents for ${person.name}`}
                          className={`min-h-[34px] px-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                            (documentCounts[person.id] || 0) > 0
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>📁</span>
                          <span>Docs</span>
                          {(documentCounts[person.id] || 0) > 0 && (
                            <span className="rounded-full bg-blue-600 text-white dark:bg-blue-500 px-1.5 py-0.2 text-[10px] font-bold">
                              {documentCounts[person.id]}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(person)}
                          aria-label={`Edit ${person.name}`}
                          className="min-h-[34px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(person)}
                          aria-label={`Delete ${person.name}`}
                          className="min-h-[34px] px-2.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
};
