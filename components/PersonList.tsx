'use client';

import React from 'react';
import { Person, SortOption } from '@/types/person';
import { PersonCard } from './PersonCard';

type PersonListProps = {
  people: Person[];
  currentDate: Date;
  sortOption: SortOption;
  searchQuery: string;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
};

export const PersonList: React.FC<PersonListProps> = ({
  people,
  currentDate,
  sortOption,
  searchQuery,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  if (people.length === 0 && searchQuery) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-8 text-center">
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
          No matches found for &ldquo;{searchQuery}&rdquo;
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Try a different name or clear the search field.
        </p>
      </div>
    );
  }

  const isCustomSort = sortOption === 'custom' && !searchQuery;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {people.map((person, index) => (
        <PersonCard
          key={person.id}
          person={person}
          currentDate={currentDate}
          onEdit={onEdit}
          onDelete={onDelete}
          showCustomReorder={isCustomSort}
          canMoveUp={index > 0}
          canMoveDown={index < people.length - 1}
          onMoveUp={() => onMoveUp(index)}
          onMoveDown={() => onMoveDown(index)}
        />
      ))}
    </div>
  );
};
