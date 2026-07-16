import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const pagePath = new URL('../collection/index.html', import.meta.url);

assert.ok(existsSync(pagePath), 'Expected collection/index.html to exist');

const html = readFileSync(pagePath, 'utf8');

assert.match(html, /个人集合/);
assert.match(html, /data-category="prototype"/);
assert.match(html, /data-category="analysis"/);

for (const route of [
  '../escape01/',
  '../ServerAnalysis/cloud.html',
  '../ServerAnalysis/hh1.html',
  '../ServerAnalysis/hh2.html',
  '../ServerAnalysis/1688.html',
]) {
  assert.match(html, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

console.log('collection page covers every published route');
