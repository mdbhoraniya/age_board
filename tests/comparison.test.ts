import test from 'node:test';
import assert from 'node:assert/strict';
import { Person } from '../types/person';
import { calculateAgeDifference, calculateGroupAgeStats } from '../lib/age';

test('Age Difference & Comparison Tool', async (t) => {
  const personOlder: Person = {
    id: 'p1',
    name: 'Alice',
    dateOfBirth: '2016-01-10',
    group: 'Family',
  };

  const personYounger: Person = {
    id: 'p2',
    name: 'Bob',
    dateOfBirth: '2023-02-15',
    group: 'Family',
  };

  const personSameDay: Person = {
    id: 'p3',
    name: 'Charlie',
    dateOfBirth: '2016-01-10',
    group: 'Family',
  };

  const refDate = new Date(2026, 8, 30); // 30 Sep 2026

  await t.test('Identifies older person correctly regardless of argument order', () => {
    const diff1 = calculateAgeDifference(personOlder, personYounger, refDate);
    const diff2 = calculateAgeDifference(personYounger, personOlder, refDate);

    assert.equal(diff1.olderPerson?.name, 'Alice');
    assert.equal(diff1.youngerPerson?.name, 'Bob');
    assert.equal(diff2.olderPerson?.name, 'Alice');
    assert.equal(diff2.youngerPerson?.name, 'Bob');
    assert.equal(diff1.isSameDay, false);
  });

  await t.test('Calculates exact calendar gap between birthdates', () => {
    const diff = calculateAgeDifference(personOlder, personYounger, refDate);

    // Alice was born 2016-01-10, Bob was born 2023-02-15.
    // On 2023-02-15, Alice was 7 years, 1 month, 5 days old!
    assert.equal(diff.years, 7);
    assert.equal(diff.months, 1);
    assert.equal(diff.days, 5);
    assert.equal(diff.formattedDifference, '7 years, 1 month, 5 days');
    assert.ok(diff.totalDays > 2500);
    assert.ok(diff.totalWeeks > 350);
  });

  await t.test('Handles twins / people born on exact same day', () => {
    const diff = calculateAgeDifference(personOlder, personSameDay, refDate);

    assert.equal(diff.isSameDay, true);
    assert.equal(diff.years, 0);
    assert.equal(diff.months, 0);
    assert.equal(diff.days, 0);
    assert.equal(diff.totalDays, 0);
    assert.equal(diff.formattedDifference, 'Same age (born on the exact same day)');
  });

  await t.test('Calculates historical milestone and ratio multiplier', () => {
    const diff = calculateAgeDifference(personOlder, personYounger, refDate);

    assert.ok(diff.historicalMilestoneDate !== null, 'Should have historical milestone date');
    assert.ok(typeof diff.ratioMultiplier === 'number');
    assert.ok(diff.ratioMultiplier! > 1);
  });

  await t.test('Calculates group age stats across multiple people', () => {
    const group = [personOlder, personYounger, personSameDay];
    const stats = calculateGroupAgeStats(group, refDate);

    assert.ok(stats !== null);
    assert.equal(stats?.totalPeople, 3);
    assert.equal(stats?.oldestPerson.name, 'Alice');
    assert.equal(stats?.youngestPerson.name, 'Bob');
    assert.equal(stats?.spanFormatted, '7 years, 1 month, 5 days');
    assert.ok(stats?.averageAgeFormatted.length! > 0);
    assert.ok(stats?.medianAgeFormatted.length! > 0);
  });
});
