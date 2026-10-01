'use client';

import React from 'react';
import Link from 'next/link';
import { usePeople } from '@/lib/storage';
import { useCurrentDate } from '@/lib/useCurrentDate';
import { calculateAge, calculateBirthdayInfo, formatAge } from '@/lib/age';

export default function WidgetPage() {
  const currentDate = useCurrentDate();
  const { people, isHydrated } = usePeople();

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400 font-sans text-xs">
        Loading AgeBoard Widget...
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-4 text-center font-sans text-white">
        <span className="text-2xl mb-1">⏳</span>
        <h1 className="text-sm font-bold">AgeBoard</h1>
        <p className="text-xs text-slate-400 mt-1 mb-3">No family members added yet</p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
        >
          Open App
        </Link>
      </div>
    );
  }

  // Find next upcoming birthday
  const sortedByBday = [...people].sort((a, b) => {
    const bdayA = calculateBirthdayInfo(a.dateOfBirth, currentDate);
    const bdayB = calculateBirthdayInfo(b.dateOfBirth, currentDate);
    return bdayA.daysUntil - bdayB.daysUntil;
  });

  const nextPerson = sortedByBday[0];
  const nextBday = calculateBirthdayInfo(nextPerson.dateOfBirth, currentDate);
  const nextAge = calculateAge(nextPerson.dateOfBirth, currentDate);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white p-4 font-sans flex flex-col justify-between select-none">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="text-base">⏳</span>
          <span className="text-xs font-bold tracking-tight text-white">AgeBoard</span>
        </div>
        <Link
          href="/"
          className="text-[10px] font-semibold text-blue-400 hover:text-blue-300"
        >
          Open App →
        </Link>
      </div>

      {/* Featured Next Birthday Highlight */}
      <div className="my-auto py-3">
        <div className="rounded-xl bg-linear-to-br from-blue-900/40 to-indigo-950/60 p-3.5 border border-blue-800/40 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
              Next Birthday
            </span>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
              {nextBday.isToday ? '🎉 Today!' : nextBday.formattedCountdown}
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div className="truncate pr-2">
              <h2 className="text-lg font-extrabold text-white truncate">
                {nextPerson.name}
              </h2>
              <p className="text-[11px] text-slate-300">
                Turns <strong className="text-white">{nextBday.turningAge}</strong> on{' '}
                {nextBday.formattedNextDate}
              </p>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-blue-800/30 text-[11px] text-slate-400">
            Currently: <strong className="text-slate-200">{formatAge(nextAge)}</strong>
          </div>
        </div>

        {/* Other upcoming list */}
        {sortedByBday.length > 1 && (
          <div className="mt-3 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-0.5">
              Coming Up Next
            </span>
            {sortedByBday.slice(1, 3).map((p) => {
              const b = calculateBirthdayInfo(p.dateOfBirth, currentDate);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/80 border border-slate-800"
                >
                  <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {b.formattedCountdown}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-900">
        Live Widget · Updates daily automatically
      </div>
    </div>
  );
}
