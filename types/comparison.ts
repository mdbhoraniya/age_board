import { Person } from './person';

export type AgeDifference = {
  isSameDay: boolean;
  olderPerson: Person | null;
  youngerPerson: Person | null;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  remainingDays: number;
  formattedDifference: string;
  olderBirthDate: string;
  youngerBirthDate: string;
  olderAgeWhenYoungerBorn: string;
  historicalMilestoneDate: string | null;
  ratioMultiplier: number | null;
};

export type GroupAgeStats = {
  totalPeople: number;
  averageAgeFormatted: string;
  averageDays: number;
  medianAgeFormatted: string;
  oldestPerson: Person;
  youngestPerson: Person;
  spanYears: number;
  spanMonths: number;
  spanDays: number;
  spanFormatted: string;
};
