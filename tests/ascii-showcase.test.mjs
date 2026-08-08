import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const pagePath = new URL('../ascii-page-motion/index.html', import.meta.url);
const appPath = new URL('../ascii-page-motion/app.js', import.meta.url);
const collectionPath = new URL('../collection/index.html', import.meta.url);

assert.ok(existsSync(pagePath), 'Expected the ASCII motion showcase route to exist');
assert.ok(existsSync(appPath), 'Expected the ASCII motion showcase script to exist');

const page = readFileSync(pagePath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const collection = readFileSync(collectionPath, 'utf8');

assert.match(page, /<canvas id="ascii-field"/);
assert.match(page, /id="reassemble"/);
assert.match(page, /id="mode-switch"/);
assert.match(page, /aria-live="polite"/);
assert.match(page, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(page, /@media \(max-width: 460px\)/);
assert.match(page, /\.actions \{ flex-direction: column; \}/);
assert.match(app, /function buildSpiral/);
assert.match(app, /function renderFrame/);
assert.match(app, /reassemble\.addEventListener\('click'/);
assert.match(app, /modeSwitch\.addEventListener\('click'/);
assert.match(collection, /data-category="showcase"/);
assert.match(collection, /网站效果展示/);
assert.match(collection, /\.\.\/ascii-page-motion\//);

console.log('ASCII motion showcase checks passed');
