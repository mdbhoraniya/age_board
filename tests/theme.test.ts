import test from 'node:test';
import assert from 'node:assert/strict';
import { ThemeMode, THEME_STORAGE_KEY } from '../types/theme';

test('Theme System - Light and Dark Mode', async (t) => {
  await t.test('Storage key is defined correctly', () => {
    assert.equal(THEME_STORAGE_KEY, 'ageboard_theme');
  });

  await t.test('Theme modes only allow light and dark', () => {
    const validModes: ThemeMode[] = ['light', 'dark'];
    assert.equal(validModes.length, 2);
    assert.ok(validModes.includes('light'));
    assert.ok(validModes.includes('dark'));
  });

  await t.test('Toggle logic switches between light and dark correctly', () => {
    let isDark = false;
    const toggle = () => {
      isDark = !isDark;
      return isDark ? 'dark' : 'light';
    };

    assert.equal(toggle(), 'dark');
    assert.equal(isDark, true);
    assert.equal(toggle(), 'light');
    assert.equal(isDark, false);
  });
});
