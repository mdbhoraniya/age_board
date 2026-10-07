import test from 'node:test';
import assert from 'node:assert/strict';
import { BG_THEMES, BgThemeId } from '../types/theme';

test('Theme System - Presets and Validation', async (t) => {
  await t.test('BG_THEMES includes default theme and required presets', () => {
    assert.ok(BG_THEMES.length >= 8, 'Should have at least 8 preset themes');
    const defaultTheme = BG_THEMES.find((theme) => theme.id === 'default');
    assert.ok(defaultTheme, 'Default slate theme must exist');
    assert.equal(defaultTheme?.name, 'Slate Gray');
  });

  await t.test('All presets have unique IDs, non-empty names, icons, and preview gradients', () => {
    const ids = new Set<string>();
    for (const theme of BG_THEMES) {
      assert.ok(!ids.has(theme.id), `Theme ID '${theme.id}' must be unique`);
      ids.add(theme.id);
      assert.ok(theme.name.length > 0, `Theme '${theme.id}' must have a name`);
      assert.ok(theme.icon.length > 0, `Theme '${theme.id}' must have an icon`);
      assert.ok(theme.previewBg.length > 0, `Theme '${theme.id}' must have a previewBg`);
      assert.ok(theme.lightClass.length > 0, `Theme '${theme.id}' must have lightClass`);
      assert.ok(theme.darkClass.length > 0, `Theme '${theme.id}' must have darkClass`);
    }
  });

  await t.test('Popular high contrast themes like OLED and Midnight are defined', () => {
    const oled = BG_THEMES.find((t) => t.id === 'oled');
    const midnight = BG_THEMES.find((t) => t.id === 'midnight');
    assert.ok(oled, 'OLED pure black theme exists');
    assert.ok(midnight, 'Midnight navy theme exists');
    assert.match(oled?.darkClass || '', /black/);
  });
});
