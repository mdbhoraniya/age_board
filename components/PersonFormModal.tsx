'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Person } from '@/types/person';
import {
  validateDateOfBirth,
  calculateAge,
  formatAge,
} from '@/lib/age';

type PersonFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (personData: { name: string; dateOfBirth: string }) => void;
  initialData?: Person | null;
  currentDate: Date;
};

export const PersonFormModal: React.FC<PersonFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentDate,
}) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.dateOfBirth ?? '');
  const [errors, setErrors] = useState<{ name?: string; dateOfBirth?: string }>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Today's date formatted as YYYY-MM-DD for native max attribute
  const maxDateStr = currentDate.toISOString().split('T')[0];

  // Focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Real-time calculated age preview
  let previewAgeString = '';
  if (dateOfBirth) {
    const validation = validateDateOfBirth(dateOfBirth, currentDate);
    if (validation.isValid) {
      const age = calculateAge(dateOfBirth, currentDate);
      previewAgeString = formatAge(age);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const newErrors: { name?: string; dateOfBirth?: string } = {};

    if (!trimmedName) {
      newErrors.name = 'Please enter a name';
    }

    const dateValidation = validateDateOfBirth(dateOfBirth, currentDate);
    if (!dateValidation.isValid) {
      newErrors.dateOfBirth = dateValidation.error || 'Please enter a valid date of birth';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: trimmedName,
      dateOfBirth,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2
              id="modal-title"
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              {initialData ? 'Edit Person' : 'Add Person'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {initialData ? 'Update their name or date of birth' : 'Add someone to track their current age'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Name field */}
          <div>
            <label
              htmlFor="person-name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Full or Nickname <span className="text-rose-500">*</span>
            </label>
            <input
              id="person-name"
              ref={nameInputRef}
              type="text"
              required
              placeholder="e.g. Sarah, Mom, Alex"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                errors.name
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Date of Birth field */}
          <div>
            <label
              htmlFor="person-dob"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Date of Birth <span className="text-rose-500">*</span>
            </label>
            <input
              id="person-dob"
              type="date"
              required
              max={maxDateStr}
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                if (errors.dateOfBirth) {
                  setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                }
              }}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white transition-colors ${
                errors.dateOfBirth
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-xs text-rose-500 font-medium">
                {errors.dateOfBirth}
              </p>
            )}

            {/* Instant Age Preview */}
            {previewAgeString && !errors.dateOfBirth && (
              <div className="mt-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 p-2.5 border border-blue-100 dark:border-blue-900/50 flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                <span>✨</span>
                <span>Current age: <strong>{previewAgeString}</strong></span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-sm font-semibold text-white shadow-xs transition-all"
            >
              {initialData ? 'Save Changes' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
