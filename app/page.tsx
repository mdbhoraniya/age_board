'use client';

import React, { useState, useMemo } from 'react';
import { Person, SortOption } from '@/types/person';
import {
  usePeople,
  savePeopleToStorage,
  generatePersonId,
  sortPeople,
} from '@/lib/storage';
import { useCurrentDate } from '@/lib/useCurrentDate';
import { Header } from '@/components/Header';
import { PersonList } from '@/components/PersonList';
import { EmptyState } from '@/components/EmptyState';
import { SearchAndSort } from '@/components/SearchAndSort';
import { PersonFormModal } from '@/components/PersonFormModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

export default function Home() {
  const currentDate = useCurrentDate();
  const { people, isHydrated } = usePeople();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

  // Search and Sort
  const [sortOption, setSortOption] = useState<SortOption>('custom');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (person: Person) => {
    setEditingPerson(person);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPerson(null);
  };

  const handleSavePerson = ({
    name,
    dateOfBirth,
  }: {
    name: string;
    dateOfBirth: string;
  }) => {
    if (editingPerson) {
      // Edit existing
      const updated = people.map((p) =>
        p.id === editingPerson.id ? { ...p, name, dateOfBirth } : p
      );
      savePeopleToStorage(updated);
    } else {
      // Add new
      const newPerson: Person = {
        id: generatePersonId(),
        name,
        dateOfBirth,
      };
      savePeopleToStorage([...people, newPerson]);
    }
  };

  const handleConfirmDelete = () => {
    if (!personToDelete) return;
    const updated = people.filter((p) => p.id !== personToDelete.id);
    savePeopleToStorage(updated);
    setPersonToDelete(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const nextList = [...people];
    const temp = nextList[index];
    nextList[index] = nextList[index - 1];
    nextList[index - 1] = temp;
    savePeopleToStorage(nextList);
  };

  const handleMoveDown = (index: number) => {
    if (index >= people.length - 1) return;
    const nextList = [...people];
    const temp = nextList[index];
    nextList[index] = nextList[index + 1];
    nextList[index + 1] = temp;
    savePeopleToStorage(nextList);
  };

  // Filter & sort list
  const processedPeople = useMemo(() => {
    let result = people;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    return sortPeople(result, sortOption, currentDate);
  }, [people, searchQuery, sortOption, currentDate]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Header
          totalCount={people.length}
          onAddPerson={handleOpenAdd}
        />

        {!isHydrated ? (
          // Sleek skeleton loading during hydration
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60"
              />
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              onAddPerson={handleOpenAdd}
            />
          </div>
        ) : (
          <div className="mt-2">
            <SearchAndSort
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortOption={sortOption}
              onSortChange={setSortOption}
              showSearch={people.length >= 3 || searchQuery.length > 0}
            />

            <PersonList
              people={processedPeople}
              currentDate={currentDate}
              sortOption={sortOption}
              searchQuery={searchQuery}
              onEdit={handleOpenEdit}
              onDelete={setPersonToDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </div>
        )}
      </main>

      {/* Reassurance Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong>AgeNow</strong> — Private, instant age tracker.
          </p>
          <p className="flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Your dates of birth stay on your device. Zero servers.</span>
          </p>
        </div>
      </footer>

      {/* Add / Edit Person Modal */}
      {isFormOpen && (
        <PersonFormModal
          key={editingPerson ? editingPerson.id : 'new-person'}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSavePerson}
          initialData={editingPerson}
          currentDate={currentDate}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={personToDelete !== null}
        person={personToDelete}
        onClose={() => setPersonToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
