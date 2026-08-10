import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = resolve(repoRoot, 'BackofficeReports', 'index.html');
const dailyReportPath = resolve(repoRoot, 'BackofficeReports', '2026-08-10-data-daily.html');
const collectionPath = resolve(repoRoot, 'collection', 'index.html');

assert.ok(existsSync(reportPath), 'Expected an independent back-office report entry');
const html = readFileSync(reportPath, 'utf8');
assert.match(html, /^<!doctype html>/i);
assert.match(html, /<title>1688 业务后台架构与运营支持分析报告<\/title>/);
assert.match(html, /15 个一级模块/);
assert.match(html, /风险与提示清单/);
assert.doesNotMatch(html, /DANCENEW \/ PROJECT 1688/);
assert.match(html, /href="\.\/2026-08-10-data-daily\.html"/);

assert.ok(existsSync(dailyReportPath), 'Expected the 8月10号 1688 data daily report to be archived with the project');
const dailyReport = readFileSync(dailyReportPath, 'utf8');
assert.match(dailyReport, /<title>8月10号数据日报-汇总8月7日至8月9日数据<\/title>/);
assert.match(dailyReport, /8月10号数据日报/);

const collection = readFileSync(collectionPath, 'utf8');
assert.match(collection, /1688 业务后台/);
assert.match(collection, /含业务后台分析与 8 月 10 日数据日报/);

console.log('BackofficeReports entry is independent from the DanceNew game archive.');
