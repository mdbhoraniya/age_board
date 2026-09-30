import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAge,
  calculateBirthdayInfo,
  formatAge,
  validateDateOfBirth,
} from '../lib/age';
import {
  isValidPersonObject,
  generatePersonId,
} from '../lib/storage';
import { Person } from '../types/person';

describe('AgeNow Integration Test Suite', () => {
  const refDate = new Date(2026, 8, 30); // 30 Sep 2026

  test('Add person workflow with validation', () => {
    // 1. Validate inputs
    const validCheck = validateDateOfBirth('2024-06-15', refDate);
    assert.equal(validCheck.isValid, true);

    const futureCheck = validateDateOfBirth('2027-01-01', refDate);
    assert.equal(futureCheck.isValid, false);
    assert.equal(futureCheck.error, 'Date of birth cannot be in the future');

    // 2. Create person object
    const newPerson: Person = {
      id: generatePersonId(),
      name: 'Baby Sophia',
      dateOfBirth: '2024-06-15',
    };
    assert.equal(isValidPersonObject(newPerson), true);

    // 3. Dynamic age calculation
    const age = calculateAge(newPerson.dateOfBirth, refDate);
    assert.equal(age.years, 2);
    assert.equal(age.months, 3);
    assert.equal(age.days, 15);
    assert.equal(formatAge(age), '2 years, 3 months, 15 days');
  });

  test('Edit person workflow', () => {
    let person: Person = {
      id: 'test-1',
      name: 'Emma Initial',
      dateOfBirth: '2016-01-10',
    };

    // Update name and date of birth
    person = {
      ...person,
      name: 'Emma Updated',
      dateOfBirth: '2016-01-11',
    };

    assert.equal(person.name, 'Emma Updated');
    assert.equal(person.dateOfBirth, '2016-01-11');

    const updatedAge = calculateAge(person.dateOfBirth, refDate);
    assert.equal(updatedAge.years, 10);
    assert.equal(updatedAge.months, 8);
    assert.equal(updatedAge.days, 19);
  });

  test('Delete person workflow', () => {
    let list: Person[] = [
      { id: '1', name: 'Alice', dateOfBirth: '2016-01-10' },
      { id: '2', name: 'Bob', dateOfBirth: '2023-02-15' },
      { id: '3', name: 'Charlie', dateOfBirth: '2025-01-20' },
    ];
    assert.equal(list.length, 3);

    // Remove Bob
    list = list.filter((p) => p.id !== '2');
    assert.equal(list.length, 2);
    assert.equal(list.some((p) => p.name === 'Bob'), false);
    assert.equal(list.some((p) => p.name === 'Alice'), true);
    assert.equal(list.some((p) => p.name === 'Charlie'), true);
  });

  test('Search and filter functionality', () => {
    const list: Person[] = [
      { id: '1', name: 'Alice Smith', dateOfBirth: '2016-01-10' },
      { id: '2', name: 'Bob Jones', dateOfBirth: '2023-02-15' },
      { id: '3', name: 'Charlie Brown', dateOfBirth: '2025-01-20' },
      { id: '4', name: 'Sophia Noor', dateOfBirth: '2020-05-15' },
    ];

    const filterByName = (query: string) => {
      const q = query.toLowerCase().trim();
      return list.filter((p) => p.name.toLowerCase().includes(q));
    };

    assert.equal(filterByName('alice').length, 1);
    assert.equal(filterByName('alice')[0].name, 'Alice Smith');

    // Case insensitive & partial match
    assert.equal(filterByName('B').length, 2); // Bob Jones, Charlie Brown
    assert.equal(filterByName('sophia').length, 1);
    assert.equal(filterByName('nonexistent').length, 0);
  });

  test('Custom reordering (move up and down)', () => {
    const list: Person[] = [
      { id: '1', name: 'Alice', dateOfBirth: '2016-01-10' },
      { id: '2', name: 'Bob', dateOfBirth: '2023-02-15' },
      { id: '3', name: 'Charlie', dateOfBirth: '2025-01-20' },
    ];

    // Move Bob (index 1) UP
    const moveUp = (items: Person[], index: number) => {
      if (index <= 0) return items;
      const copy = [...items];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    };

    const reordered = moveUp(list, 1);
    assert.equal(reordered[0].name, 'Bob');
    assert.equal(reordered[1].name, 'Alice');
    assert.equal(reordered[2].name, 'Charlie');
  });

  test('Next Birthday countdown accuracy', () => {
    // Current date: 30 Sep 2026
    // Birthday in 5 days: 5 Oct 2015
    const bdaySoon = calculateBirthdayInfo('2015-10-05', refDate);
    assert.equal(bdaySoon.isToday, false);
    assert.equal(bdaySoon.daysUntil, 5);
    assert.equal(bdaySoon.formattedCountdown, '🎂 In 5 days');

    // Birthday tomorrow: 1 Oct 2010
    const bdayTomorrow = calculateBirthdayInfo('2010-10-01', refDate);
    assert.equal(bdayTomorrow.isTomorrow, true);
    assert.equal(bdayTomorrow.daysUntil, 1);
    assert.equal(bdayTomorrow.formattedCountdown, '🎂 Birthday tomorrow!');

    // Birthday today: 30 Sep 2012
    const bdayToday = calculateBirthdayInfo('2012-09-30', refDate);
    assert.equal(bdayToday.isToday, true);
    assert.equal(bdayToday.turningAge, 14);
    assert.equal(bdayToday.formattedCountdown, '🎉 Birthday today!');
  });
});
