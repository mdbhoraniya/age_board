export type DocumentCategory =
  | 'birth_certificate'
  | 'passport'
  | 'national_id'
  | 'health_insurance'
  | 'medical'
  | 'school'
  | 'other';

export type PersonDocument = {
  id: string;
  personId: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileType: string;
  fileSize: number; // in bytes
  dataUrl: string; // base64 Data URL
  expiryDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};

export type DocumentCategoryMeta = {
  id: DocumentCategory;
  label: string;
  icon: string;
  colorClass: string;
  badgeClass: string;
};

export const DOCUMENT_CATEGORIES: DocumentCategoryMeta[] = [
  {
    id: 'birth_certificate',
    label: 'Birth Certificate',
    icon: '📜',
    colorClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50',
  },
  {
    id: 'passport',
    label: 'Passport',
    icon: '🛂',
    colorClass: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50',
  },
  {
    id: 'national_id',
    label: 'National ID / Driving License',
    icon: '🪪',
    colorClass: 'text-purple-600 dark:text-purple-400',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/50',
  },
  {
    id: 'health_insurance',
    label: 'Health Insurance',
    icon: '🏥',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50',
  },
  {
    id: 'medical',
    label: 'Medical / Vaccine Record',
    icon: '💉',
    colorClass: 'text-rose-600 dark:text-rose-400',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50',
  },
  {
    id: 'school',
    label: 'School / Academic',
    icon: '🎓',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900/50',
  },
  {
    id: 'other',
    label: 'Other Document',
    icon: '📁',
    colorClass: 'text-slate-600 dark:text-slate-400',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
];
