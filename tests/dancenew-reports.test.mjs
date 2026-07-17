Exit code: 0
Wall time: 0.1 seconds
Output:
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const archiveRoot = resolve(repoRoot, 'DanceNewReports');
const indexPath = resolve(archiveRoot, 'index.html');

assert.ok(existsSync(indexPath), 'Expected DanceNewReports/index.html to exist');

const html = readFileSync(indexPath, 'utf8');
assert.match(html, /<title>DanceNew 报告档案<\/title>/);
assert.match(html, /DanceNew 报告档案/);
assert.match(html, /\.codex/);
assert.match(html, /\.workbuddy\/reports/);
assert.match(html, /class="archive-list"/);
assert.match(html, /class="tech-shell"/, 'Expected the archive to use the modern technology layout shell');
assert.match(html, /class="report-card"/, 'Expected the archive entries to use readable report cards');
assert.doesNotMatch(html, /data-filter=/, 'Expected a static archive list without filter controls');
assert.doesNotMatch(html, /<script\b/i, 'Expected the archive page to work without JavaScript');

const links = [...html.matchAll(/<a\s+class="report-link"\s+data-date="([^"]+)"\s+href="([^"]+)"/g)];
assert.equal(links.length, 9, 'Expected exactly nine report links');

const dates = links.map((match) => Date.parse(match[1]));
assert.ok(dates.every(Number.isFinite), 'Expected every report data-date to be parseable');
assert.deepEqual(dates, [...dates].sort((a, b) => b - a), 'Expected reports in reverse chronological order');

for (const [, , href] of links) {
  assert.ok(!href.includes('..'), `Expected archive-local report link, received ${href}`);
  const destination = resolve(archiveRoot, href.replace(/^\.\//, ''));
  assert.ok(existsSync(destination), `Missing report destination: ${href}`);
  assert.match(readFileSync(destination, 'utf8'), /<(?:!doctype\s+html|html)\b/i, `Expected HTML entry point: ${href}`);
}

const evidenceFiles = [
  '项目分析报告结构.md',
  '首测readiness快评.md',
  '启动热更登录进服最小闭环分析.md',
  '模块架构全景图.md',
  '功能模块完成度评估.md',
  '资源与配置一致性扫描.md',
  '首测风险台账.md',
  '工程质量与研发流程评估.md',
  '现阶段开发进度与客观评价.md',
];

for (const filename of evidenceFiles) {
  assert.ok(existsSync(resolve(archiveRoot, 'reports', filename)), `Missing linked evidence file: ${filename}`);
}

console.log(`DanceNewReports archive checks passed (${links.length} reports, ${evidenceFiles.length} linked evidence files).`);
