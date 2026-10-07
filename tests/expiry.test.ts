import test from 'node:test';
import assert from 'node:assert/strict';
import { Person } from '../types/person';
import { PersonDocument } from '../types/document';
import { getExpiringDocumentsSummary } from '../lib/documentStorage';

test('Expiring Document Alerts - Summary & Sorting', async (t) => {
  const people: Person[] = [
    { id: 'p1', name: 'Alice', dateOfBirth: '1990-01-01' },
    { id: 'p2', name: 'Bob', dateOfBirth: '2015-05-05' },
  ];

  const refDate = new Date(2026, 9, 7); // 7 Oct 2026

  const docs: PersonDocument[] = [
    // Expired 7 days ago (30 Sep 2026)
    {
      id: 'd1',
      personId: 'p1',
      title: 'Old Passport',
      category: 'passport',
      fileName: 'passport.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      dataUrl: 'data:application/pdf;base64,abc',
      expiryDate: '2026-09-30',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    // Expiring in 8 days (15 Oct 2026)
    {
      id: 'd2',
      personId: 'p1',
      title: 'National ID',
      category: 'national_id',
      fileName: 'id.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      dataUrl: 'data:application/pdf;base64,abc',
      expiryDate: '2026-10-15',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    // Expiring in 23 days (30 Oct 2026)
    {
      id: 'd3',
      personId: 'p2',
      title: 'Health Card',
      category: 'health_insurance',
      fileName: 'health.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      dataUrl: 'data:application/pdf;base64,abc',
      expiryDate: '2026-10-30',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    // Valid for 2 years (no alert)
    {
      id: 'd4',
      personId: 'p2',
      title: 'School ID',
      category: 'school',
      fileName: 'school.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      dataUrl: 'data:application/pdf;base64,abc',
      expiryDate: '2028-10-30',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    // No expiry date
    {
      id: 'd5',
      personId: 'p2',
      title: 'Birth Certificate',
      category: 'birth_certificate',
      fileName: 'birth.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      dataUrl: 'data:application/pdf;base64,abc',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  await t.test('Correctly groups expired and expiring soon documents', () => {
    const summary = getExpiringDocumentsSummary(docs, people, refDate);

    assert.equal(summary.expired.length, 1);
    assert.equal(summary.expired[0].document.title, 'Old Passport');
    assert.equal(summary.expired[0].person.name, 'Alice');
    assert.equal(summary.expired[0].daysRemaining, -7);

    assert.equal(summary.expiringSoon.length, 2);
    // Closest to expiry first
    assert.equal(summary.expiringSoon[0].document.title, 'National ID');
    assert.equal(summary.expiringSoon[0].daysRemaining, 8);
    assert.equal(summary.expiringSoon[1].document.title, 'Health Card');
    assert.equal(summary.expiringSoon[1].daysRemaining, 23);

    assert.equal(summary.totalAlerts, 3);
    assert.equal(summary.totalWithExpiry, 4);
  });
});
