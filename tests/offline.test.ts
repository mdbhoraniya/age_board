import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Offline & PWA Capability', () => {
  const publicDir = path.resolve(process.cwd(), 'public');
  const swPath = path.resolve(publicDir, 'sw.js');
  const manifestPath = path.resolve(publicDir, 'manifest.json');

  test('Service worker sw.js exists and defines caching strategy', () => {
    assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Verify key caching strategies exist
    assert.ok(swContent.includes('STATIC_CACHE'), 'Must define static cache');
    assert.ok(swContent.includes('PAGES_CACHE'), 'Must define pages cache');
    assert.ok(swContent.includes('PRECACHE_ASSETS'), 'Must define precache assets');
    assert.ok(swContent.includes('install'), 'Must handle install event');
    assert.ok(swContent.includes('activate'), 'Must handle activate event');
    assert.ok(swContent.includes('fetch'), 'Must handle fetch event');
    assert.ok(swContent.includes('navigate'), 'Must handle navigation fallback for offline');
    assert.ok(swContent.includes('/_next/static/'), 'Must cache Next.js static assets');
  });

  test('All precached static assets in sw.js exist on filesystem', () => {
    const swContent = fs.readFileSync(swPath, 'utf-8');
    const match = swContent.match(/const PRECACHE_ASSETS = \[([\s\S]*?)\];/);
    assert.ok(match, 'Must find PRECACHE_ASSETS array in sw.js');

    const assetUrls = match[1]
      .split(',')
      .map((s) => s.trim().replace(/['"]/g, ''))
      .filter((s) => s && s !== '/');

    for (const assetUrl of assetUrls) {
      const filePath = path.join(publicDir, assetUrl.replace(/^\//, ''));
      assert.ok(
        fs.existsSync(filePath),
        `Precache asset ${assetUrl} must exist at ${filePath}`
      );
    }
  });

  test('Manifest defines standalone PWA configuration', () => {
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.start_url, '/');
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  });
});
