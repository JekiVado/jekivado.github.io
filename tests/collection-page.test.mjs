import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const pagePath = new URL('../collection/index.html', import.meta.url);
const iconPath = new URL('../collection/favicon.svg', import.meta.url);
const readmePath = new URL('../README.md', import.meta.url);
const rootPath = new URL('../index.html', import.meta.url);
const yunshangPath = new URL('../yunshang-xingyuan/index.html', import.meta.url);

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
assert.match(readme, /折叠/);

assert.ok(existsSync(rootPath), 'Expected a root index.html');
const root = readFileSync(rootPath, 'utf8');
assert.match(root, /content="0; url=\.\/collection\/"/);
assert.match(root, /href="\.\/collection\/"/);
assert.ok(existsSync(yunshangPath), 'Expected the 云上星愿 playable prototype to exist');

assert.match(html, /<h1>集合<\/h1>/);
assert.match(html, /data-category="prototype"/);
assert.match(html, /data-category="analysis"/);
assert.match(html, /data-category="reports"/);
assert.equal((html.match(/<details class="category category-card\b/g) ?? []).length, 3, 'Expected three collapsible category cards');
assert.match(html, /<summary class="category-summary">/);
assert.match(html, /<span class="toggle-label">点击展开<\/span>/);
assert.match(html, /\.category-card\[open\]/);
assert.doesNotMatch(html, /<details[^>]*\sopen(?:\s|>)/, 'Category cards should be collapsed initially');
assert.match(html, /--canvas:\s*#f6f6f2/);
assert.match(html, /class="category-content"/);
assert.match(html, /class="card-grid"/);
assert.match(html, /box-shadow:\s*0 14px 30px/);
assert.doesNotMatch(html, /feTurbulence/);
assert.match(html, /--warm-bg:\s*#fff0e3/);
assert.match(html, /--cool-bg:\s*#e7f4f5/);
assert.match(html, /--report-bg:\s*#f0edff/);
assert.match(html, /class="category category-card prototype-section"/);
assert.match(html, /class="category category-card analysis-section"/);
assert.match(html, /class="category category-card reports-section"/);
assert.match(html, /DanceNew 报告档案/);
assert.match(html, /\.\.\/DanceNewReports\//);
assert.match(html, /03 COLLECTIONS · 04 LINKS/);
assert.match(html, /\.card-detail[^}]*font-size:\s*14px/);
assert.match(html, /\.path[^}]*font:\s*11px\/1\.2/);
assert.match(html, /\.category-summary\s*\{[^}]*padding:\s*18px 20px/);
assert.match(html, /background:\s*#fff/);
assert.match(html, /main\s*\{[^}]*width:\s*min\(1440px/);
assert.match(html, /grid-template-columns:\s*repeat\(auto-fit, minmax\(240px, 1fr\)\)/);
assert.match(html, /class="card-grid prototype-grid"/);
assert.match(html, /\.prototype-grid\s+\.card\s*\{[^}]*grid-column:\s*span 2/);
assert.match(html, /UPDATED 2026\.07\.23/);
assert.match(html, /云上星愿/);
assert.match(html, /02 ITEMS/);
assert.match(html, /修复天空，开启新的星域关卡/);
assert.match(html, /\.\.\/yunshang-xingyuan\/\?v=20260723-3/);

for (const route of [
  '../escape01/',
  '../yunshang-xingyuan/',
  '../ServerAnalysis/',
  '../DanceNewReports/',
]) {
  assert.match(html, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

console.log('collection page covers every published route');
