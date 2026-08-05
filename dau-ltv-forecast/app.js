const inputIds = ['dau-input', 'growth-input', 'retention-input', 'arpu-input', 'forecast-days'];
const inputs = Object.fromEntries(inputIds.map((id) => [id, document.getElementById(id)]));
const chart = document.getElementById('forecast-chart');

const formatNumber = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });
const formatMoney = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const formatMoneyPrecise = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 });

function valueOf(id, fallback) {
  const value = Number(inputs[id].value);
  return Number.isFinite(value) ? value : fallback;
}

function buildForecast({ dau, growth, retention, arpu, days }) {
  const dailyGrowth = 1 + growth / 100;
  const dailyRetention = Math.pow(Math.max(retention, 1) / 100, 1 / 7);
  const safeGrowth = Math.max(dailyGrowth, 0.01);
  const points = [];
  let cumulativeRevenue = 0;

  for (let day = 0; day <= days; day += 1) {
    const activeUsers = Math.max(0, dau * Math.pow(safeGrowth, day));
    const dailyRevenue = activeUsers * arpu;
    cumulativeRevenue += day === 0 ? 0 : dailyRevenue;
    points.push({ day, activeUsers, dailyRevenue, cumulativeRevenue });
  }

  const ltv = arpu / Math.max(1 - dailyRetention, 0.005);
  return { points, cumulativeRevenue, ltv, dailyRetention };
}

function linePath(points, field, width, height, padding) {
  const highest = Math.max(...points.map((point) => point[field]), 1);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  return points.map((point, index) => {
    const x = padding.left + (point.day / Math.max(points.length - 1, 1)) * innerWidth;
    const y = padding.top + innerHeight - (point[field] / highest) * innerHeight;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function renderForecast() {
  const dau = Math.max(valueOf('dau-input', 1), 1);
  const growth = Math.min(Math.max(valueOf('growth-input', 0), -20), 30);
  const retention = Math.min(Math.max(valueOf('retention-input', 1), 1), 99);
  const arpu = Math.max(valueOf('arpu-input', 0), 0);
  const days = Number(inputs['forecast-days'].value);
  const forecast = buildForecast({ dau, growth, retention, arpu, days });
  const finalPoint = forecast.points.at(-1);

  document.getElementById('end-dau').textContent = formatNumber.format(finalPoint.activeUsers);
  document.getElementById('end-dau-note').textContent = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% 日增长 · DAY ${days}`;
  document.getElementById('forecast-revenue').textContent = formatMoney.format(forecast.cumulativeRevenue);
  document.getElementById('forecast-revenue-note').textContent = `${days} 天累计 · 当前 ARPU ${formatMoneyPrecise.format(arpu)}`;
  document.getElementById('forecast-ltv').textContent = formatMoneyPrecise.format(forecast.ltv);
  document.getElementById('forecast-ltv-note').textContent = `日留存约 ${(forecast.dailyRetention * 100).toFixed(1)}%`;

  const width = 760;
  const height = 300;
  const padding = { left: 20, right: 22, top: 24, bottom: 38 };
  document.getElementById('dau-line').setAttribute('d', linePath(forecast.points, 'activeUsers', width, height, padding));
  document.getElementById('revenue-line').setAttribute('d', linePath(forecast.points, 'cumulativeRevenue', width, height, padding));
  const endX = width - padding.right;
  const maxDau = Math.max(...forecast.points.map((point) => point.activeUsers), 1);
  const endY = padding.top + (height - padding.top - padding.bottom) - (finalPoint.activeUsers / maxDau) * (height - padding.top - padding.bottom);
  document.getElementById('end-dot').setAttribute('cx', endX.toFixed(2));
  document.getElementById('end-dot').setAttribute('cy', endY.toFixed(2));
  document.getElementById('chart-end-label').textContent = `DAY ${days}`;
  chart.setAttribute('aria-label', `${days} 天 DAU 与累计收入预测曲线，期末 DAU ${formatNumber.format(finalPoint.activeUsers)}`);
}

for (const id of inputIds) {
  const eventName = id === 'forecast-days' ? 'change' : 'input';
  inputs[id].addEventListener(eventName, renderForecast);
}

renderForecast();
