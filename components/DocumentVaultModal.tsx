'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Person } from '@/types/person';
import {
  PersonDocument,
  DocumentCategory,
  DOCUMENT_CATEGORIES,
} from '@/types/document';
import {
  saveDocument,
  getDocumentsForPerson,
  deleteDocument,
  generateDocumentId,
  formatFileSize,
  getExpiryStatus,
} from '@/lib/documentStorage';
import { PdfViewer } from './PdfViewer';

type DocumentVaultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  currentDate: Date;
};

type ActiveTab = 'list' | 'upload';

export const DocumentVaultModal: React.FC<DocumentVaultModalProps> = ({
  isOpen,
  onClose,
  person,
  currentDate,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [documents, setDocuments] = useState<PersonDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('birth_certificate');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<PersonDocument | null>(null);

  // Load documents when person or isOpen changes
  useEffect(() => {
    if (!isOpen || !person) {
      setDocuments([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getDocumentsForPerson(person.id)
      .then((docs) => {
        if (isMounted) {
          setDocuments(docs);
          setIsLoading(false);
          // If no documents exist yet, default to upload tab
          if (docs.length === 0) {
            setActiveTab('upload');
          } else {
            setActiveTab('list');
          }
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, person]);

  // Handle ESC key
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
  }, [isOpen, onClose, previewDoc]);

  if (!isOpen || !person) return null;

  const resetUploadForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setDocTitle('');
    setDocCategory('birth_certificate');
    setDocExpiryDate('');
    setDocNotes('');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelection = (file: File) => {
    setUploadError(null);

    // Max 15MB limit
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15MB limit. Please choose a smaller file.');
      return;
    }

    const validTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];

    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a PDF or Image (PNG, JPG, WebP).');
      return;
    }

    setSelectedFile(file);

    // Auto-populate title from filename if empty
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setDocTitle(cleanName);

    // If image, create thumbnail preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose a file to upload.');
      return;
    }

    if (!docTitle.trim()) {
      setUploadError('Please enter a document title.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const now = new Date().toISOString();

        const newDoc: PersonDocument = {
          id: generateDocumentId(),
          personId: person.id,
          title: docTitle.trim(),
          category: docCategory,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          dataUrl,
          expiryDate: docExpiryDate ? docExpiryDate.trim() : undefined,
          notes: docNotes.trim() ? docNotes.trim() : undefined,
          createdAt: now,
          updatedAt: now,
        };

        await saveDocument(newDoc);
        const updated = await getDocumentsForPerson(person.id);
        setDocuments(updated);
        setIsUploading(false);
        resetUploadForm();
        setActiveTab('list');
      };

      reader.onerror = () => {
        setUploadError('Failed to read file. Please try again.');
        setIsUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to save document into vault.');
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${docTitle}"?`)) {
      await deleteDocument(docId);
      const updated = await getDocumentsForPerson(person.id);
      setDocuments(updated);
    }
  };

  const handleDownload = (doc: PersonDocument) => {
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.fileName || `${doc.title}.${doc.fileType === 'application/pdf' ? 'pdf' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredDocs =
    selectedCategoryFilter === 'all'
      ? documents
      : documents.filter((d) => d.category === selectedCategoryFilter);

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-2xl border border-blue-200/50 dark:border-blue-900/50">
                📁
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="vault-modal-title"
                    className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate"
                  >
                    {person.name}&apos;s Documents
                  </h2>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {documents.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>100% On-Device Vault · Stored securely in IndexedDB</span>
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

          {/* Navigation Tabs */}
          <div className="flex items-center px-5 sm:px-6 pt-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>📁 Saved Documents</span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.2 text-xs">
                {documents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>➕ Upload Document</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {activeTab === 'upload' ? (
              /* Upload Form */
              <form onSubmit={handleSaveDocument} className="space-y-4">
                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Choose Document File (PDF or Image)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                      selectedFile
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelection(file);
                      }}
                    />

                    {selectedFile ? (
                      <div className="flex items-center gap-3 w-full">
                        {filePreview ? (
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-2xl font-bold">
                            PDF
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatFileSize(selectedFile.size)} · {selectedFile.type || 'Document'}
                          </p>
                          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                            Click to choose different file
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl mb-2">📄</div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center">
                          Click to select a file, or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                          Passports, Birth Certificates, ID cards, Insurance (PDF, PNG, JPG up to 15MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Title & Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="doc-title-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Document Title *
                    </label>
                    <input
                      id="doc-title-input"
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g. Birth Certificate, US Passport"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="doc-category-select"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Document Category
                    </label>
                    <select
                      id="doc-category-select"
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
                    >
                      {DOCUMENT_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Expiry Date & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="doc-expiry-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Expiry Date (Optional)
                    </label>
                    <input
                      id="doc-expiry-input"
                      type="date"
                      value={docExpiryDate}
                      onChange={(e) => setDocExpiryDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Useful for Passports, Visas, and Health Insurance renewal reminders
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="doc-notes-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Notes (Optional)
                    </label>
                    <input
                      id="doc-notes-input"
                      type="text"
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      placeholder="e.g. Document number, Issuing country"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {uploadError && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
                    ⚠️ {uploadError}
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetUploadForm();
                      setActiveTab('list');
                    }}
                    className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="min-h-[44px] px-5 rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        <span>Saving to Vault...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save to Private Vault</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Document List */
              <div>
                {/* Category filter pills */}
                {documents.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      All ({documents.length})
                    </button>
                    {DOCUMENT_CATEGORIES.map((cat) => {
                      const count = documents.filter((d) => d.category === cat.id).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategoryFilter(cat.id)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
                            selectedCategoryFilter === cat.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label} ({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {isLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Loading documents...
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="text-4xl block mb-2">📂</span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                      No documents stored yet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      Upload birth certificates, passports, ID cards, or medical records for {person.name} in this private vault.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
                    >
                      <span>➕</span>
                      <span>Upload First Document</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocs.map((doc) => {
                      const catMeta = DOCUMENT_CATEGORIES.find((c) => c.id === doc.category);
                      const expiry = getExpiryStatus(doc.expiryDate, currentDate);
                      const isPdf = doc.fileType === 'application/pdf';

                      return (
                        <div
                          key={doc.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
                        >
                          {/* Left: Thumbnail & Info */}
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Document Thumbnail */}
                            <div
                              onClick={() => setPreviewDoc(doc)}
                              className="h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity bg-white dark:bg-slate-900"
                            >
                              {isPdf ? (
                                <span className="text-xl">📄</span>
                              ) : (
                                <img
                                  src={doc.dataUrl}
                                  alt={doc.title}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  onClick={() => setPreviewDoc(doc)}
                                  className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  {doc.title}
                                </h4>

                                {catMeta && (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${catMeta.badgeClass}`}
                                  >
                                    <span>{catMeta.icon}</span>
                                    <span>{catMeta.label}</span>
                                  </span>
                                )}

                                {doc.expiryDate && (
                                  <span
                                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${expiry.badgeClass}`}
                                  >
                                    {expiry.label}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[11px] truncate max-w-[200px]">
                                  {doc.fileName}
                                </span>
                                <span>·</span>
                                <span>{formatFileSize(doc.fileSize)}</span>
                                {doc.notes && (
                                  <>
                                    <span>·</span>
                                    <span className="italic truncate max-w-[150px]">
                                      {doc.notes}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              title="Preview document"
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <span>👁️</span>
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownload(doc)}
                              title="Download to device"
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <span>⬇️</span>
                              <span className="hidden sm:inline">Download</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id, doc.title)}
                              title="Delete document"
                              className="inline-flex min-h-[36px] items-center justify-center rounded-xl p-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / In-app Document Preview Modal */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewDoc(null);
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="min-w-0 pr-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {previewDoc.fileName} · {formatFileSize(previewDoc.fileSize)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                  <span>⬇️</span>
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
              {previewDoc.fileType === 'application/pdf' ? (
                <div className="w-full h-[72vh] flex flex-col">
                  <PdfViewer dataUrl={previewDoc.dataUrl} title={previewDoc.title} />
                </div>
              ) : (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.title}
                  className="max-h-[72vh] max-w-full rounded-xl object-contain shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
