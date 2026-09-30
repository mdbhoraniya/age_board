'use client';

import React, { useEffect } from 'react';
import { Person } from '@/types/person';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  person: Person | null;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  person,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !person) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            ⚠️
          </div>
          <div>
            <h3
              id="delete-dialog-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Delete {person.name}?
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <span className="font-semibold text-slate-900 dark:text-white">{person.name}</span>? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-sm font-semibold text-white shadow-xs transition-all"
          >
            Delete Person
          </button>
        </div>
      </div>
    </div>
  );
};
