'use client';

import React, { useState, useEffect } from 'react';
import { Person } from '@/types/person';
import { encodeShareData, getAllGroups } from '@/lib/storage';

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onImportFromFile: (imported: Person[]) => void;
};

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  people,
  onImportFromFile,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [canNativeShare] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const groups = getAllGroups(people);

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

  // Generate share link
  const groupFilter = selectedGroup === 'all' ? undefined : selectedGroup;
  const filteredCount = groupFilter
    ? people.filter((p) => p.group === groupFilter).length
    : people.length;

  const encodedPayload = encodeShareData(people, groupFilter);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/?import=${encodedPayload}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      prompt('Copy this link:', shareUrl);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AgeNow Family Ages',
          text: `Here are the family member details on AgeNow (${filteredCount} people). Open the link to see everyone's current age:`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or not supported
        console.log('Share dismissed', err);
      }
    }
  };

  const handleExportJson = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: groupFilter
        ? people.filter((p) => p.group === groupFilter)
        : people,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agenow_backup_${groupFilter ? groupFilter.toLowerCase().replace(/\s+/g, '_') : 'all'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed?.people) ? parsed.people : Array.isArray(parsed) ? parsed : [];
        if (list.length > 0) {
          onImportFromFile(list);
          onClose();
        } else {
          alert('No valid people data found in the selected file.');
        }
      } catch (err) {
        alert('Invalid JSON file format.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
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
              id="share-modal-title"
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              Share Family Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Send a 1-click link to your brother or family so they don&apos;t have to enter details again
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

        <div className="mt-5 space-y-5">
          {/* Group selector */}
          {groups.length > 0 && (
            <div>
              <label
                htmlFor="share-group-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Select what to share:
              </label>
              <select
                id="share-group-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="all">🌟 All Groups ({people.length} people)</option>
                {groups.map((g) => {
                  const count = people.filter((p) => p.group === g).length;
                  return (
                    <option key={g} value={g}>
                      📁 {g} ({count} {count === 1 ? 'person' : 'people'})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Share Link Preview & Actions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Shareable 1-Click Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              When opened, the receiver can import all {filteredCount} {filteredCount === 1 ? 'person' : 'people'} with one click.
            </p>
          </div>

          {/* Native Mobile Share Button (WhatsApp, Messages, etc) */}
          {canNativeShare && (
            <div>
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
              >
                <span>📲</span>
                <span>Send via WhatsApp / Message / Share Sheet</span>
              </button>
            </div>
          )}

          {/* Backup File Options */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Backup & File Transfer
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-center"
              >
                💾 Export JSON Backup
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-center"
              >
                📥 Import from File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
