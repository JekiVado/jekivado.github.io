import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = resolve(repoRoot, 'BackofficeReports', 'index.html');

assert.ok(existsSync(reportPath), 'Expected an independent back-office report entry');
const html = readFileSync(reportPath, 'utf8');
assert.match(html, /^<!doctype html>/i);
assert.match(html, /<title>1688 业务后台架构与运营支持分析报告<\/title>/);
assert.match(html, /15 个一级模块/);
assert.match(html, /风险与提示清单/);
assert.doesNotMatch(html, /DANCENEW \/ PROJECT 1688/);

console.log('BackofficeReports entry is independent from the DanceNew game archive.');
