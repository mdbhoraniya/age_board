'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Person, SortOption, LayoutView } from '@/types/person';
import {
  usePeople,
  savePeopleToStorage,
  generatePersonId,
  sortPeople,
  getAllGroups,
  decodeShareData,
  mergePeople,
} from '@/lib/storage';
import { useCurrentDate } from '@/lib/useCurrentDate';
import { Header } from '@/components/Header';
import { PersonList } from '@/components/PersonList';
import { EmptyState } from '@/components/EmptyState';
import { SearchAndSort } from '@/components/SearchAndSort';
import { GroupFilter } from '@/components/GroupFilter';
import { PersonFormModal } from '@/components/PersonFormModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { ShareModal } from '@/components/ShareModal';
import { ImportSharedModal } from '@/components/ImportSharedModal';
import { DocumentVaultModal } from '@/components/DocumentVaultModal';
import { PersonDocument } from '@/types/document';
import {
  useDocumentCounts,
  deleteDocumentsForPerson,
  importDocumentsWithMapping,
} from '@/lib/documentStorage';

export default function Home() {
  const currentDate = useCurrentDate();
  const { people, isHydrated } = usePeople();
  const documentCounts = useDocumentCounts();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [documentPerson, setDocumentPerson] = useState<Person | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Light / Dark mode preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ageboard_theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ageboard_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ageboard_theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Layout View preference (Grid, Compact, Timeline)
  const [layoutView, setLayoutView] = useState<LayoutView>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ageboard_layout_view');
      if (saved === 'grid' || saved === 'compact' || saved === 'timeline') {
        return saved;
      }
    }
    return 'grid';
  });

  // Group filter and Search/Sort
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('custom');
  const [searchQuery, setSearchQuery] = useState('');

  // Shared payload received via link (?import=...)
  const [sharedIncoming, setSharedIncoming] = useState<{
    people: Person[];
    groupName?: string;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const importData = params.get('import');
      if (importData) {
        const decoded = decodeShareData(importData);
        if (decoded && decoded.people.length > 0) {
          return decoded;
        }
      }
    }
    return null;
  });

  const allGroups = useMemo(() => getAllGroups(people), [people]);

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

  const handleLayoutViewChange = (newView: LayoutView) => {
    setLayoutView(newView);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ageboard_layout_view', newView);
    }
  };

  const handleSavePerson = ({
    name,
    dateOfBirth,
    group,
  }: {
    name: string;
    dateOfBirth: string;
    group?: string;
  }) => {
    if (editingPerson) {
      // Edit existing
      const updated = people.map((p) =>
        p.id === editingPerson.id ? { ...p, name, dateOfBirth, group } : p
      );
      savePeopleToStorage(updated);
    } else {
      // Add new
      const newPerson: Person = {
        id: generatePersonId(),
        name,
        dateOfBirth,
        group,
      };
      savePeopleToStorage([...people, newPerson]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!personToDelete) return;
    const idToDelete = personToDelete.id;
    const updated = people.filter((p) => p.id !== idToDelete);
    savePeopleToStorage(updated);
    await deleteDocumentsForPerson(idToDelete);
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

  // Import workflows
  const handleDismissImport = () => {
    setSharedIncoming(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleConfirmMerge = () => {
    if (!sharedIncoming) return;
    const { merged } = mergePeople(people, sharedIncoming.people);
    savePeopleToStorage(merged);
    if (sharedIncoming.groupName) {
      setSelectedGroup(sharedIncoming.groupName);
    }
    handleDismissImport();
  };

  const handleConfirmReplace = () => {
    if (!sharedIncoming) return;
    savePeopleToStorage(sharedIncoming.people);
    if (sharedIncoming.groupName) {
      setSelectedGroup(sharedIncoming.groupName);
    }
    handleDismissImport();
  };

  const handleImportFromFile = async (
    importedList: Person[],
    importedDocs?: PersonDocument[]
  ) => {
    const { merged, idMap } = mergePeople(people, importedList);
    savePeopleToStorage(merged);

    let docCount = 0;
    if (importedDocs && importedDocs.length > 0) {
      docCount = await importDocumentsWithMapping(importedDocs, idMap);
    }

    if (docCount > 0) {
      alert(
        `Successfully restored backup!\n• Added/updated ${importedList.length} family member${importedList.length === 1 ? '' : 's'}\n• Restored ${docCount} attached document${docCount === 1 ? '' : 's'} into your local vault`
      );
    } else {
      alert(
        `Successfully restored ${importedList.length} family member${importedList.length === 1 ? '' : 's'}.`
      );
    }
  };

  // Filter & sort list
  const processedPeople = useMemo(() => {
    let result = people;

    if (selectedGroup) {
      result = result.filter((p) => p.group === selectedGroup);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    return sortPeople(result, sortOption, currentDate);
  }, [people, selectedGroup, searchQuery, sortOption, currentDate]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Header
          totalCount={people.length}
          onAddPerson={handleOpenAdd}
          onOpenShare={() => setIsShareOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />

        {!isHydrated ? (
          // Skeleton loading during hydration
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
            <EmptyState onAddPerson={handleOpenAdd} />
          </div>
        ) : (
          <div className="mt-2">
            {/* Group Filter Tabs */}
            <GroupFilter
              groups={allGroups}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
              people={people}
            />

            <SearchAndSort
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortOption={sortOption}
              onSortChange={setSortOption}
              layoutView={layoutView}
              onLayoutViewChange={handleLayoutViewChange}
              showSearch={people.length >= 3 || searchQuery.length > 0}
            />

            <PersonList
              people={processedPeople}
              currentDate={currentDate}
              sortOption={sortOption}
              layoutView={layoutView}
              searchQuery={searchQuery}
              onEdit={handleOpenEdit}
              onDelete={setPersonToDelete}
              onOpenDocuments={setDocumentPerson}
              documentCounts={documentCounts}
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
            <strong>AgeBoard</strong> — Private, instant age tracker.
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
          existingGroups={allGroups}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={personToDelete !== null}
        person={personToDelete}
        onClose={() => setPersonToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Document Vault Modal */}
      <DocumentVaultModal
        isOpen={documentPerson !== null}
        onClose={() => setDocumentPerson(null)}
        person={documentPerson}
        currentDate={currentDate}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        people={people}
        onImportFromFile={handleImportFromFile}
      />

      {/* Import Shared Link Modal */}
      {sharedIncoming && (
        <ImportSharedModal
          isOpen={true}
          incomingPeople={sharedIncoming.people}
          groupName={sharedIncoming.groupName}
          onClose={handleDismissImport}
          onConfirmMerge={handleConfirmMerge}
          onConfirmReplace={handleConfirmReplace}
        />
      )}
    </div>
  );
}
