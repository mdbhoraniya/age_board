'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Person } from '@/types/person';
import { PersonDocument, DOCUMENT_CATEGORIES } from '@/types/document';
import { ExpiryDashboardSummary, ExpiringDocumentItem } from '@/types/expiry';
import { formatDateDisplay } from '@/lib/age';
import { formatFileSize } from '@/lib/documentStorage';
import { PdfViewer } from './PdfViewer';

type ExpiringDocsDashboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  summary: ExpiryDashboardSummary;
  onOpenPersonVault: (person: Person) => void;
};

type FilterTab = 'alerts' | 'expired' | 'expiringSoon' | 'upcoming' | 'all';

export const ExpiringDocsDashboardModal: React.FC<ExpiringDocsDashboardModalProps> = ({
  isOpen,
  onClose,
  summary,
  onOpenPersonVault,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('alerts');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<PersonDocument | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (previewDoc) {
          setPreviewDoc(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewDoc, onClose]);

  // Combine items according to active tab
  const itemsForTab = useMemo<ExpiringDocumentItem[]>(() => {
    switch (activeTab) {
      case 'expired':
        return summary.expired;
      case 'expiringSoon':
        return summary.expiringSoon;
      case 'upcoming':
        return summary.upcoming;
      case 'all':
        return [...summary.expired, ...summary.expiringSoon, ...summary.upcoming];
      case 'alerts':
      default:
        return [...summary.expired, ...summary.expiringSoon];
    }
  }, [activeTab, summary]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return itemsForTab;
    const q = searchQuery.toLowerCase().trim();
    return itemsForTab.filter(
      (item) =>
        item.document.title.toLowerCase().includes(q) ||
        item.person.name.toLowerCase().includes(q) ||
        (item.person.group && item.person.group.toLowerCase().includes(q)) ||
        item.document.category.toLowerCase().includes(q) ||
        (item.document.expiryDate && item.document.expiryDate.includes(q))
    );
  }, [itemsForTab, searchQuery]);

  if (!isOpen) return null;

  // Avatar gradient helper
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

  const getCategoryMeta = (catId: string) => {
    return DOCUMENT_CATEGORIES.find((c) => c.id === catId) || DOCUMENT_CATEGORIES[6];
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expiry-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 text-xl border border-rose-200/50 dark:border-rose-900/50">
                🚨
              </div>
              <div>
                <h2
                  id="expiry-modal-title"
                  className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                >
                  Document Expiry Alerts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track passports, national IDs, and health cards expiring across your family
                </p>
              </div>
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

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
            <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Expired
              </span>
              <span className="block text-xl font-black text-rose-800 dark:text-rose-300 mt-0.5">
                {summary.expired.length}
              </span>
            </div>

            <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Expiring ≤60d
              </span>
              <span className="block text-xl font-black text-amber-800 dark:text-amber-300 mt-0.5">
                {summary.expiringSoon.length}
              </span>
            </div>

            <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Upcoming ≤180d
              </span>
              <span className="block text-xl font-black text-blue-800 dark:text-blue-300 mt-0.5">
                {summary.upcoming.length}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 p-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Tracked
              </span>
              <span className="block text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
                {summary.totalWithExpiry}
              </span>
            </div>
          </div>

          {/* Controls: Filter Tabs & Search */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
            {/* Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all shrink-0 ${
                  activeTab === 'alerts'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                🚨 All Alerts ({summary.totalAlerts})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('expired')}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all shrink-0 ${
                  activeTab === 'expired'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Expired ({summary.expired.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('expiringSoon')}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all shrink-0 ${
                  activeTab === 'expiringSoon'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Expiring Soon ({summary.expiringSoon.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all shrink-0 ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Upcoming ({summary.upcoming.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all shrink-0 ${
                  activeTab === 'all'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All with Expiry ({summary.totalWithExpiry})
              </button>
            </div>

            {/* Search Input */}
            <div>
              <input
                type="text"
                placeholder="Search by document title, person name, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Document Alert List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {searchQuery ? 'No matching documents found' : 'All clear! No documents in this view.'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Try searching with different keywords.'
                    : 'All documents are currently valid or have no upcoming expiry dates.'}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const catMeta = getCategoryMeta(item.document.category);
                const isOverdue = item.expiryStatus.status === 'expired';

                return (
                  <div
                    key={item.document.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                      isOverdue
                        ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                        : item.expiryStatus.status === 'expiring_soon'
                        ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                    }`}
                  >
                    {/* Left: Person & Document Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Person avatar */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${getAvatarGradient(
                          item.person.name
                        )} text-sm font-bold text-white shadow-xs`}
                      >
                        {item.person.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        {/* Person Name & Group */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {item.person.name}
                          </h4>
                          {item.person.group && (
                            <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                              {item.person.group}
                            </span>
                          )}
                        </div>

                        {/* Document Title & Category */}
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                            {item.document.title}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${catMeta.badgeClass}`}
                          >
                            <span>{catMeta.icon}</span>
                            <span>{catMeta.label}</span>
                          </span>
                        </div>

                        {/* Expiry Details */}
                        <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Expires:{' '}
                            <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                              {item.document.expiryDate ? formatDateDisplay(item.document.expiryDate) : '—'}
                            </strong>
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold border ${item.expiryStatus.badgeClass}`}
                          >
                            {item.expiryStatus.label}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-[11px] text-slate-400">
                            {formatFileSize(item.document.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                      {/* View Document */}
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(item.document)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 active:scale-95 transition-all"
                      >
                        <span>👁️</span>
                        <span>View</span>
                      </button>

                      {/* Open Vault for Person */}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPersonVault(item.person);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                      >
                        <span>📁</span>
                        <span>Open Vault</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredItems.length} of {itemsForTab.length} documents
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Document Preview Modal */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewDoc(null);
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 truncate">
                <span className="text-lg">
                  {getCategoryMeta(previewDoc.category).icon}
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {previewDoc.title}
                </span>
                <span className="text-xs text-slate-500 truncate">
                  ({previewDoc.fileName})
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.dataUrl}
                  download={previewDoc.fileName}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950 min-h-[400px]">
              {previewDoc.fileType === 'application/pdf' ? (
                <PdfViewer
                  dataUrl={previewDoc.dataUrl}
                  title={previewDoc.title}
                />
              ) : previewDoc.fileType.startsWith('image/') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.title}
                  className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-md"
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Preview not available for this file type.
                  </p>
                  <a
                    href={previewDoc.dataUrl}
                    download={previewDoc.fileName}
                    className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Download {previewDoc.fileName}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
