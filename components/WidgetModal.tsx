'use client';

import React, { useState, useEffect } from 'react';
import { Person } from '@/types/person';
import { calculateAge, calculateBirthdayInfo, formatAge } from '@/lib/age';

type WidgetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  currentDate: Date;
};

type WidgetSize = 'small' | 'medium' | 'lockscreen';

export const WidgetModal: React.FC<WidgetModalProps> = ({
  isOpen,
  onClose,
  people,
  currentDate,
}) => {
  const [activeSize, setActiveSize] = useState<WidgetSize>('small');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Sorted by upcoming birthday
  const sorted = [...people].sort((a, b) => {
    const bdayA = calculateBirthdayInfo(a.dateOfBirth, currentDate);
    const bdayB = calculateBirthdayInfo(b.dateOfBirth, currentDate);
    return bdayA.daysUntil - bdayB.daysUntil;
  });

  const nextPerson = sorted[0];
  const nextBday = nextPerson
    ? calculateBirthdayInfo(nextPerson.dateOfBirth, currentDate)
    : null;
  const nextAge = nextPerson
    ? calculateAge(nextPerson.dateOfBirth, currentDate)
    : null;

  const handleOpenPopout = () => {
    window.open(
      '/widget',
      'AgeBoardWidget',
      'width=360,height=340,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2
              id="widget-modal-title"
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              📱 Home Screen Widgets
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Keep family ages and upcoming birthdays right on your home screen
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Size Selection Tabs */}
        <div className="mt-5 flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setActiveSize('small')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              activeSize === 'small'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Small (2×2)
          </button>
          <button
            type="button"
            onClick={() => setActiveSize('medium')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              activeSize === 'medium'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Medium (4×2)
          </button>
          <button
            type="button"
            onClick={() => setActiveSize('lockscreen')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
              activeSize === 'lockscreen'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Lock Screen
          </button>
        </div>

        {/* Interactive Widget Preview Box */}
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-slate-950 p-6 border border-slate-800 shadow-inner">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Live Preview
          </span>

          {people.length === 0 ? (
            <p className="text-xs text-slate-400">Add a person to see your real widget preview!</p>
          ) : activeSize === 'small' ? (
            /* Small 2x2 Square Widget Preview */
            <div className="w-44 h-44 rounded-3xl bg-linear-to-br from-blue-900 via-indigo-950 to-slate-950 p-4 border border-blue-700/40 text-white flex flex-col justify-between shadow-xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-blue-300">
                <span>⏳ AgeBoard</span>
                <span>{nextBday?.isToday ? '🎉' : '🎂'}</span>
              </div>
              <div className="my-auto">
                <div className="text-xs text-blue-200 uppercase font-semibold">Next Birthday</div>
                <div className="text-base font-extrabold text-white truncate">
                  {nextPerson?.name}
                </div>
                <div className="text-[11px] text-blue-200 mt-0.5">
                  {nextBday?.isToday
                    ? 'Turning ' + nextBday?.turningAge + ' today!'
                    : nextBday?.formattedCountdown}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 border-t border-blue-900/60 pt-1.5 truncate">
                {nextAge ? formatAge(nextAge) : ''}
              </div>
            </div>
          ) : activeSize === 'medium' ? (
            /* Medium 4x2 Horizontal Widget Preview */
            <div className="w-full max-w-sm rounded-3xl bg-linear-to-r from-blue-950 via-slate-900 to-slate-950 p-4 border border-blue-800/40 text-white shadow-xl">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-blue-300">⏳ AgeBoard Family</span>
                <span className="text-[10px] text-slate-400">Daily sync</span>
              </div>
              <div className="space-y-1.5">
                {sorted.slice(0, 3).map((p) => {
                  const b = calculateBirthdayInfo(p.dateOfBirth, currentDate);
                  const a = calculateAge(p.dateOfBirth, currentDate);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs py-0.5"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({a.years}y {a.months}m)
                        </span>
                      </div>
                      <span className="rounded-md bg-blue-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 shrink-0">
                        {b.formattedCountdown}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Lock Screen Glance Pill Preview */
            <div className="rounded-full bg-slate-900/90 border border-slate-700/60 px-4 py-2 text-white flex items-center gap-2.5 shadow-lg">
              <span className="text-sm">⏳</span>
              <div className="text-xs font-medium">
                <strong className="text-white">{nextPerson?.name}</strong>: {nextBday?.formattedCountdown}
              </div>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="mt-5 space-y-3">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>💡</span>
              <span>How to add to your Home Screen:</span>
            </div>
            <div className="text-slate-600 dark:text-slate-300 space-y-1">
              <p>
                <strong>• Android (Chrome):</strong> Tap browser menu <span className="font-mono">⋮</span> → tap <strong>&ldquo;Add to Home screen&rdquo;</strong>.
              </p>
              <p>
                <strong>• iPhone (Safari):</strong> Tap the <strong>Share</strong> button (box with arrow) → tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
              </p>
            </div>
          </div>

          {/* Action to launch popout mini widget */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleOpenPopout}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <span>🗔</span>
              <span>Open Mini Floating Widget</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[40px] items-center rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
