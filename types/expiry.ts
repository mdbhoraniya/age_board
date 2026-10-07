import { PersonDocument } from './document';
import { Person } from './person';
import { ExpiryStatus } from '@/lib/documentStorage';

export type ExpiringDocumentItem = {
  document: PersonDocument;
  person: Person;
  expiryStatus: ExpiryStatus;
  daysRemaining: number;
};

export type ExpiryDashboardSummary = {
  expired: ExpiringDocumentItem[];
  expiringSoon: ExpiringDocumentItem[];
  upcoming: ExpiringDocumentItem[];
  totalWithExpiry: number;
  totalAlerts: number;
};
