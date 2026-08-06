const DEFAULTS = {
  days: 60, dau: 30000, dailyNew: 2000, newGrowth: 0, arpu: 5.5, payRate: 3,
  arpuGrowth: 0, d1: 35, d2: 28, d3: 24, d7: 15, d14: 10, d30: 7,
};

const START_DATE = new Date(2026, 7, 5);
const nf = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });
const df = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' });
const tooltip = document.getElementById('chart-tooltip');
const svgNs = 'http://www.w3.org/2000/svg';

const inputIds = {
  days: 'forecast-days', dau: 'dau-input', dailyNew: 'daily-new-input', newGrowth: 'new-growth-input',
  arpu: 'arpu-input', payRate: 'pay-rate-input', arpuGrowth: 'arpu-growth-input',
  d1: 'd1-retention-input', d2: 'd2-retention-input', d3: 'd3-retention-input',
  d7: 'd7-retention-input', d14: 'd14-retention-input', d30: 'd30-retention-input',
};

function money(value, digits = 0) {
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function numberValue(id) { return Number(document.getElementById(id).value); }

function readModel() {
  const model = Object.fromEntries(Object.entries(inputIds).map(([key, id]) => [key, numberValue(id)]));
  model.days = Math.round(model.days);
  return model;
}

function updateArppu() {
  const arpu = numberValue('arpu-input');
  const rate = numberValue('pay-rate-input');
  document.getElementById('arppu-input').value = rate > 0 ? (arpu / (rate / 100)).toFixed(4) : '—';
}

function interpolateRetention(day, model) {
  const anchors = [[0, 1], [1, model.d1 / 100], [2, model.d2 / 100], [3, model.d3 / 100], [7, model.d7 / 100], [14, model.d14 / 100], [30, model.d30 / 100]];
  if (day <= 0) return 1;
  for (let index = 1; index < anchors.length; index += 1) {
    const [rightDay, rightValue] = anchors[index];
    if (day <= rightDay) {
      const [leftDay, leftValue] = anchors[index - 1];
      const progress = (day - leftDay) / (rightDay - leftDay);
      return leftValue + (rightValue - leftValue) * progress;
    }
  }
  return Math.max(0, (model.d30 / 100) * Math.pow(0.992, day - 30));
}

function buildDailyForecast(model) {
  const rows = [];
  let ltv = 0;
  for (let day = 0; day <= model.days; day += 1) {
    const date = new Date(START_DATE);
    date.setDate(START_DATE.getDate() + day);
    const arpu = model.arpu * Math.pow(1 + model.arpuGrowth / 100, day);
    const currentContribution = model.dau * interpolateRetention(day, model);
    const dailyNew = day === 0 ? 0 : model.dailyNew * Math.pow(1 + model.newGrowth / 100, day - 1);
    let newContribution = 0;
    for (let cohortDay = 1; cohortDay <= day; cohortDay += 1) {
      const cohortSize = model.dailyNew * Math.pow(1 + model.newGrowth / 100, cohortDay - 1);
      newContribution += cohortSize * interpolateRetention(day - cohortDay, model);
    }
    const dau = currentContribution + newContribution;
    const payingUsers = Math.round(dau * model.payRate / 100);
    const arppu = model.payRate > 0 ? arpu / (model.payRate / 100) : 0;
    const revenue = payingUsers * arppu;
    ltv += interpolateRetention(day, model) * arpu;
    rows.push({ day, date, dailyNew, dau, currentContribution, newContribution, payingUsers, arpu, arppu, revenue, ltv });
  }
  return rows;
}

function chartFrame(svg, maxValue, xLabels, yLabelFormatter = money) {
  const width = 1000; const height = Number(svg.getAttribute('data-height')) || 210;
  const pad = { top: 12, right: 12, bottom: 31, left: 49 };
  const innerWidth = width - pad.left - pad.right; const innerHeight = height - pad.top - pad.bottom;
  const yTicks = 5;
  let markup = '';
  for (let tick = 0; tick <= yTicks; tick += 1) {
    const y = pad.top + innerHeight - innerHeight * tick / yTicks;
    const value = maxValue * tick / yTicks;
    markup += `<line class="chart-grid" x1="${pad.left}" x2="${width - pad.right}" y1="${y}" y2="${y}"/><text class="chart-axis-label" x="${pad.left - 7}" y="${y + 4}" text-anchor="end">${yLabelFormatter(value)}</text>`;
  }
  const labelCount = Math.min(12, xLabels.length);
  for (let step = 0; step < labelCount; step += 1) {
    const index = Math.round(step * (xLabels.length - 1) / Math.max(1, labelCount - 1));
    const x = pad.left + innerWidth * index / Math.max(1, xLabels.length - 1);
    markup += `<line class="chart-grid" x1="${x}" x2="${x}" y1="${pad.top}" y2="${pad.top + innerHeight}"/><text class="chart-axis-label" x="${x}" y="${height - 7}" text-anchor="middle">${xLabels[index]}</text>`;
  }
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('data-height', height);
  return { width, height, pad, innerWidth, innerHeight, markup };
}

function pointPath(values, frame) {
  return values.map((value, index) => {
    const x = frame.pad.left + frame.innerWidth * index / Math.max(1, values.length - 1);
    const y = frame.pad.top + frame.innerHeight * (1 - value / frame.maxValue);
    return `${index ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function svgElement(name, attributes) {
  const element = document.createElementNS(svgNs, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function tooltipIndex(event, svg, frame, itemCount) {
  const bounds = svg.getBoundingClientRect();
  const svgX = (event.clientX - bounds.left) / Math.max(bounds.width, 1) * frame.width;
  const progress = Math.min(1, Math.max(0, (svgX - frame.pad.left) / frame.innerWidth));
  return Math.round(progress * Math.max(0, itemCount - 1));
}

function showTooltip(event, title, rows) {
  tooltip.innerHTML = `<span class="tooltip-title">${title}</span>${rows.map((row) => `<span class="tooltip-row"><span><i class="tooltip-dot" style="background:${row.color}"></i>${row.label}</span><b>${row.value}</b></span>`).join('')}`;
  tooltip.hidden = false;
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  tooltip.style.left = `${Math.min(event.clientX, window.innerWidth - tooltipWidth - 18)}px`;
  tooltip.style.top = `${Math.min(event.clientY, window.innerHeight - tooltipHeight - 18)}px`;
}

function attachLineTooltip(svg, datasets, labels, frame, valueFormatter = money) {
  const guide = svgElement('line', { class: 'chart-hover-line', y1: frame.pad.top, y2: frame.pad.top + frame.innerHeight, visibility: 'hidden' });
  const hitArea = svgElement('rect', { class: 'chart-hit-area', x: frame.pad.left, y: frame.pad.top, width: frame.innerWidth, height: frame.innerHeight });
  svg.append(guide, hitArea);
  svg.onpointermove = (event) => {
    const index = tooltipIndex(event, svg, frame, labels.length);
    const x = frame.pad.left + frame.innerWidth * index / Math.max(1, labels.length - 1);
    guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('visibility', 'visible');
    showTooltip(event, labels[index], datasets.map((set) => ({ label: set.label, value: valueFormatter(set.values[index]), color: set.color })));
  };
  svg.onpointerleave = () => { guide.setAttribute('visibility', 'hidden'); tooltip.hidden = true; };
}

function attachBarTooltip(svg, values, labels, frame) {
  const guide = svgElement('line', { class: 'chart-hover-line', y1: frame.pad.top, y2: frame.pad.top + frame.innerHeight, visibility: 'hidden' });
  const hitArea = svgElement('rect', { class: 'chart-hit-area', x: frame.pad.left, y: frame.pad.top, width: frame.innerWidth, height: frame.innerHeight });
  svg.append(guide, hitArea);
  svg.onpointermove = (event) => {
    const index = tooltipIndex(event, svg, frame, labels.length);
    const x = frame.pad.left + frame.innerWidth * index / Math.max(1, labels.length - 1);
    guide.setAttribute('x1', x); guide.setAttribute('x2', x); guide.setAttribute('visibility', 'visible');
    showTooltip(event, labels[index], [{ label: '收入', value: money(values[index]), color: '#d1a263' }]);
  };
  svg.onpointerleave = () => { guide.setAttribute('visibility', 'hidden'); tooltip.hidden = true; };
}

function renderLineChart(svg, datasets, labels, options = {}) {
  const maxData = Math.max(...datasets.flatMap((set) => set.values), 1);
  const maxValue = maxData * 1.08;
  const frame = chartFrame(svg, maxValue, labels, options.yLabelFormatter || money);
  frame.maxValue = maxValue;
  const baseline = frame.pad.top + frame.innerHeight;
  let markup = frame.markup;
  datasets.forEach((set, index) => {
    const path = pointPath(set.values, frame);
    if (set.fill) markup += `<path d="${path} L ${frame.pad.left + frame.innerWidth} ${baseline} L ${frame.pad.left} ${baseline} Z" fill="${set.fill}"/>`;
    markup += `<path d="${path}" fill="none" stroke="${set.color}" stroke-width="${set.width || 2.4}" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (index > 0 || datasets.length === 1) {
      set.values.forEach((value, pointIndex) => {
        const x = frame.pad.left + frame.innerWidth * pointIndex / Math.max(1, set.values.length - 1);
        const y = frame.pad.top + frame.innerHeight * (1 - value / maxValue);
        markup += `<circle class="chart-dot" cx="${x}" cy="${y}" r="2.25" stroke="${set.color}"/>`;
      });
    }
  });
  svg.innerHTML = markup;
  attachLineTooltip(svg, datasets, labels, frame, options.valueFormatter || money);
}

function renderBarChart(svg, values, labels) {
  const maxValue = Math.max(...values, 1) * 1.08;
  const frame = chartFrame(svg, maxValue, labels, money); frame.maxValue = maxValue;
  const slot = frame.innerWidth / values.length; const barWidth = Math.max(2, slot * .65);
  let markup = frame.markup;
  values.forEach((value, index) => {
    const x = frame.pad.left + index * slot + (slot - barWidth) / 2;
    const height = frame.innerHeight * value / maxValue;
    markup += `<rect x="${x}" y="${frame.pad.top + frame.innerHeight - height}" width="${barWidth}" height="${height}" fill="#d1a263"/>`;
  });
  svg.innerHTML = markup;
  attachBarTooltip(svg, values, labels, frame);
}

function renderTable(rows) {
  document.getElementById('forecast-table-body').innerHTML = rows.map((row) => `<tr><td>${df.format(row.date)}${row.day === 0 ? ' · D0起点' : ''}</td><td>${nf.format(row.dailyNew)}</td><td>${nf.format(row.dau)}</td><td>${nf.format(row.payingUsers)}</td><td>${money(row.payingUsers / Math.max(row.dau, 1) * 100, 1)}%</td><td>${money(row.arpu, 4)}</td><td>${money(row.arppu, 4)}</td><td>${nf.format(row.revenue)}</td></tr>`).join('');
}

function metric(id, value) { document.getElementById(id).textContent = value; }

function renderForecast() {
  const model = readModel();
  const validation = document.getElementById('validation-message');
  const numbers = Object.values(model);
  if (numbers.some((value) => !Number.isFinite(value)) || model.days < 1 || model.dau < 0 || model.dailyNew < 0 || model.arpu < 0 || model.payRate <= 0 || model.d1 < 0 || model.d2 < 0 || model.d3 < 0 || model.d7 < 0 || model.d14 < 0 || model.d30 < 0) {
    validation.textContent = '假设检查：请填写有效的非负数值，付费率必须大于 0。'; validation.classList.add('invalid'); return;
  }
  validation.textContent = '假设检查：输入有效。'; validation.classList.remove('invalid');
  updateArppu();
  const rows = buildDailyForecast(model); const last = rows.at(-1);
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const averageDau = rows.reduce((sum, row) => sum + row.dau, 0) / rows.length;
  const peakDau = Math.max(...rows.slice(1).map((row) => row.dau));
  const newUsers = rows.reduce((sum, row) => sum + row.dailyNew, 0);
  const ltv30 = rows[Math.min(30, rows.length - 1)].ltv;
  const averageArppu = rows.reduce((sum, row) => sum + row.arppu, 0) / rows.length;
  metric('forecast-revenue-value', nf.format(revenue)); metric('end-dau-value', nf.format(last.dau)); metric('avg-dau-value', nf.format(averageDau)); metric('peak-dau-value', nf.format(peakDau)); metric('new-users-value', nf.format(newUsers)); metric('pay-rate-value', `${money(model.payRate, 1)}%`); metric('ltv30-value', money(ltv30, 2)); metric('arppu-avg-value', money(averageArppu, 2));
  const dateLabels = rows.map((row) => df.format(row.date));
  document.getElementById('forecast-range').textContent = `${dateLabels[0]} - ${dateLabels.at(-1)}`;
  document.getElementById('ltv-range').textContent = `D0-D${model.days}`;
  renderLineChart(document.getElementById('forecast-chart'), [
    { label: '总 DAU', values: rows.map((row) => row.dau), color: '#6259ee', fill: 'rgba(98, 89, 238, .12)', width: 2.7 },
    { label: '新增留存贡献', values: rows.map((row) => row.newContribution), color: '#219653' },
    { label: '当前 DAU 延续', values: rows.map((row) => row.currentContribution), color: '#167d7a' },
  ], dateLabels);
  renderBarChart(document.getElementById('revenue-chart'), rows.map((row) => row.revenue), dateLabels);
  renderLineChart(document.getElementById('ltv-chart'), [{ label: '累计 LTV', values: rows.map((row) => row.ltv), color: '#be7b19', fill: 'rgba(190, 123, 25, .12)' }], rows.map((row) => `D${row.day}`), { yLabelFormatter: (value) => money(value, 0), valueFormatter: (value) => money(value, 2) });
  renderTable(rows);
}

document.getElementById('forecast-form').addEventListener('submit', (event) => { event.preventDefault(); renderForecast(); });
document.getElementById('calculate-button').addEventListener('click', renderForecast);
document.getElementById('reset-button').addEventListener('click', () => { Object.entries(DEFAULTS).forEach(([key, value]) => { document.getElementById(inputIds[key]).value = value; }); renderForecast(); });
['arpu-input', 'pay-rate-input'].forEach((id) => document.getElementById(id).addEventListener('input', updateArppu));

renderForecast();
