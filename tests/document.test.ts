import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFileSize,
  getExpiryStatus,
  generateDocumentId,
} from '../lib/documentStorage';
import { DOCUMENT_CATEGORIES } from '../types/document';

describe('Document Vault & Metadata Tests', () => {
  const refDate = new Date(2026, 9, 7); // 7 Oct 2026

  test('Document categories contain required metadata', () => {
    assert.ok(DOCUMENT_CATEGORIES.length >= 6);
    const birthCert = DOCUMENT_CATEGORIES.find((c) => c.id === 'birth_certificate');
    assert.ok(birthCert);
    assert.equal(birthCert.label, 'Birth Certificate');
    assert.ok(birthCert.icon);
    assert.ok(birthCert.badgeClass);
  });

  test('formatFileSize converts bytes correctly', () => {
    assert.equal(formatFileSize(512), '512 B');
    assert.equal(formatFileSize(1024), '1.0 KB');
    assert.equal(formatFileSize(2048), '2.0 KB');
    assert.equal(formatFileSize(1024 * 1024), '1.0 MB');
    assert.equal(formatFileSize(2.5 * 1024 * 1024), '2.5 MB');
  });

  test('generateDocumentId produces non-empty unique strings', () => {
    const id1 = generateDocumentId();
    const id2 = generateDocumentId();
    assert.ok(id1 && typeof id1 === 'string');
    assert.ok(id2 && typeof id2 === 'string');
    assert.notEqual(id1, id2);
  });

  test('getExpiryStatus correctly identifies unexpired, expiring soon, and expired dates', () => {
    // 1. No expiry
    const noExpiry = getExpiryStatus(undefined, refDate);
    assert.equal(noExpiry.status, 'none');

    // 2. Far in future (e.g. 2028-10-07)
    const validDoc = getExpiryStatus('2028-10-07', refDate);
    assert.equal(validDoc.status, 'valid');
    assert.ok(validDoc.daysRemaining! > 60);

    // 3. Expiring soon (e.g. 15 days in future: 2026-10-22)
    const expiringSoon = getExpiryStatus('2026-10-22', refDate);
    assert.equal(expiringSoon.status, 'expiring_soon');
    assert.equal(expiringSoon.daysRemaining, 15);
    assert.equal(expiringSoon.label, 'Expires in 15 days');

    // 4. Expired (e.g. 2026-10-01, 6 days ago)
    const expiredDoc = getExpiryStatus('2026-10-01', refDate);
    assert.equal(expiredDoc.status, 'expired');
    assert.ok(expiredDoc.daysRemaining! < 0);
    assert.equal(expiredDoc.label, 'Expired 6 days ago');

    // 5. Invalid date string
    const invalidDoc = getExpiryStatus('not-a-date', refDate);
    assert.equal(invalidDoc.status, 'none');
  });

  test('mergePeople generates consistent idMap for document remapping on import', () => {
    const { mergePeople } = require('../lib/storage');
    const existing = [
      { id: 'local-1', name: 'John Doe', dateOfBirth: '1985-04-12' },
    ];
    const incoming = [
      // Matches existing John Doe
      { id: 'remote-1', name: 'John Doe', dateOfBirth: '1985-04-12' },
      // New person Jane Doe
      { id: 'remote-2', name: 'Jane Doe', dateOfBirth: '1990-08-20' },
    ];

    const result = mergePeople(existing, incoming);
    assert.equal(result.merged.length, 2);
    assert.equal(result.idMap['remote-1'], 'local-1');
    assert.ok(result.idMap['remote-2']);
    assert.notEqual(result.idMap['remote-2'], 'remote-2'); // Assigned fresh ID
    assert.equal(result.idMap['remote-2'], result.merged[1].id);
  });
});

