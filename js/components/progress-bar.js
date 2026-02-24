export function renderProgressBar(current, total) {
  const bar = document.createElement('div');
  bar.className = 'progress-bar';

  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;

  bar.innerHTML = `
    <div class="progress-bar__track">
      <div class="progress-bar__fill" style="width: ${pct}%"></div>
    </div>
    <span class="progress-bar__label">${current + 1} / ${total}</span>
  `;

  return bar;
}
