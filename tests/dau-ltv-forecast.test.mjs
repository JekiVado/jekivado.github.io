import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const pagePath = new URL('../dau-ltv-forecast/index.html', import.meta.url);
const appPath = new URL('../dau-ltv-forecast/app.js', import.meta.url);

assert.ok(existsSync(pagePath), 'Expected the DAU/LTV forecast page to exist');
assert.ok(existsSync(appPath), 'Expected the DAU/LTV forecast app script to exist');

const html = readFileSync(pagePath, 'utf8');
const app = readFileSync(appPath, 'utf8');

assert.match(html, /<title>DAU &amp; LTV 预测仪/);
assert.match(html, /id="dau-input"/);
assert.match(html, /id="growth-input"/);
assert.match(html, /id="retention-input"/);
assert.match(html, /id="arpu-input"/);
assert.match(html, /id="forecast-chart"/);
assert.match(html, /id="forecast-days"/);
assert.match(html, /data-metric="ltv"/);
assert.match(html, /累计收入（归一化）/);
assert.match(html, /app\.js/);

assert.match(app, /function buildForecast/);
assert.match(app, /function renderForecast/);
assert.match(app, /dau-input/);
assert.match(app, /forecast-chart/);
assert.match(app, /cumulativeRevenue/);
assert.match(app, /'input'/);
assert.match(app, /addEventListener\(eventName, renderForecast\)/);

console.log('DAU/LTV forecast page checks passed');
