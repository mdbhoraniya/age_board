import { AgeResult, BirthdayInfo, GenerationInfo, Person } from '@/types/person';
import { AgeDifference, GroupAgeStats } from '@/types/comparison';

/**
 * Checks if a given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns the number of days in a specific month of a specific year.
 * @param year Full year (e.g. 2026)
 * @param month 1-indexed month (1 = Jan, 12 = Dec)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Safely parses YYYY-MM-DD into [year, month, day] numbers.
 * Avoids any timezone skew from native Date(string) UTC parsing.
 */
export function parseDateParts(dateStr: string): [number, number, number] | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (year < 1850 || year > 2200) return null;
  if (month < 1 || month > 12) return null;

  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) return null;

  return [year, month, day];
}

/**
 * Validates a birth date string (YYYY-MM-DD).
 */
export function validateDateOfBirth(
  dateStr: string,
  referenceDate: Date = new Date()
): { isValid: boolean; error?: string } {
  if (!dateStr || !dateStr.trim()) {
    return { isValid: false, error: 'Date of birth is required' };
  }

  const parts = parseDateParts(dateStr);
  if (!parts) {
    return { isValid: false, error: 'Please enter a valid calendar date' };
  }

  const [bYear, bMonth, bDay] = parts;

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;
  const refDay = referenceDate.getDate();

  // Check if future date
  if (
    bYear > refYear ||
    (bYear === refYear && bMonth > refMonth) ||
    (bYear === refYear && bMonth === refMonth && bDay > refDay)
  ) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }

  return { isValid: true };
}

/**
 * Calculates calendar-accurate age (years, months, days) from a birth date (YYYY-MM-DD).
 */
export function calculateAge(
  dateOfBirth: string,
  currentDate: Date = new Date()
): AgeResult {
  const parts = parseDateParts(dateOfBirth);
  if (!parts) {
    return { years: 0, months: 0, days: 0, totalDays: 0 };
  }

  const [birthYear, birthMonth, birthDay] = parts;

  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const curDay = currentDate.getDate();

  // If birth date is in the future relative to currentDate
  if (
    birthYear > curYear ||
    (birthYear === curYear && birthMonth > curMonth) ||
    (birthYear === curYear && birthMonth === curMonth && birthDay > curDay)
  ) {
    return { years: 0, months: 0, days: 0, totalDays: 0 };
  }

  let years = curYear - birthYear;
  let months = curMonth - birthMonth;
  let days = curDay - birthDay;

  if (days < 0) {
    // Borrow days from the previous month
    const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
    const prevMonthYear = curMonth === 1 ? curYear - 1 : curYear;
    days += getDaysInMonth(prevMonthYear, prevMonth);
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  // Calculate total days elapsed (calendar midnight to calendar midnight)
  const birthMidnight = Date.UTC(birthYear, birthMonth - 1, birthDay);
  const curMidnight = Date.UTC(curYear, curMonth - 1, curDay);
  const totalDays = Math.max(
    0,
    Math.floor((curMidnight - birthMidnight) / (1000 * 60 * 60 * 24))
  );

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays,
  };
}

/**
 * Returns singular or plural unit string.
 * Example: 1 year, 2 years, 1 month, 0 months.
 */
export function formatUnit(value: number, unit: 'year' | 'month' | 'day'): string {
  return `${value} ${value === 1 ? unit : `${unit}s`}`;
}

/**
 * Formats full age string with correct singular/plural forms.
 * Example: "10 years, 8 months, 20 days", "10 years, 1 day", "5 months, 12 days", "1 year"
 */
export function formatAge(age: AgeResult): string {
  const { years, months, days } = age;

  if (years === 0 && months === 0 && days === 0) {
    return 'Born today';
  }

  const parts: string[] = [];

  if (years > 0) {
    parts.push(formatUnit(years, 'year'));
  }

  if (months > 0) {
    parts.push(formatUnit(months, 'month'));
  }

  if (days > 0) {
    parts.push(formatUnit(days, 'day'));
  }

  // If both months and days are 0 (e.g. exactly 10 years old on birthday)
  if (parts.length === 1 && years > 0) {
    return `${parts[0]} old`;
  }

  return parts.join(', ');
}


/**
 * Formats a date string (YYYY-MM-DD) into a human readable format like "10 Jan 2016".
 */
export function formatDateDisplay(dateStr: string): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr;

  const [year, month, day] = parts;
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return `${day} ${monthNames[month - 1]} ${year}`;
}

/**
 * Calculates upcoming birthday details, countdown, and highlights.
 */
export function calculateBirthdayInfo(
  dateOfBirth: string,
  currentDate: Date = new Date()
): BirthdayInfo {
  const defaultInfo: BirthdayInfo = {
    isToday: false,
    isTomorrow: false,
    isYesterday: false,
    daysUntil: 0,
    turningAge: 0,
    formattedCountdown: '',
    formattedNextDate: '',
  };

  const parts = parseDateParts(dateOfBirth);
  if (!parts) return defaultInfo;

  const [birthYear, birthMonth, birthDay] = parts;
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const curDay = currentDate.getDate();

  const curMidnight = Date.UTC(curYear, curMonth - 1, curDay);

  // Helper to get birthday midnight timestamp for a target year
  function getBirthdayMidnight(targetYear: number): { timestamp: number; displayDay: number; displayMonth: number } {
    let day = birthDay;
    // Handle Feb 29 for non-leap years
    if (birthMonth === 2 && birthDay === 29 && !isLeapYear(targetYear)) {
      day = 28; // celebrated on Feb 28 on non-leap years
    }
    return {
      timestamp: Date.UTC(targetYear, birthMonth - 1, day),
      displayDay: day,
      displayMonth: birthMonth,
    };
  }

  const thisYearBday = getBirthdayMidnight(curYear);
  const diffThisYear = Math.round((thisYearBday.timestamp - curMidnight) / (1000 * 60 * 60 * 24));

  let daysUntil = 0;
  let targetYear = curYear;
  let bdayDay = thisYearBday.displayDay;
  let bdayMonth = thisYearBday.displayMonth;

  if (diffThisYear === 0) {
    // Birthday is TODAY!
    return {
      isToday: true,
      isTomorrow: false,
      isYesterday: false,
      daysUntil: 0,
      turningAge: Math.max(0, curYear - birthYear),
      formattedCountdown: '🎉 Birthday today!',
      formattedNextDate: formatDateDisplay(`${curYear}-${String(bdayMonth).padStart(2, '0')}-${String(bdayDay).padStart(2, '0')}`),
    };
  } else if (diffThisYear > 0) {
    // Birthday is later this year
    daysUntil = diffThisYear;
    targetYear = curYear;
  } else {
    // Birthday has passed this year; next birthday is next year
    targetYear = curYear + 1;
    const nextYearBday = getBirthdayMidnight(targetYear);
    bdayDay = nextYearBday.displayDay;
    bdayMonth = nextYearBday.displayMonth;
    daysUntil = Math.round((nextYearBday.timestamp - curMidnight) / (1000 * 60 * 60 * 24));
  }

  // Check if yesterday was birthday
  const yesterdayMidnight = curMidnight - 1000 * 60 * 60 * 24;
  const isYesterday = thisYearBday.timestamp === yesterdayMidnight;

  const isTomorrow = daysUntil === 1;
  const turningAge = Math.max(0, targetYear - birthYear);

  let formattedCountdown = '';
  if (isTomorrow) {
    formattedCountdown = '🎂 Birthday tomorrow!';
  } else if (daysUntil <= 30) {
    formattedCountdown = `🎂 In ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;
  } else {
    // Calculate approximate months remaining
    const monthsRemaining = Math.floor(daysUntil / 30.44);
    if (monthsRemaining >= 1) {
      formattedCountdown = `🎂 In ${monthsRemaining} ${monthsRemaining === 1 ? 'month' : 'months'}`;
    } else {
      formattedCountdown = `🎂 In ${daysUntil} days`;
    }
  }

  const formattedNextDate = formatDateDisplay(
    `${targetYear}-${String(bdayMonth).padStart(2, '0')}-${String(bdayDay).padStart(2, '0')}`
  );

  return {
    isToday: false,
    isTomorrow,
    isYesterday,
    daysUntil,
    turningAge,
    formattedCountdown,
    formattedNextDate,
  };
}

/**
 * Determines the generation of a person based on their birth year.
 */
export function getGeneration(dateOfBirth: string): GenerationInfo | null {
  const parts = parseDateParts(dateOfBirth);
  if (!parts) return null;
  const [year] = parts;

  if (year >= 2013) {
    return {
      name: 'Generation Alpha',
      shortName: 'Gen Alpha',
      yearsRange: '2013 – Present',
      colorClass: 'text-purple-700 dark:text-purple-300',
      bgClass: 'bg-purple-50 dark:bg-purple-950/50',
      borderClass: 'border-purple-200 dark:border-purple-800/60',
    };
  }
  if (year >= 1997) {
    return {
      name: 'Generation Z',
      shortName: 'Gen Z',
      yearsRange: '1997 – 2012',
      colorClass: 'text-cyan-700 dark:text-cyan-300',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/50',
      borderClass: 'border-cyan-200 dark:border-cyan-800/60',
    };
  }
  if (year >= 1981) {
    return {
      name: 'Millennial',
      shortName: 'Millennial',
      yearsRange: '1981 – 1996',
      colorClass: 'text-emerald-700 dark:text-emerald-300',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderClass: 'border-emerald-200 dark:border-emerald-800/60',
    };
  }
  if (year >= 1965) {
    return {
      name: 'Generation X',
      shortName: 'Gen X',
      yearsRange: '1965 – 1980',
      colorClass: 'text-amber-700 dark:text-amber-300',
      bgClass: 'bg-amber-50 dark:bg-amber-950/50',
      borderClass: 'border-amber-200 dark:border-amber-800/60',
    };
  }
  if (year >= 1946) {
    return {
      name: 'Baby Boomer',
      shortName: 'Boomer',
      yearsRange: '1946 – 1964',
      colorClass: 'text-rose-700 dark:text-rose-300',
      bgClass: 'bg-rose-50 dark:bg-rose-950/50',
      borderClass: 'border-rose-200 dark:border-rose-800/60',
    };
  }
  if (year >= 1928) {
    return {
      name: 'Silent Generation',
      shortName: 'Silent Gen',
      yearsRange: '1928 – 1945',
      colorClass: 'text-indigo-700 dark:text-indigo-300',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/50',
      borderClass: 'border-indigo-200 dark:border-indigo-800/60',
    };
  }
  return {
    name: 'Greatest Generation',
    shortName: 'Greatest Gen',
    yearsRange: '1901 – 1927',
    colorClass: 'text-slate-700 dark:text-slate-300',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    borderClass: 'border-slate-200 dark:border-slate-700',
  };
}

/**
 * Calculates calendar-accurate difference between two people's ages.
 */
export function calculateAgeDifference(
  personA: Person,
  personB: Person,
  currentDate: Date = new Date()
): AgeDifference {
  const partsA = parseDateParts(personA.dateOfBirth);
  const partsB = parseDateParts(personB.dateOfBirth);

  if (!partsA || !partsB) {
    return {
      isSameDay: true,
      olderPerson: personA,
      youngerPerson: personB,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalWeeks: 0,
      remainingDays: 0,
      formattedDifference: '0 days',
      olderBirthDate: personA.dateOfBirth,
      youngerBirthDate: personB.dateOfBirth,
      olderAgeWhenYoungerBorn: '0 days',
      historicalMilestoneDate: null,
      ratioMultiplier: 1.0,
    };
  }

  const midA = Date.UTC(partsA[0], partsA[1] - 1, partsA[2]);
  const midB = Date.UTC(partsB[0], partsB[1] - 1, partsB[2]);

  if (midA === midB) {
    return {
      isSameDay: true,
      olderPerson: personA,
      youngerPerson: personB,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalWeeks: 0,
      remainingDays: 0,
      formattedDifference: 'Same age (born on the exact same day)',
      olderBirthDate: personA.dateOfBirth,
      youngerBirthDate: personB.dateOfBirth,
      olderAgeWhenYoungerBorn: 'Same day',
      historicalMilestoneDate: null,
      ratioMultiplier: 1.0,
    };
  }

  const isAOlder = midA < midB;
  const older = isAOlder ? personA : personB;
  const younger = isAOlder ? personB : personA;
  const olderMid = isAOlder ? midA : midB;
  const youngerMid = isAOlder ? midB : midA;
  const olderParts = isAOlder ? partsA : partsB;
  const youngerParts = isAOlder ? partsB : partsA;

  // Age of older person on the exact calendar day younger was born
  const youngerBirthDateObj = new Date(youngerParts[0], youngerParts[1] - 1, youngerParts[2]);
  const gapAge = calculateAge(older.dateOfBirth, youngerBirthDateObj);

  const totalDays = Math.max(0, Math.floor((youngerMid - olderMid) / (1000 * 60 * 60 * 24)));
  const totalWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;
  const formattedDifference = formatAge(gapAge);

  // Ratio multiplier
  const ageOlder = calculateAge(older.dateOfBirth, currentDate);
  const ageYounger = calculateAge(younger.dateOfBirth, currentDate);
  let ratioMultiplier: number | null = null;
  if (ageYounger.totalDays > 0) {
    ratioMultiplier = Math.round((ageOlder.totalDays / ageYounger.totalDays) * 10) / 10;
  }

  // Historical date when older was younger's current age
  let historicalMilestoneDate: string | null = null;
  if (ageYounger.totalDays > 0) {
    const milestoneDate = new Date(olderParts[0], olderParts[1] - 1, olderParts[2]);
    milestoneDate.setFullYear(milestoneDate.getFullYear() + ageYounger.years);
    milestoneDate.setMonth(milestoneDate.getMonth() + ageYounger.months);
    milestoneDate.setDate(milestoneDate.getDate() + ageYounger.days);

    const mYear = milestoneDate.getFullYear();
    const mMonth = String(milestoneDate.getMonth() + 1).padStart(2, '0');
    const mDay = String(milestoneDate.getDate()).padStart(2, '0');
    historicalMilestoneDate = formatDateDisplay(`${mYear}-${mMonth}-${mDay}`);
  }

  return {
    isSameDay: false,
    olderPerson: older,
    youngerPerson: younger,
    years: gapAge.years,
    months: gapAge.months,
    days: gapAge.days,
    totalDays,
    totalWeeks,
    remainingDays,
    formattedDifference,
    olderBirthDate: older.dateOfBirth,
    youngerBirthDate: younger.dateOfBirth,
    olderAgeWhenYoungerBorn: formattedDifference,
    historicalMilestoneDate,
    ratioMultiplier,
  };
}

/**
 * Calculates aggregate age statistics across a group of people.
 */
export function calculateGroupAgeStats(
  people: Person[],
  currentDate: Date = new Date()
): GroupAgeStats | null {
  if (!people || people.length < 2) return null;

  // Sort descending by age (earliest birthdate first)
  const sorted = [...people].sort((a, b) => {
    const pA = parseDateParts(a.dateOfBirth);
    const pB = parseDateParts(b.dateOfBirth);
    const tA = pA ? Date.UTC(pA[0], pA[1] - 1, pA[2]) : 0;
    const tB = pB ? Date.UTC(pB[0], pB[1] - 1, pB[2]) : 0;
    return tA - tB;
  });

  const oldestPerson = sorted[0];
  const youngestPerson = sorted[sorted.length - 1];
  const spanDiff = calculateAgeDifference(oldestPerson, youngestPerson, currentDate);

  const ages = people.map((p) => calculateAge(p.dateOfBirth, currentDate));
  const totalDays = ages.reduce((sum, a) => sum + a.totalDays, 0);
  const averageDays = Math.round(totalDays / people.length);

  const avgYears = Math.floor(averageDays / 365.2425);
  const remDays = averageDays - Math.floor(avgYears * 365.2425);
  const avgMonths = Math.floor(remDays / 30.4375);
  const averageAgeFormatted = avgYears > 0 ? `${avgYears}y ${avgMonths}m` : `${avgMonths}m`;

  // Median calculation
  const sortedDays = [...ages].map((a) => a.totalDays).sort((a, b) => a - b);
  const midIndex = Math.floor(sortedDays.length / 2);
  const medianDays =
    sortedDays.length % 2 !== 0
      ? sortedDays[midIndex]
      : Math.round((sortedDays[midIndex - 1] + sortedDays[midIndex]) / 2);

  const medYears = Math.floor(medianDays / 365.2425);
  const medRemDays = medianDays - Math.floor(medYears * 365.2425);
  const medMonths = Math.floor(medRemDays / 30.4375);
  const medianAgeFormatted = medYears > 0 ? `${medYears}y ${medMonths}m` : `${medMonths}m`;

  return {
    totalPeople: people.length,
    averageAgeFormatted,
    averageDays,
    medianAgeFormatted,
    oldestPerson,
    youngestPerson,
    spanYears: spanDiff.years,
    spanMonths: spanDiff.months,
    spanDays: spanDiff.days,
    spanFormatted: spanDiff.formattedDifference,
  };
}
