'use client';

import React, { useState, useEffect } from 'react';
import { BgThemeId, BG_THEMES } from '@/types/theme';

type ThemeSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: BgThemeId;
  customBgColor: string;
  onSelectTheme: (themeId: BgThemeId) => void;
  onSetCustomBgColor: (color: string) => void;
};

const SUGGESTED_CUSTOM_COLORS = [
  { name: 'Pitch Black', hex: '#000000' },
  { name: 'Dark Slate', hex: '#0f172a' },
  { name: 'Deep Indigo', hex: '#1e1b4b' },
  { name: 'Dark Teal', hex: '#042f2e' },
  { name: 'Dark Plum', hex: '#3b0764' },
  { name: 'Dark Bronze', hex: '#291809' },
  { name: 'Charcoal', hex: '#18181b' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Light Cream', hex: '#fefce8' },
  { name: 'Ice Blue', hex: '#f0fdfa' },
];

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  customBgColor,
  onSelectTheme,
  onSetCustomBgColor,
}) => {
  const [tempCustomColor, setTempCustomColor] = useState(customBgColor || '#0f172a');

  useEffect(() => {
    if (customBgColor) setTempCustomColor(customBgColor);
  }, [customBgColor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCustomColorSubmit = (hex: string) => {
    setTempCustomColor(hex);
    onSetCustomBgColor(hex);
    onSelectTheme('custom');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 text-xl border border-purple-200/50 dark:border-purple-900/50">
              🎨
            </div>
            <div>
              <h2
                id="theme-modal-title"
                className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
              >
                App Background Color
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose a designer palette or select your own custom color
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Preset Palettes Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Preset Palettes
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Tap to apply immediately
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {BG_THEMES.map((theme) => {
                const isSelected = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectTheme(theme.id)}
                    className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Swatch circle */}
                    <div
                      className="h-10 w-10 rounded-full shadow-inner border border-slate-300 dark:border-slate-700 mb-2 flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ background: theme.previewBg }}
                    >
                      {isSelected && (
                        <span className="text-white drop-shadow-md text-xs font-black">✓</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs">{theme.icon}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[90px]">
                        {theme.name}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {theme.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Picker Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Custom Background Color
              </span>
              {currentTheme === 'custom' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                  Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850">
              {/* Native Color Input with styled wrapper */}
              <label className="relative flex items-center justify-center cursor-pointer">
                <input
                  type="color"
                  value={tempCustomColor}
                  onChange={(e) => handleCustomColorSubmit(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <div
                  className="h-11 w-11 rounded-xl shadow-xs border-2 border-white dark:border-slate-700 transition-transform hover:scale-105"
                  style={{ backgroundColor: tempCustomColor }}
                />
              </label>

              <div className="flex-1">
                <input
                  type="text"
                  value={tempCustomColor}
                  onChange={(e) => setTempCustomColor(e.target.value)}
                  placeholder="#0f172a"
                  className="w-full font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white uppercase focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Click swatch to open color picker, or type any HEX color code
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCustomColorSubmit(tempCustomColor)}
                className="min-h-[38px] px-3.5 rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all shrink-0"
              >
                Apply
              </button>
            </div>

            {/* Quick color suggestions */}
            <div className="mt-3">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                Quick Picks:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SUGGESTED_CUSTOM_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleCustomColorSubmit(c.hex)}
                    title={c.name}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-slate-300 dark:border-slate-600"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTheme('default')}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Reset to Default
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 rounded-xl bg-slate-900 dark:bg-white text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
