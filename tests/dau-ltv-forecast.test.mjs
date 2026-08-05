import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const pagePath = new URL('../dau-ltv-forecast/index.html', import.meta.url);
const appPath = new URL('../dau-ltv-forecast/app.js', import.meta.url);

assert.ok(existsSync(pagePath), 'Expected the DAU/LTV forecast page to exist');
assert.ok(existsSync(appPath), 'Expected the DAU/LTV forecast app script to exist');

const html = readFileSync(pagePath, 'utf8');
const app = readFileSync(appPath, 'utf8');

assert.match(html, /<title>DAU \/ LTV 预测<\/title>/);
assert.match(html, /id="dau-input"/);
assert.match(html, /id="daily-new-input"/);
assert.match(html, /id="new-growth-input"/);
assert.match(html, /id="arpu-input"/);
assert.match(html, /id="pay-rate-input"/);
assert.match(html, /id="arppu-input"/);
assert.match(html, /id="arpu-growth-input"/);
assert.match(html, /id="d1-retention-input"/);
assert.match(html, /id="d30-retention-input"/);
assert.match(html, /id="forecast-chart"/);
assert.match(html, /id="revenue-chart"/);
assert.match(html, /id="ltv-chart"/);
assert.match(html, /id="forecast-days"/);
assert.match(html, /id="calculate-button"/);
assert.match(html, /id="reset-button"/);
assert.match(html, /id="forecast-table-body"/);
assert.match(html, /data-metric="forecast-revenue"/);
assert.match(html, /每日预测明细/);
assert.match(html, /app\.js/);

assert.match(app, /function interpolateRetention/);
assert.match(app, /function buildDailyForecast/);
assert.match(app, /function renderForecast/);
assert.match(app, /function renderTable/);
assert.match(app, /dau-input/);
assert.match(app, /daily-new-input/);
assert.match(app, /forecast-chart/);
assert.match(app, /revenue-chart/);
assert.match(app, /ltv-chart/);
assert.match(app, /calculate-button/);
assert.match(app, /reset-button/);

console.log('DAU/LTV forecast page checks passed');
