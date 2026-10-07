'use client';

import React, { useEffect } from 'react';
import { Person } from '@/types/person';
import { PersonDocument, DOCUMENT_CATEGORIES } from '@/types/document';
import { formatDateDisplay } from '@/lib/age';
import { formatFileSize } from '@/lib/documentStorage';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  person?: Person | null;
  document?: PersonDocument | null;
  documentCount?: number;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  person,
  document,
  documentCount = 0,
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

  if (!isOpen || (!person && !document)) return null;

  // Avatar gradient helper for person
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

  const docCategoryMeta = document
    ? DOCUMENT_CATEGORIES.find((c) => c.id === document.category) || DOCUMENT_CATEGORIES[6]
    : null;

  const isDeletingPerson = !!person;
  const itemName = isDeletingPerson ? person.name : document?.title || 'Document';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200/90 dark:border-slate-800 text-left">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-rose-500/15 dark:bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header: Glowing Danger Emblem & Close button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 text-2xl border border-rose-200/80 dark:border-rose-900/60 shadow-inner ring-4 ring-rose-500/10">
            🗑️
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Title and subtitle */}
        <div>
          <h3
            id="delete-dialog-title"
            className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Delete {isDeletingPerson ? person.name : 'Document'}?
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              &quot;{itemName}&quot;
            </span>
            ? This action cannot be reversed.
          </p>
        </div>

        {/* Item Capsule Preview Card */}
        {isDeletingPerson && person && (
          <div className="my-4.5 flex items-center gap-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${getAvatarGradient(
                person.name
              )} text-white font-bold text-base shadow-xs`}
            >
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {person.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Born {formatDateDisplay(person.dateOfBirth)}
                {person.group && ` · ${person.group}`}
              </p>
              {documentCount > 0 && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>
                    Also removes {documentCount} document{documentCount === 1 ? '' : 's'} from vault
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {!isDeletingPerson && document && docCategoryMeta && (
          <div className="my-4.5 flex items-center gap-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xl border border-slate-200 dark:border-slate-700">
              {docCategoryMeta.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {document.title}
                </h4>
                <span
                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${docCategoryMeta.badgeClass}`}
                >
                  {docCategoryMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono">
                {document.fileName} · {formatFileSize(document.fileSize)}
              </p>
            </div>
          </div>
        )}

        {/* Safety Reassurance Note */}
        <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-2 text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-6">
          <span>🛡️</span>
          <span>Permanently removed from your on-device storage.</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] px-5 rounded-xl bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:scale-98 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-500/25 transition-all flex items-center gap-2"
          >
            <span>Delete</span>
            <span>{isDeletingPerson ? 'Person' : 'Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
