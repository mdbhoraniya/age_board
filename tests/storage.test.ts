import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidPersonObject,
  sortPeople,
  generatePersonId,
  getAllGroups,
  encodeShareData,
  decodeShareData,
  mergePeople,
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

  test('Group validation and getAllGroups', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', dateOfBirth: '2020-01-01', group: 'My Family' },
      { id: '2', name: 'Bob', dateOfBirth: '2018-05-15', group: "Brother's Family" },
      { id: '3', name: 'Charlie', dateOfBirth: '2015-08-20', group: 'My Family' },
      { id: '4', name: 'Dave', dateOfBirth: '2010-12-05' }, // No group
    ];

    assert.equal(isValidPersonObject(people[0]), true);
    assert.equal(isValidPersonObject({ ...people[0], group: 123 as unknown as string }), false);

    const groups = getAllGroups(people);
    assert.deepEqual(groups, ["Brother's Family", 'My Family']);
  });

  test('encodeShareData and decodeShareData roundtrip', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', dateOfBirth: '2020-01-01', group: 'My Family' },
      { id: '2', name: 'Bob', dateOfBirth: '2018-05-15', group: "Brother's Family" },
    ];

    // Encode all
    const encodedAll = encodeShareData(people);
    const decodedAll = decodeShareData(encodedAll);
    assert.ok(decodedAll);
    assert.equal(decodedAll?.people.length, 2);
    assert.equal(decodedAll?.people[0].name, 'Alice');
    assert.equal(decodedAll?.people[1].name, 'Bob');

    // Encode filtered by group
    const encodedBro = encodeShareData(people, "Brother's Family");
    const decodedBro = decodeShareData(encodedBro);
    assert.ok(decodedBro);
    assert.equal(decodedBro?.groupName, "Brother's Family");
    assert.equal(decodedBro?.people.length, 1);
    assert.equal(decodedBro?.people[0].name, 'Bob');
  });

  test('mergePeople handles duplicates and preserves existing records', () => {
    const existing: Person[] = [
      { id: 'p1', name: 'Alice', dateOfBirth: '2020-01-01', group: 'My Family' },
    ];

    const incoming: Person[] = [
      // Duplicate person (same name & DOB)
      { id: 'temp-1', name: 'Alice', dateOfBirth: '2020-01-01' },
      // New person
      { id: 'temp-2', name: 'Bob', dateOfBirth: '2018-05-15', group: "Brother's Family" },
    ];

    const result = mergePeople(existing, incoming);
    assert.equal(result.merged.length, 2);
    assert.equal(result.addedCount, 1);
    assert.equal(result.merged[0].name, 'Alice');
    assert.equal(result.merged[1].name, 'Bob');
    assert.equal(result.merged[1].group, "Brother's Family");
  });
});
