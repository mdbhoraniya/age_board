import { AgeResult, BirthdayInfo } from '@/types/person';

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
