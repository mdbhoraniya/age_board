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
  if (p.group !== undefined && typeof p.group !== 'string') return false;

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
            group: typeof item.group === 'string' && item.group.trim() ? item.group.trim() : undefined,
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

/**
 * Returns a sorted unique list of all group names present in people.
 */
export function getAllGroups(people: Person[]): string[] {
  const groupSet = new Set<string>();
  for (const p of people) {
    if (p.group && p.group.trim()) {
      groupSet.add(p.group.trim());
    }
  }
  return Array.from(groupSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Encodes people (optionally filtered by group) into a URL-safe Base64 string for sharing.
 */
export function encodeShareData(people: Person[], groupFilter?: string): string {
  const filtered = groupFilter
    ? people.filter((p) => p.group === groupFilter)
    : people;

  const payload = {
    v: 1,
    sharedAt: new Date().toISOString(),
    group: groupFilter || null,
    people: filtered.map((p) => ({
      name: p.name,
      dateOfBirth: p.dateOfBirth,
      group: p.group || undefined,
    })),
  };

  const json = JSON.stringify(payload);
  // URL-safe base64 using TextEncoder
  const binString = Array.from(new TextEncoder().encode(json), (byte) =>
    String.fromCharCode(byte)
  ).join('');
  return encodeURIComponent(btoa(binString));
}

/**
 * Decodes a shared Base64 string back into valid Person objects.
 */
export function decodeShareData(encodedStr: string): {
  people: Person[];
  groupName?: string;
} | null {
  try {
    const unencoded = decodeURIComponent(encodedStr);
    const binString = atob(unencoded);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);

    let rawList: unknown[] = [];
    let groupName: string | undefined = undefined;

    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.people)) {
        rawList = parsed.people;
        if (typeof parsed.group === 'string' && parsed.group.trim()) {
          groupName = parsed.group.trim();
        }
      } else if (Array.isArray(parsed)) {
        rawList = parsed;
      }
    }

    const validPeople: Person[] = [];
    for (const item of rawList) {
      if (item && typeof item === 'object') {
        const candidate = item as Partial<Person>;
        if (
          typeof candidate.name === 'string' &&
          candidate.name.trim() &&
          typeof candidate.dateOfBirth === 'string' &&
          parseDateParts(candidate.dateOfBirth) !== null
        ) {
          validPeople.push({
            id: generatePersonId(),
            name: candidate.name.trim(),
            dateOfBirth: candidate.dateOfBirth.trim(),
            group:
              typeof candidate.group === 'string' && candidate.group.trim()
                ? candidate.group.trim()
                : groupName || undefined,
          });
        }
      }
    }

    if (validPeople.length === 0) return null;

    return { people: validPeople, groupName };
  } catch (error) {
    console.error('Failed to decode shared data:', error);
    return null;
  }
}

/**
 * Merges incoming shared people with existing people without duplicating
 * individuals who share the exact same name and date of birth.
 */
export function mergePeople(
  existing: Person[],
  incoming: Person[]
): { merged: Person[]; addedCount: number; updatedCount: number } {
  const merged = [...existing];
  let addedCount = 0;
  let updatedCount = 0;

  for (const item of incoming) {
    // Check if an existing person has the exact same name (case-insensitive) and DOB
    const matchIndex = merged.findIndex(
      (p) =>
        p.name.toLowerCase().trim() === item.name.toLowerCase().trim() &&
        p.dateOfBirth === item.dateOfBirth
    );

    if (matchIndex >= 0) {
      // If matched and incoming has a group while existing doesn't, update the group
      if (item.group && !merged[matchIndex].group) {
        merged[matchIndex] = {
          ...merged[matchIndex],
          group: item.group,
        };
        updatedCount++;
      }
    } else {
      // Add as new person with fresh ID
      merged.push({
        ...item,
        id: generatePersonId(),
      });
      addedCount++;
    }
  }

  return { merged, addedCount, updatedCount };
}
