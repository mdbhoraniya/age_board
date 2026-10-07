'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Person } from '@/types/person';
import {
  calculateAge,
  calculateAgeDifference,
  calculateGroupAgeStats,
  formatDateDisplay,
  getGeneration,
} from '@/lib/age';

type AgeComparisonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  currentDate: Date;
  initialPersonAId?: string;
  initialPersonBId?: string;
};

export const AgeComparisonModal: React.FC<AgeComparisonModalProps> = ({
  isOpen,
  onClose,
  people,
  currentDate,
  initialPersonAId,
  initialPersonBId,
}) => {
  const [activeTab, setActiveTab] = useState<'compare' | 'overview'>('compare');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Selected people for comparison
  const [personAId, setPersonAId] = useState<string>(() => {
    return initialPersonAId || people[0]?.id || '';
  });

  const [personBId, setPersonBId] = useState<string>(() => {
    if (initialPersonBId && initialPersonBId !== initialPersonAId) return initialPersonBId;
    return people[1]?.id || people[0]?.id || '';
  });

  // Keep state synced when modal opens or initial IDs change
  useEffect(() => {
    if (isOpen && people.length >= 2) {
      if (initialPersonAId && people.some((p) => p.id === initialPersonAId)) {
        setPersonAId(initialPersonAId);
      } else if (!people.some((p) => p.id === personAId)) {
        setPersonAId(people[0]?.id || '');
      }

      if (
        initialPersonBId &&
        initialPersonBId !== initialPersonAId &&
        people.some((p) => p.id === initialPersonBId)
      ) {
        setPersonBId(initialPersonBId);
      } else if (!people.some((p) => p.id === personBId) || personBId === personAId) {
        const other = people.find((p) => p.id !== (initialPersonAId || people[0]?.id));
        setPersonBId(other?.id || people[1]?.id || people[0]?.id || '');
      }
    }
  }, [isOpen, initialPersonAId, initialPersonBId, people]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const personA = people.find((p) => p.id === personAId);
  const personB = people.find((p) => p.id === personBId);

  // Swap people
  const handleSwap = () => {
    const temp = personAId;
    setPersonAId(personBId);
    setPersonBId(temp);
  };

  // Avatar gradient helper
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-600',
      'from-cyan-500 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Filtered group for overview stats
  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    people.forEach((p) => {
      if (p.group && p.group.trim()) groups.add(p.group.trim());
    });
    return Array.from(groups).sort();
  }, [people]);

  const overviewPeople = useMemo(() => {
    if (selectedGroup === 'all') return people;
    return people.filter((p) => p.group === selectedGroup);
  }, [people, selectedGroup]);

  const groupStats = useMemo(() => {
    return calculateGroupAgeStats(overviewPeople, currentDate);
  }, [overviewPeople, currentDate]);

  // Pairwise sorted sibling/member chain
  const sortedChain = useMemo(() => {
    return [...overviewPeople].sort((a, b) => {
      return a.dateOfBirth.localeCompare(b.dateOfBirth);
    });
  }, [overviewPeople]);

  if (!isOpen) return null;

  // Comparison details between Person A and Person B
  const comparison =
    personA && personB ? calculateAgeDifference(personA, personB, currentDate) : null;

  const ageA = personA ? calculateAge(personA.dateOfBirth, currentDate) : null;
  const ageB = personB ? calculateAge(personB.dateOfBirth, currentDate) : null;
  const genA = personA ? getGeneration(personA.dateOfBirth) : null;
  const genB = personB ? getGeneration(personB.dateOfBirth) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-xl border border-blue-200/50 dark:border-blue-900/50">
              ⚖️
            </div>
            <div>
              <h2
                id="comparison-modal-title"
                className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Age Difference & Comparison
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compare any two people side-by-side or explore family age stats
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-0 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`pb-3 px-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'compare'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              👥 Compare 2 People
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-2 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              📊 Family & Group Stats ({people.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'compare' && (
            <>
              {people.length < 2 ? (
                <div className="text-center py-10 px-4">
                  <div className="text-3xl mb-2">👥</div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Need at least 2 people to compare
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Add another family member or friend to compare their exact age differences and life milestones!
                  </p>
                </div>
              ) : (
                <>
                  {/* Selectors with Swap Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 bg-slate-50 dark:bg-slate-850/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    {/* Person A Selector */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Person 1
                      </label>
                      <select
                        value={personAId}
                        onChange={(e) => setPersonAId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white shadow-xs focus:border-blue-500 focus:outline-hidden"
                      >
                        {people.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.group ? `(${p.group})` : ''}
                          </option>
                        ))}
                      </select>
                      {personA && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Born {formatDateDisplay(personA.dateOfBirth)}
                        </p>
                      )}
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center pt-2 sm:pt-4">
                      <button
                        type="button"
                        onClick={handleSwap}
                        title="Swap people"
                        aria-label="Swap people"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-all shadow-xs hover:scale-105 active:scale-95"
                      >
                        ⇄
                      </button>
                    </div>

                    {/* Person B Selector */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Person 2
                      </label>
                      <select
                        value={personBId}
                        onChange={(e) => setPersonBId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white shadow-xs focus:border-blue-500 focus:outline-hidden"
                      >
                        {people.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.group ? `(${p.group})` : ''}
                          </option>
                        ))}
                      </select>
                      {personB && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Born {formatDateDisplay(personB.dateOfBirth)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Warning if same person selected */}
                  {personAId === personBId ? (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-center">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Please select two different people to view their age gap!
                      </p>
                    </div>
                  ) : comparison && personA && personB ? (
                    <>
                      {/* Hero Verdict Card */}
                      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 p-5 text-white shadow-lg">
                        <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
                          <span>🏆</span>
                          <span>Age Comparison Verdict</span>
                        </div>

                        {comparison.isSameDay ? (
                          <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight">
                              Born on the exact same day!
                            </h3>
                            <p className="text-sm text-blue-100 mt-1">
                              {personA.name} and {personB.name} are exactly the same age.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                              {comparison.olderPerson?.name} is older
                            </h3>
                            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 mt-2 font-bold text-base sm:text-lg">
                              <span>by</span>
                              <span>{comparison.formattedDifference}</span>
                            </div>
                            <p className="text-xs text-blue-100/90 mt-2">
                              {comparison.olderPerson?.name} was born {formatDateDisplay(comparison.olderBirthDate)} ·{' '}
                              {comparison.youngerPerson?.name} was born {formatDateDisplay(comparison.youngerBirthDate)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Stat Breakdown Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Calendar Difference */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 p-4">
                          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Calendar Gap
                          </span>
                          <span className="block text-xl font-black text-slate-900 dark:text-white mt-1">
                            {comparison.isSameDay ? '0 days' : `${comparison.years}y ${comparison.months}m ${comparison.days}d`}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Precise leap-year accuracy
                          </span>
                        </div>

                        {/* Total Days */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 p-4">
                          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Total Days Difference
                          </span>
                          <span className="block text-xl font-black text-slate-900 dark:text-white mt-1">
                            {comparison.totalDays.toLocaleString()} {comparison.totalDays === 1 ? 'day' : 'days'}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {comparison.totalWeeks.toLocaleString()} weeks, {comparison.remainingDays} days
                          </span>
                        </div>

                        {/* Age Ratio Multiplier */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 p-4">
                          <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Current Age Ratio
                          </span>
                          <span className="block text-xl font-black text-slate-900 dark:text-white mt-1">
                            {comparison.isSameDay
                              ? '1.0x'
                              : comparison.ratioMultiplier !== null
                              ? `${comparison.ratioMultiplier}x`
                              : '—'}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {comparison.isSameDay
                              ? 'Identical age'
                              : `${comparison.olderPerson?.name} is ${comparison.ratioMultiplier}x older`}
                          </span>
                        </div>
                      </div>

                      {/* Milestone Flashback Cards */}
                      {!comparison.isSameDay && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            🕰️ Life Milestone Flashbacks
                          </h4>

                          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/80 p-4 sm:p-5 space-y-3.5">
                            {/* Fact 1: Age when younger born */}
                            <div className="flex items-start gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-sm">
                                👶
                              </span>
                              <div>
                                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                                  When <strong>{comparison.youngerPerson?.name}</strong> was born on{' '}
                                  <span className="font-semibold">{formatDateDisplay(comparison.youngerBirthDate)}</span>,{' '}
                                  <strong>{comparison.olderPerson?.name}</strong> was already{' '}
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {comparison.olderAgeWhenYoungerBorn} old
                                  </span>
                                  .
                                </p>
                              </div>
                            </div>

                            {/* Fact 2: When older was younger's current age */}
                            {comparison.historicalMilestoneDate && ageB && (
                              <div className="flex items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-sm">
                                  ⏳
                                </span>
                                <div>
                                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                                    <strong>{comparison.olderPerson?.name}</strong> was{' '}
                                    <strong>{comparison.youngerPerson?.name}</strong>&apos;s current age{' '}
                                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                                      ({comparison.youngerPerson === personA ? ageA?.years : ageB?.years} years old)
                                    </span>{' '}
                                    back on{' '}
                                    <span className="font-bold text-purple-600 dark:text-purple-400">
                                      {comparison.historicalMilestoneDate}
                                    </span>
                                    .
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Side-by-Side Profile Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {/* Person A card */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${getAvatarGradient(
                                personA.name
                              )} text-sm font-bold text-white`}
                            >
                              {personA.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {personA.name}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {ageA ? `${ageA.years}y ${ageA.months}m ${ageA.days}d` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                            <span>{ageA?.totalDays.toLocaleString()} days lived</span>
                            {genA && <span className="font-medium">{genA.shortName}</span>}
                          </div>
                        </div>

                        {/* Person B card */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${getAvatarGradient(
                                personB.name
                              )} text-sm font-bold text-white`}
                            >
                              {personB.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {personB.name}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {ageB ? `${ageB.years}y ${ageB.months}m ${ageB.days}d` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                            <span>{ageB?.totalDays.toLocaleString()} days lived</span>
                            {genB && <span className="font-medium">{genB.shortName}</span>}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Group Filter Bar */}
              {availableGroups.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                    Group:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedGroup('all')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shrink-0 ${
                      selectedGroup === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    All ({people.length})
                  </button>
                  {availableGroups.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSelectedGroup(grp)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shrink-0 ${
                        selectedGroup === grp
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              )}

              {groupStats ? (
                <>
                  {/* Aggregate Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Average Age
                      </span>
                      <span className="block text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                        {groupStats.averageAgeFormatted}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Median Age
                      </span>
                      <span className="block text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
                        {groupStats.medianAgeFormatted}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Oldest
                      </span>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                        {groupStats.oldestPerson.name}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Born {formatDateDisplay(groupStats.oldestPerson.dateOfBirth)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Youngest
                      </span>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                        {groupStats.youngestPerson.name}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Born {formatDateDisplay(groupStats.youngestPerson.dateOfBirth)}
                      </span>
                    </div>
                  </div>

                  {/* Generation Span Banner */}
                  <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 p-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Total Family Generation Span
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Difference between <strong>{groupStats.oldestPerson.name}</strong> and{' '}
                        <strong>{groupStats.youngestPerson.name}</strong>:
                      </p>
                    </div>
                    <span className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-300 shrink-0">
                      {groupStats.spanFormatted}
                    </span>
                  </div>

                  {/* Sibling & Member Age Gap Chain */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">
                      🔗 Age Gap Chain (Oldest to Youngest)
                    </h4>

                    <div className="space-y-2">
                      {sortedChain.map((person, index) => {
                        const nextPerson = sortedChain[index + 1];
                        const gapToNext = nextPerson
                          ? calculateAgeDifference(person, nextPerson, currentDate)
                          : null;

                        const curAge = calculateAge(person.dateOfBirth, currentDate);

                        return (
                          <div key={person.id} className="relative">
                            {/* Member Card */}
                            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                  {index + 1}
                                </span>
                                <div className="min-w-0">
                                  <span className="block font-bold text-sm text-slate-900 dark:text-white truncate">
                                    {person.name}
                                  </span>
                                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                    Born {formatDateDisplay(person.dateOfBirth)}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {curAge.years}y {curAge.months}m {curAge.days}d
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                  {curAge.totalDays.toLocaleString()} days
                                </span>
                              </div>
                            </div>

                            {/* Gap to next member */}
                            {gapToNext && (
                              <div className="flex items-center justify-center my-1.5">
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                  <span>↓ gap:</span>
                                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                                    {gapToNext.formattedDifference}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                  Select at least 2 people to view group statistics.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
