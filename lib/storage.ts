import * as React from 'react';
import { Person, SortOption } from '@/types/person';
import { calculateAge, calculateBirthdayInfo, parseDateParts } from './age';

const STORAGE_KEY = 'agenow_people_v1';

/**
 * Checks if a candidate object is a valid Person.
 */
export function isValidPersonObject(item: unknown): item is Person {
  if (!item || typeof item !== 'object') return false;
  const p = item as Partial<Person>;
  if (typeof p.id !== 'string' || !p.id.trim()) return false;
  if (typeof p.name !== 'string' || !p.name.trim()) return false;
  if (typeof p.dateOfBirth !== 'string' || !p.dateOfBirth.trim()) return false;

  // Validate the date format
  return parseDateParts(p.dateOfBirth) !== null;
}

/**
 * Safely reads the list of people from browser localStorage.
 * Handles corrupted JSON, invalid items, and SSR environments gracefully.
 */
export function loadPeopleFromStorage(): Person[] {
  if (typeof window === 'undefined') return [];

  try {
    const rawData = window.localStorage.getItem(STORAGE_KEY);
    if (!rawData) return [];

    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) return [];

    // Filter and sanitize entries
    const seenIds = new Set<string>();
    const validPeople: Person[] = [];

    for (const item of parsed) {
      if (isValidPersonObject(item)) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          validPeople.push({
            id: item.id.trim(),
            name: item.name.trim(),
            dateOfBirth: item.dateOfBirth.trim(),
          });
        }
      }
    }

    return validPeople;
  } catch (error) {
    console.error('Failed to load AgeNow people from localStorage:', error);
    return [];
  }
}

/**
 * Safely persists the list of people to browser localStorage and notifies subscribers.
 */
export function savePeopleToStorage(people: Person[]): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const sanitized = people.filter(isValidPersonObject);
    const serialized = JSON.stringify(sanitized);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    // Notify all components in current window
    window.dispatchEvent(new Event('agenow_storage_change'));
    return true;
  } catch (error) {
    console.error('Failed to save AgeNow people to localStorage:', error);
    return false;
  }
}

// React 19 external store synchronization
let cachedPeople: Person[] = [];
let cachedRaw = '';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('agenow_storage_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('agenow_storage_change', callback);
  };
}

function getSnapshot(): Person[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY) || '[]';
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPeople = loadPeopleFromStorage();
  }
  return cachedPeople;
}

const EMPTY_PEOPLE: Person[] = [];
function getServerSnapshot(): Person[] {
  return EMPTY_PEOPLE;
}

export function usePeople(): { people: Person[]; isHydrated: boolean } {
  const people = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    // Flag hydration completion asynchronously
    const frame = requestAnimationFrame(() => setIsHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return { people, isHydrated };
}

/**
 * Generates a unique, collision-resistant identifier without extra dependencies.
 */
export function generatePersonId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `person_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sorts people according to the selected SortOption.
 */
export function sortPeople(
  people: Person[],
  sortOption: SortOption,
  currentDate: Date = new Date()
): Person[] {
  const cloned = [...people];

  switch (sortOption) {
    case 'name-asc':
      return cloned.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    case 'name-desc':
      return cloned.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: 'base' }));

    case 'age-desc':
      // Oldest first -> earliest birth date
      return cloned.sort((a, b) => {
        const ageA = calculateAge(a.dateOfBirth, currentDate);
        const ageB = calculateAge(b.dateOfBirth, currentDate);
        return ageB.totalDays - ageA.totalDays;
      });

    case 'age-asc':
      // Youngest first -> latest birth date
      return cloned.sort((a, b) => {
        const ageA = calculateAge(a.dateOfBirth, currentDate);
        const ageB = calculateAge(b.dateOfBirth, currentDate);
        return ageA.totalDays - ageB.totalDays;
      });

    case 'birthday-soon':
      // Closest upcoming birthday first (daysUntil: 0 is today, 1 is tomorrow, etc.)
      return cloned.sort((a, b) => {
        const bdayA = calculateBirthdayInfo(a.dateOfBirth, currentDate);
        const bdayB = calculateBirthdayInfo(b.dateOfBirth, currentDate);
        return bdayA.daysUntil - bdayB.daysUntil;
      });

    case 'custom':
    default:
      return cloned;
  }
}
