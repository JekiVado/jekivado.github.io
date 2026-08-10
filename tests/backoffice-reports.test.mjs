import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = resolve(repoRoot, 'BackofficeReports', 'index.html');
const archiveRoot = resolve(repoRoot, 'DanceNewReports', 'reports');
const analysisPath = resolve(archiveRoot, '2026-08-10-1688-backoffice-analysis.html');
const dailyReportPath = resolve(archiveRoot, '2026-08-10-1688-data-daily.html');

assert.ok(existsSync(reportPath), 'Expected an independent back-office report entry');
const html = readFileSync(reportPath, 'utf8');
assert.match(html, /url=\.\.\/DanceNewReports\/reports\/2026-08-10-1688-backoffice-analysis\.html/);
assert.ok(existsSync(analysisPath), 'Expected the 1688 back-office analysis to be archived in the project report collection');
const analysis = readFileSync(analysisPath, 'utf8');
assert.match(analysis, /<title>1688 业务后台架构与运营支持分析报告<\/title>/);
assert.match(analysis, /15 个一级模块/);
assert.match(analysis, /href="\.\/2026-08-10-1688-data-daily\.html"/);

assert.ok(existsSync(dailyReportPath), 'Expected the 8月10号 1688 data daily report to be archived in the project collection');
const dailyReport = readFileSync(dailyReportPath, 'utf8');
assert.match(dailyReport, /<title>8月10号数据日报-汇总8月7日至8月9日数据<\/title>/);
assert.match(dailyReport, /8月10号数据日报/);

console.log('1688 reports are archived in the shared DanceNewReports collection.');
