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
assert.match(html, /class="assumption-group activity-group"/);
assert.match(html, /class="assumption-group payment-group"/);
assert.match(html, /class="assumption-group retention-group"/);
assert.match(html, /<h3>活跃<\/h3>/);
assert.match(html, /<h3>付费<\/h3>/);
assert.match(html, /<h3>留存<\/h3>/);
assert.match(html, /class="field-label">ARPPU <small>自动计算<\/small><\/span>/);
assert.match(html, /id="arpu-growth-input"/);
assert.match(html, /id="d1-retention-input"/);
assert.match(html, /id="d30-retention-input"/);
assert.match(html, /id="forecast-chart"/);
assert.match(html, /id="revenue-chart"/);
assert.match(html, /id="ltv-chart"/);
assert.match(html, /id="chart-tooltip"/);
assert.match(html, /class="chart-grid-layout"/);
assert.match(html, /\.chart-grid-layout\s*\{\s*display:grid;\s*grid-template-columns:1fr;\s*gap:14px;/);
assert.match(html, /class="chart-card dau-card"/);
assert.match(html, /class="chart-card revenue-card"/);
assert.match(html, /class="chart-card ltv-card"/);
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
assert.match(app, /function attachLineTooltip/);
assert.match(app, /function attachBarTooltip/);
assert.match(app, /function barTooltipIndex/);
assert.match(app, /function pointerChartX/);
assert.match(app, /const x = pointerChartX\(event, svg, frame\);/);
assert.doesNotMatch(app, /function barCenterX/);
assert.match(app, /pointermove/);
assert.match(app, /chart-tooltip/);
assert.match(app, /dau-input/);
assert.match(app, /daily-new-input/);
assert.match(app, /forecast-chart/);
assert.match(app, /revenue-chart/);
assert.match(app, /ltv-chart/);
assert.match(app, /calculate-button/);
assert.match(app, /reset-button/);

console.log('DAU/LTV forecast page checks passed');
