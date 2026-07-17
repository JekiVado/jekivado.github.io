import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const pagePath = new URL('../collection/index.html', import.meta.url);
const iconPath = new URL('../collection/favicon.svg', import.meta.url);
const readmePath = new URL('../README.md', import.meta.url);
const rootPath = new URL('../index.html', import.meta.url);

assert.ok(existsSync(pagePath), 'Expected collection/index.html to exist');

const html = readFileSync(pagePath, 'utf8');

assert.match(html, /rel="icon" href="\.\/favicon\.svg" type="image\/svg\+xml"/);
assert.ok(existsSync(iconPath), 'Expected collection/favicon.svg to exist');
const icon = readFileSync(iconPath, 'utf8');
assert.match(icon, /viewBox="0 0 64 64"/);
assert.match(icon, /#16777d/);
assert.match(icon, /#bc5a1a/);

assert.ok(existsSync(readmePath), 'Expected a root README.md');
const readme = readFileSync(readmePath, 'utf8');
assert.match(readme, /# JekiVado GitHub Pages/);
assert.match(readme, /https:\/\/jekivado\.github\.io\/collection\//);
assert.match(readme, /新增页面/);
assert.match(readme, /GitHub Pages/);
assert.match(readme, /DanceNewReports/);

assert.ok(existsSync(rootPath), 'Expected a root index.html');
const root = readFileSync(rootPath, 'utf8');
assert.match(root, /content="0; url=\.\/collection\/"/);
assert.match(root, /href="\.\/collection\/"/);

assert.match(html, /<h1>集合<\/h1>/);
assert.match(html, /data-category="prototype"/);
assert.match(html, /data-category="analysis"/);
assert.match(html, /data-category="reports"/);
assert.match(html, /--canvas:\s*#f6f6f2/);
assert.match(html, /class="card-grid"/);
assert.match(html, /box-shadow:\s*0 14px 30px/);
assert.doesNotMatch(html, /feTurbulence/);
assert.match(html, /--warm-bg:\s*#fff0e3/);
assert.match(html, /--cool-bg:\s*#e7f4f5/);
assert.match(html, /--report-bg:\s*#f0edff/);
assert.match(html, /class="category prototype-section"/);
assert.match(html, /class="category analysis-section"/);
assert.match(html, /class="category reports-section"/);
assert.match(html, /DanceNew 报告档案/);
assert.match(html, /\.\.\/DanceNewReports\//);
assert.match(html, /06 ACTIVE LINKS/);
assert.match(html, /\.card-detail[^}]*font-size:\s*14px/);
assert.match(html, /\.path[^}]*font:\s*11px\/1\.2/);
assert.match(html, /\.category\s*\{[^}]*padding:\s*20px/);
assert.match(html, /background:\s*#fff/);
assert.match(html, /main\s*\{[^}]*width:\s*min\(1440px/);
assert.match(html, /grid-template-columns:\s*repeat\(auto-fit, minmax\(240px, 1fr\)\)/);
assert.match(html, /class="card-grid prototype-grid"/);
assert.match(html, /\.prototype-grid\s+\.card\s*\{[^}]*grid-column:\s*span 2/);
assert.match(html, /UPDATED 2026\.07\.17/);

for (const route of [
  '../escape01/',
  '../ServerAnalysis/cloud.html',
  '../ServerAnalysis/hh1.html',
  '../ServerAnalysis/hh2.html',
  '../ServerAnalysis/1688.html',
  '../DanceNewReports/',
]) {
  assert.match(html, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

console.log('collection page covers every published route');
