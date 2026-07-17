import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const pagePath = new URL('../collection/index.html', import.meta.url);

assert.ok(existsSync(pagePath), 'Expected collection/index.html to exist');

const html = readFileSync(pagePath, 'utf8');

assert.match(html, /<h1>集合<\/h1>/);
assert.match(html, /data-category="prototype"/);
assert.match(html, /data-category="analysis"/);
assert.match(html, /--canvas:\s*#f6f6f2/);
assert.match(html, /class="card-grid"/);
assert.match(html, /box-shadow:\s*0 14px 30px/);
assert.doesNotMatch(html, /feTurbulence/);
assert.match(html, /--warm-bg:\s*#fff0e3/);
assert.match(html, /--cool-bg:\s*#e7f4f5/);
assert.match(html, /class="category prototype-section"/);
assert.match(html, /class="category analysis-section"/);
assert.match(html, /\.card-detail[^}]*font-size:\s*14px/);
assert.match(html, /\.path[^}]*font:\s*11px\/1\.2/);
assert.match(html, /\.category\s*\{[^}]*padding:\s*20px/);
assert.match(html, /background:\s*#fff/);
assert.match(html, /main\s*\{[^}]*width:\s*min\(1440px/);
assert.match(html, /grid-template-columns:\s*repeat\(auto-fit, minmax\(240px, 1fr\)\)/);
assert.match(html, /class="card-grid prototype-grid"/);
assert.match(html, /\.prototype-grid\s+\.card\s*\{[^}]*grid-column:\s*span 2/);

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
