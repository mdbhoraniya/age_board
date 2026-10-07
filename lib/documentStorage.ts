import { useState, useEffect } from 'react';
import { PersonDocument, DocumentCategory, DOCUMENT_CATEGORIES } from '@/types/document';
import { Person } from '@/types/person';
import { ExpiringDocumentItem, ExpiryDashboardSummary } from '@/types/expiry';

const DB_NAME = 'ageboard_vault_v1';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
const CHANGE_EVENT = 'ageboard_documents_changed';

/**
 * Format bytes into human-readable string (KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ExpiryStatus = {
  status: 'expired' | 'expiring_soon' | 'valid' | 'none';
  label: string;
  badgeClass: string;
  daysRemaining: number | null;
};

/**
 * Evaluates document expiry date relative to reference date.
 */
export function getExpiryStatus(expiryDate?: string, refDate: Date = new Date()): ExpiryStatus {
  if (!expiryDate || !expiryDate.trim()) {
    return {
      status: 'none',
      label: 'No Expiry',
      badgeClass: 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800',
      daysRemaining: null,
    };
  }

  const parts = expiryDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return {
      status: 'none',
      label: 'Invalid Date',
      badgeClass: 'text-slate-400 bg-slate-100 dark:bg-slate-800',
      daysRemaining: null,
    };
  }

  const [year, month, day] = parts;
  const expiry = new Date(year, month - 1, day);
  const now = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      status: 'expired',
      label: overdue === 1 ? 'Expired yesterday' : `Expired ${overdue} days ago`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 60) {
    return {
      status: 'expiring_soon',
      label: diffDays === 0 ? 'Expires today' : diffDays === 1 ? 'Expires tomorrow' : `Expires in ${diffDays} days`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      daysRemaining: diffDays,
    };
  }

  return {
    status: 'valid',
    label: `Valid (${expiryDate})`,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    daysRemaining: diffDays,
  };
}

export function generateDocumentId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Open or initialize the IndexedDB instance.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('personId', 'personId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

/**
 * Save or update a document in IndexedDB.
 */
export async function saveDocument(doc: PersonDocument): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(doc);

    request.onsuccess = () => {
      notifyChange();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update an existing document with a new updatedAt timestamp.
 */
export async function updateDocument(doc: PersonDocument): Promise<void> {
  const updatedDoc: PersonDocument = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };
  return saveDocument(updatedDoc);
}

/**
 * Get all documents for a specific person.
 */
export async function getDocumentsForPerson(personId: string): Promise<PersonDocument[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('personId');
      const request = index.getAll(personId);

      request.onsuccess = () => {
        const results = (request.result as PersonDocument[]) || [];
        // Sort newest first
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load documents for person:', error);
    return [];
  }
}

/**
 * Delete a specific document by its ID.
 */
export async function deleteDocument(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyChange();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete all documents associated with a person when they are removed.
 */
export async function deleteDocumentsForPerson(personId: string): Promise<void> {
  try {
    const docs = await getDocumentsForPerson(personId);
    if (docs.length === 0) return;

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const d of docs) {
        store.delete(d.id);
      }
      tx.oncomplete = () => {
        notifyChange();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to purge documents for person:', error);
  }
}

/**
 * Get map of document counts by personId.
 */
export async function getDocumentCounts(): Promise<Record<string, number>> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const docs = (request.result as PersonDocument[]) || [];
        const counts: Record<string, number> = {};
        for (const doc of docs) {
          counts[doc.personId] = (counts[doc.personId] || 0) + 1;
        }
        resolve(counts);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return {};
  }
}

/**
 * Get all stored documents across all people.
 */
export async function getAllDocuments(): Promise<PersonDocument[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as PersonDocument[]) || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Import documents from a backup file, remapping their personId according to idMap.
 */
export async function importDocumentsWithMapping(
  docs: PersonDocument[],
  idMap?: Record<string, string>
): Promise<number> {
  if (!Array.isArray(docs) || docs.length === 0) return 0;
  try {
    const db = await openDB();
    const existingDocs = await getAllDocuments();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      let importedCount = 0;

      for (const item of docs) {
        if (!item || !item.dataUrl || !item.personId) continue;

        // Resolve personId if remapped during people merge
        const resolvedPersonId = (idMap && idMap[item.personId]) ? idMap[item.personId] : item.personId;

        // Check if an identical document already exists for this person to avoid duplicates
        const isDuplicate = existingDocs.some(
          (ed) =>
            ed.personId === resolvedPersonId &&
            ed.fileName === item.fileName &&
            ed.title === item.title &&
            ed.fileSize === item.fileSize
        );

        if (!isDuplicate) {
          const docToSave: PersonDocument = {
            ...item,
            id: generateDocumentId(),
            personId: resolvedPersonId,
            updatedAt: new Date().toISOString(),
          };
          store.put(docToSave);
          importedCount++;
        }
      }

      tx.oncomplete = () => {
        if (importedCount > 0) notifyChange();
        resolve(importedCount);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to import documents from backup:', error);
    return 0;
  }
}

/**
 * React hook that returns reactive document counts for each person.
 */
export function useDocumentCounts(): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      const data = await getDocumentCounts();
      if (mounted) setCounts(data);
    };

    fetchCounts();

    const handleChange = () => {
      fetchCounts();
    };

    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => {
      mounted = false;
      window.removeEventListener(CHANGE_EVENT, handleChange);
    };
  }, []);

  return counts;
}

/**
 * React hook that returns all reactive documents across all people.
 */
export function useAllDocuments(): { documents: PersonDocument[]; isLoading: boolean } {
  const [documents, setDocuments] = useState<PersonDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDocs = async () => {
      const data = await getAllDocuments();
      if (mounted) {
        setDocuments(data);
        setIsLoading(false);
      }
    };

    fetchDocs();

    const handleChange = () => {
      fetchDocs();
    };

    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => {
      mounted = false;
      window.removeEventListener(CHANGE_EVENT, handleChange);
    };
  }, []);

  return { documents, isLoading };
}

/**
 * Categorizes and sorts all documents that have expiry dates into expired, expiring soon, and upcoming.
 */
export function getExpiringDocumentsSummary(
  documents: PersonDocument[],
  people: Person[],
  refDate: Date = new Date()
): ExpiryDashboardSummary {
  const peopleMap = new Map<string, Person>();
  people.forEach((p) => peopleMap.set(p.id, p));

  const expired: ExpiringDocumentItem[] = [];
  const expiringSoon: ExpiringDocumentItem[] = [];
  const upcoming: ExpiringDocumentItem[] = [];
  let totalWithExpiry = 0;

  for (const doc of documents) {
    if (!doc.expiryDate || !doc.expiryDate.trim()) continue;

    const person = peopleMap.get(doc.personId);
    if (!person) continue;

    totalWithExpiry++;
    const expiryStatus = getExpiryStatus(doc.expiryDate, refDate);
    const daysRemaining = expiryStatus.daysRemaining ?? 0;

    const item: ExpiringDocumentItem = {
      document: doc,
      person,
      expiryStatus,
      daysRemaining,
    };

    if (expiryStatus.status === 'expired') {
      expired.push(item);
    } else if (expiryStatus.status === 'expiring_soon') {
      expiringSoon.push(item);
    } else if (expiryStatus.status === 'valid' && daysRemaining <= 180) {
      upcoming.push(item);
    }
  }

  // Sort expired by daysRemaining ascending (most overdue first: e.g. -60, -10, -1)
  expired.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Sort expiring soon by daysRemaining ascending (closest to expiry first: 0, 1, 10, 45)
  expiringSoon.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Sort upcoming by daysRemaining ascending
  upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return {
    expired,
    expiringSoon,
    upcoming,
    totalWithExpiry,
    totalAlerts: expired.length + expiringSoon.length,
  };
}

