import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAge,
  formatAge,
  calculateBirthdayInfo,
  formatDateDisplay,
  validateDateOfBirth,
  isLeapYear,
  getGeneration,
} from '../lib/age';

describe('Age Calculation - Calendar Accuracy', () => {
  // Test prompt examples directly against reference date: 2026-09-30
  const refDate = new Date(2026, 8, 30); // 30 Sep 2026 (month is 0-indexed in Date constructor: 8 = Sep)

  test('Example 1: Person 1 (10 Jan 2016) on 30 Sep 2026 -> 10y 8m 20d', () => {
    const age = calculateAge('2016-01-10', refDate);
    assert.equal(age.years, 10);
    assert.equal(age.months, 8);
    assert.equal(age.days, 20);
    assert.equal(formatAge(age), '10 years, 8 months, 20 days');
  });

  test('Example 2: Person 2 (15 Feb 2023) on 30 Sep 2026 -> 3y 7m 15d', () => {
    const age = calculateAge('2023-02-15', refDate);
    assert.equal(age.years, 3);
    assert.equal(age.months, 7);
    assert.equal(age.days, 15);
    assert.equal(formatAge(age), '3 years, 7 months, 15 days');
  });

  test('Example 3: Person 3 (20 Jan 2025) on 30 Sep 2026 -> 1y 8m 10d', () => {
    const age = calculateAge('2025-01-20', refDate);
    assert.equal(age.years, 1);
    assert.equal(age.months, 8);
    assert.equal(age.days, 10);
    assert.equal(formatAge(age), '1 year, 8 months, 10 days');
  });

  test('Birthday today: exactly 10 years old today', () => {
    const current = new Date(2026, 0, 10); // 10 Jan 2026
    const age = calculateAge('2016-01-10', current);
    assert.equal(age.years, 10);
    assert.equal(age.months, 0);
    assert.equal(age.days, 0);
    assert.equal(formatAge(age), '10 years old');

    const bdayInfo = calculateBirthdayInfo('2016-01-10', current);
    assert.equal(bdayInfo.isToday, true);
    assert.equal(bdayInfo.daysUntil, 0);
    assert.equal(bdayInfo.turningAge, 10);
    assert.equal(bdayInfo.formattedCountdown, '🎉 Birthday today!');
  });

  test('Birthday tomorrow', () => {
    const current = new Date(2026, 0, 9); // 9 Jan 2026
    const age = calculateAge('2016-01-10', current);
    assert.equal(age.years, 9);
    assert.equal(age.months, 11);
    assert.equal(age.days, 30); // Dec has 31 days -> 9 - 10 + 31 = 30 days

    const bdayInfo = calculateBirthdayInfo('2016-01-10', current);
    assert.equal(bdayInfo.isToday, false);
    assert.equal(bdayInfo.isTomorrow, true);
    assert.equal(bdayInfo.daysUntil, 1);
    assert.equal(bdayInfo.formattedCountdown, '🎂 Birthday tomorrow!');
  });

  test('Birthday yesterday', () => {
    const current = new Date(2026, 0, 11); // 11 Jan 2026
    const age = calculateAge('2016-01-10', current);
    assert.equal(age.years, 10);
    assert.equal(age.months, 0);
    assert.equal(age.days, 1);
    assert.equal(formatAge(age), '10 years, 1 day');

    const bdayInfo = calculateBirthdayInfo('2016-01-10', current);
    assert.equal(bdayInfo.isToday, false);
    assert.equal(bdayInfo.isYesterday, true);
    assert.equal(bdayInfo.daysUntil > 300, true); // next birthday is next year
  });

  test('Exactly 1 year old', () => {
    const current = new Date(2025, 4, 15); // 15 May 2025
    const age = calculateAge('2024-04-15', current); // 1 year 1 month
    assert.equal(age.years, 1);
    assert.equal(age.months, 1);
    assert.equal(age.days, 0);

    const exactOneYear = calculateAge('2024-05-15', current);
    assert.equal(exactOneYear.years, 1);
    assert.equal(exactOneYear.months, 0);
    assert.equal(exactOneYear.days, 0);
    assert.equal(formatAge(exactOneYear), '1 year old');
  });

  test('Under 1 year old (infant: 5 months, 12 days)', () => {
    const current = new Date(2026, 7, 24); // 24 Aug 2026
    const age = calculateAge('2026-03-12', current);
    assert.equal(age.years, 0);
    assert.equal(age.months, 5);
    assert.equal(age.days, 12);
    assert.equal(formatAge(age), '5 months, 12 days');
  });

  test('Born today', () => {
    const current = new Date(2026, 8, 30);
    const age = calculateAge('2026-09-30', current);
    assert.equal(age.years, 0);
    assert.equal(age.months, 0);
    assert.equal(age.days, 0);
    assert.equal(formatAge(age), 'Born today');
  });

  test('Singular formatting for 1 year, 1 month, 1 day', () => {
    const current = new Date(2026, 3, 16); // 16 Apr 2026
    const age = calculateAge('2025-03-15', current); // 15 Mar 2025 to 16 Apr 2026
    assert.equal(age.years, 1);
    assert.equal(age.months, 1);
    assert.equal(age.days, 1);
    assert.equal(formatAge(age), '1 year, 1 month, 1 day');
  });

  test('Multiple decades: 80 years old', () => {
    const current = new Date(2026, 8, 30);
    const age = calculateAge('1946-09-30', current);
    assert.equal(age.years, 80);
    assert.equal(age.months, 0);
    assert.equal(age.days, 0);
  });

  test('Leap year recognition', () => {
    assert.equal(isLeapYear(2020), true);
    assert.equal(isLeapYear(2024), true);
    assert.equal(isLeapYear(2000), true);
    assert.equal(isLeapYear(1900), false);
    assert.equal(isLeapYear(2026), false);
  });

  test('Feb 29 leap year birthday behavior', () => {
    // Born 29 Feb 2024 (leap year)
    // On 28 Feb 2025 (non-leap year, day before march)
    const feb28 = new Date(2025, 1, 28);
    const ageFeb28 = calculateAge('2024-02-29', feb28);
    assert.equal(ageFeb28.years, 0);
    assert.equal(ageFeb28.months, 11);
    assert.equal(ageFeb28.days, 30);

    // On 1 Mar 2025 (non-leap year)
    const mar1 = new Date(2025, 2, 1);
    const ageMar1 = calculateAge('2024-02-29', mar1);
    assert.equal(ageMar1.years, 1);
    assert.equal(ageMar1.months, 0);
    assert.equal(ageMar1.days, 0);

    // Birthday countdown on non-leap year
    const bdayInfo = calculateBirthdayInfo('2024-02-29', feb28);
    // Celebrated on Feb 28
    assert.equal(bdayInfo.isToday, true);
  });

  test('Month-end dates: Jan 31 to Feb 28', () => {
    const current = new Date(2025, 1, 28); // 28 Feb 2025
    const age = calculateAge('2025-01-31', current);
    assert.equal(age.years, 0);
    assert.equal(age.months, 0);
    assert.equal(age.days, 28);
  });

  test('Date display formatting', () => {
    assert.equal(formatDateDisplay('2016-01-10'), '10 Jan 2016');
    assert.equal(formatDateDisplay('2023-02-15'), '15 Feb 2023');
    assert.equal(formatDateDisplay('1985-12-05'), '5 Dec 1985');
  });

  test('Validation: future dates and invalid strings', () => {
    const today = new Date(2026, 8, 30);
    assert.equal(validateDateOfBirth('2026-10-01', today).isValid, false);
    assert.equal(validateDateOfBirth('2027-01-01', today).isValid, false);
    assert.equal(validateDateOfBirth('', today).isValid, false);
    assert.equal(validateDateOfBirth('invalid-date', today).isValid, false);
    assert.equal(validateDateOfBirth('2026-02-30', today).isValid, false); // invalid day
    assert.equal(validateDateOfBirth('2016-01-10', today).isValid, true);
  });

  test('Generational classification', () => {
    assert.equal(getGeneration('2020-05-10')?.shortName, 'Gen Alpha');
    assert.equal(getGeneration('2005-08-20')?.shortName, 'Gen Z');
    assert.equal(getGeneration('1990-11-15')?.shortName, 'Millennial');
    assert.equal(getGeneration('1975-03-30')?.shortName, 'Gen X');
    assert.equal(getGeneration('1955-07-04')?.shortName, 'Boomer');
    assert.equal(getGeneration('1935-02-14')?.shortName, 'Silent Gen');
    assert.equal(getGeneration('1915-09-01')?.shortName, 'Greatest Gen');
  });
});
