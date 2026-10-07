'use client';

import React, { useState, useEffect } from 'react';
import { Person } from '@/types/person';
import { PersonDocument } from '@/types/document';
import { encodeShareData, getAllGroups } from '@/lib/storage';
import { getAllDocuments } from '@/lib/documentStorage';

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onImportFromFile: (imported: Person[], importedDocs?: PersonDocument[]) => void;
};

type ShareRecipient = 'family' | 'unknown';

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  people,
  onImportFromFile,
}) => {
  const [recipient, setRecipient] = useState<ShareRecipient>('family');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [allDocs, setAllDocs] = useState<PersonDocument[]>([]);
  const [includeDocumentsInExport, setIncludeDocumentsInExport] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [canNativeShare] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const groups = getAllGroups(people);

  useEffect(() => {
    if (isOpen) {
      getAllDocuments().then((docs) => setAllDocs(docs));
    }
  }, [isOpen]);

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

  // Generate share link based on recipient type
  const groupFilter = selectedGroup === 'all' ? undefined : selectedGroup;
  const filteredCount = groupFilter
    ? people.filter((p) => p.group === groupFilter).length
    : people.length;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const encodedPayload = encodeShareData(people, groupFilter);
  const familyShareUrl = `${origin}/?import=${encodedPayload}`;
  const unknownShareUrl = `${origin}/`;

  const activeShareUrl = recipient === 'family' ? familyShareUrl : unknownShareUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      prompt('Copy this link:', activeShareUrl);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        if (recipient === 'family') {
          await navigator.share({
            title: 'AgeBoard Family Ages',
            text: `Here are our family member details on AgeBoard (${filteredCount} people). Open the link to see everyone's current age:`,
            url: familyShareUrl,
          });
        } else {
          await navigator.share({
            title: 'AgeBoard - Age Tracker',
            text: "Check out AgeBoard! A simple, 100% private age tracker where you can track everyone's ages and upcoming birthdays. Try it here:",
            url: unknownShareUrl,
          });
        }
      } catch (err) {
        // User cancelled or not supported
        console.log('Share dismissed', err);
      }
    }
  };

  const exportedPeople = groupFilter
    ? people.filter((p) => p.group === groupFilter)
    : people;
  const exportedPeopleIds = new Set(exportedPeople.map((p) => p.id));
  const relevantDocs = allDocs.filter((d) => exportedPeopleIds.has(d.personId));

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const docsToExport = includeDocumentsInExport ? relevantDocs : [];
      const exportData = {
        version: docsToExport.length > 0 ? 2 : 1,
        exportedAt: new Date().toISOString(),
        includeDocuments: docsToExport.length > 0,
        people: exportedPeople,
        documents: docsToExport.length > 0 ? docsToExport : undefined,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const groupSlug = groupFilter ? groupFilter.toLowerCase().replace(/\s+/g, '_') : 'all';
      const suffix = docsToExport.length > 0 ? '_with_docs' : '';
      a.download = `ageboard_backup_${groupSlug}${suffix}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate backup file.');
    } finally {
      setIsExporting(false);
    }
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
        const docsList = Array.isArray(parsed?.documents) ? parsed.documents : undefined;

        if (list.length > 0) {
          onImportFromFile(list, docsList);
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
              Share AgeBoard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {recipient === 'family'
                ? "Send a 1-click link to family so they don't have to enter details again"
                : 'Share a clean link so an unknown person or friend can enter their own data'}
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
          {/* Recipient Selection Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Share With:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setRecipient('family');
                  setCopied(false);
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  recipient === 'family'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">👨‍👩‍👧‍👦</span>
                  <span className="font-bold">Family Members</span>
                </div>
                <span className="text-[10px] font-normal opacity-80 mt-0.5">
                  Pre-filled with your data
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecipient('unknown');
                  setCopied(false);
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  recipient === 'unknown'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">👤</span>
                  <span className="font-bold">Unknown Person</span>
                </div>
                <span className="text-[10px] font-normal opacity-80 mt-0.5">
                  Clean link for their own data
                </span>
              </button>
            </div>
          </div>

          {/* Recipient-specific content */}
          {recipient === 'family' ? (
            <>
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

              {/* Share Link Preview & Actions for Family */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Shareable 1-Click Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={familyShareUrl}
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
                  When opened, family members can import all {filteredCount} {filteredCount === 1 ? 'person' : 'people'} with one click.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Privacy protection notice for Unknown Person */}
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <span className="text-base shrink-0 mt-0.5">🔒</span>
                <div>
                  <span className="font-semibold block">100% Private & Clean</span>
                  <span className="text-[11px] opacity-90 leading-relaxed block mt-0.5">
                    None of your saved family members or birth dates will be shared. The recipient will see a clean board where they can enter their own data.
                  </span>
                </div>
              </div>

              {/* Clean App Link */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Clean App Link (No personal data included)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={unknownShareUrl}
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
                  Share this link so an unknown person or friend can start tracking their own family and friends.
                </p>
              </div>
            </>
          )}

          {/* Native Mobile Share Button (WhatsApp, Messages, etc) */}
          {canNativeShare && (
            <div>
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
              >
                <span>📲</span>
                <span>
                  {recipient === 'family'
                    ? 'Send to Family via WhatsApp / Message'
                    : 'Invite via WhatsApp / Message'}
                </span>
              </button>
            </div>
          )}

          {/* Backup File Options */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Cross-Device Backup & Transfer
            </span>

            {/* Document Bundle Option */}
            {relevantDocs.length > 0 && (
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 mb-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors">
                <input
                  type="checkbox"
                  checked={includeDocumentsInExport}
                  onChange={(e) => setIncludeDocumentsInExport(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>📦</span>
                    <span>Include {relevantDocs.length} uploaded document{relevantDocs.length === 1 ? '' : 's'} in backup</span>
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-0.5 leading-relaxed">
                    Bundles all PDFs, passport scans, and photos so family members receive these documents on their phones when importing this file.
                  </span>
                </div>
              </label>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                disabled={isExporting}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-center disabled:opacity-50"
              >
                {isExporting ? (
                  'Bundling...'
                ) : (
                  <span>
                    💾 Export Backup{' '}
                    {includeDocumentsInExport && relevantDocs.length > 0
                      ? `(+ ${relevantDocs.length} Docs)`
                      : ''}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-center"
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
            <p className="mt-1.5 text-[11px] text-slate-400 text-center">
              Send the exported backup file via WhatsApp, AirDrop, or email to import everything on family members&apos; phones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
