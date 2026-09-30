import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidPersonObject,
  sortPeople,
  generatePersonId,
} from '../lib/storage';
import { Person } from '../types/person';

describe('Storage & Data Validation', () => {
  test('isValidPersonObject validation', () => {
    assert.equal(
      isValidPersonObject({ id: '1', name: 'Alice', dateOfBirth: '2020-01-01' }),
      true
    );
    // Missing fields
    assert.equal(isValidPersonObject({ id: '1', name: 'Alice' }), false);
    assert.equal(isValidPersonObject({ name: 'Alice', dateOfBirth: '2020-01-01' }), false);
    assert.equal(isValidPersonObject(null), false);
    assert.equal(isValidPersonObject('string'), false);
    // Invalid dates
    assert.equal(
      isValidPersonObject({ id: '1', name: 'Alice', dateOfBirth: 'not-a-date' }),
      false
    );
    assert.equal(
      isValidPersonObject({ id: '1', name: 'Alice', dateOfBirth: '2020-02-30' }),
      false
    );
  });

  test('generatePersonId returns unique non-empty string', () => {
    const id1 = generatePersonId();
    const id2 = generatePersonId();
    assert.ok(id1);
    assert.ok(id2);
    assert.notEqual(id1, id2);
  });

  test('sortPeople by name-asc and name-desc', () => {
    const people: Person[] = [
      { id: '1', name: 'Zara', dateOfBirth: '2015-05-10' },
      { id: '2', name: 'Bob', dateOfBirth: '2018-03-12' },
      { id: '3', name: 'Alice', dateOfBirth: '2020-01-01' },
    ];

    const sortedAsc = sortPeople(people, 'name-asc');
    assert.deepEqual(sortedAsc.map((p) => p.name), ['Alice', 'Bob', 'Zara']);

    const sortedDesc = sortPeople(people, 'name-desc');
    assert.deepEqual(sortedDesc.map((p) => p.name), ['Zara', 'Bob', 'Alice']);
  });

  test('sortPeople by age-desc (oldest first) and age-asc (youngest first)', () => {
    const refDate = new Date(2026, 8, 30);
    const people: Person[] = [
      { id: '1', name: 'Middle', dateOfBirth: '2020-01-01' },
      { id: '2', name: 'Oldest', dateOfBirth: '2010-01-01' },
      { id: '3', name: 'Youngest', dateOfBirth: '2025-01-01' },
    ];

    const oldestFirst = sortPeople(people, 'age-desc', refDate);
    assert.deepEqual(oldestFirst.map((p) => p.name), ['Oldest', 'Middle', 'Youngest']);

    const youngestFirst = sortPeople(people, 'age-asc', refDate);
    assert.deepEqual(youngestFirst.map((p) => p.name), ['Youngest', 'Middle', 'Oldest']);
  });

  test('sortPeople by birthday-soon (upcoming birthday)', () => {
    const refDate = new Date(2026, 8, 30); // 30 Sep 2026
    const people: Person[] = [
      { id: '1', name: 'November Birthday', dateOfBirth: '2010-11-15' }, // In ~46 days
      { id: '2', name: 'October Birthday', dateOfBirth: '2015-10-05' },  // In 5 days
      { id: '3', name: 'August Passed', dateOfBirth: '2018-08-01' },     // Next year (~305 days)
    ];

    const sortedBday = sortPeople(people, 'birthday-soon', refDate);
    assert.deepEqual(sortedBday.map((p) => p.name), [
      'October Birthday',
      'November Birthday',
      'August Passed',
    ]);
  });
});
