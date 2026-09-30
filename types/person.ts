export type Person = {
  id: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
};

export type AgeResult = {
  years: number;
  months: number;
  days: number;
  totalDays: number;
};

export type BirthdayInfo = {
  isToday: boolean;
  isTomorrow: boolean;
  isYesterday: boolean;
  daysUntil: number; // 0 for today, 1..366
  turningAge: number; // Age on their next birthday
  formattedCountdown: string; // e.g. "🎉 Birthday today!", "🎂 Birthday tomorrow!", "🎂 In 12 days"
  formattedNextDate: string; // e.g. "10 Jan 2027"
};

export type SortOption =
  | 'custom'
  | 'name-asc'
  | 'name-desc'
  | 'age-desc'
  | 'age-asc'
  | 'birthday-soon';
