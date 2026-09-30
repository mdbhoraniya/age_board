'use client';

import React from 'react';
import { Person } from '@/types/person';
import { formatDateDisplay } from '@/lib/age';

type ImportSharedModalProps = {
  isOpen: boolean;
  incomingPeople: Person[];
  groupName?: string;
  onClose: () => void;
  onConfirmMerge: () => void;
  onConfirmReplace: () => void;
};

export const ImportSharedModal: React.FC<ImportSharedModalProps> = ({
  isOpen,
  incomingPeople,
  groupName,
  onClose,
  onConfirmMerge,
  onConfirmReplace,
}) => {
  if (!isOpen || incomingPeople.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 text-xl">
            📥
          </div>
          <div>
            <h2
              id="import-modal-title"
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              Import Shared Family
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Someone shared {incomingPeople.length} {incomingPeople.length === 1 ? 'person' : 'people'}{' '}
              {groupName ? `from "${groupName}"` : ''} with you!
            </p>
          </div>
        </div>

        {/* Preview of incoming people */}
        <div className="mt-4">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            People included ({incomingPeople.length}):
          </span>
          <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800">
            {incomingPeople.map((person, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <div className="font-semibold text-slate-900 dark:text-white truncate">
                  {person.name}
                </div>
                <div className="flex items-center gap-2 shrink-0 text-slate-500 dark:text-slate-400">
                  {person.group && (
                    <span className="rounded bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                      📁 {person.group}
                    </span>
                  )}
                  <span>{formatDateDisplay(person.dateOfBirth)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors order-3 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmReplace}
            className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors order-2"
          >
            Replace My List
          </button>
          <button
            type="button"
            onClick={onConfirmMerge}
            className="min-h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-xs font-semibold text-white shadow-xs transition-all order-1 sm:order-3"
          >
            Import & Merge
          </button>
        </div>
      </div>
    </div>
  );
};
