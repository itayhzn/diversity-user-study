export function renderMetricControl(metric, currentValue, onSelect) {
  const container = document.createElement('div');
  container.className = 'metric-control';

  const question = document.createElement('div');
  question.className = 'metric-control__question';
  question.textContent = metric.question;
  container.appendChild(question);

  const buttons = document.createElement('div');
  buttons.className = 'metric-control__buttons';

  const options = [
    { label: 'Set A', value: -1, cls: 'metric-control__btn--left' },
    { label: 'Tie', value: 0, cls: 'metric-control__btn--tie' },
    { label: 'Set B', value: 1, cls: 'metric-control__btn--right' },
  ];

  for (const opt of options) {
    const btn = document.createElement('button');
    btn.className = `metric-control__btn ${opt.cls}`;
    if (currentValue === opt.value) btn.classList.add('selected');
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      buttons.querySelectorAll('.metric-control__btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      onSelect(metric.id, opt.value);
    });
    buttons.appendChild(btn);
  }

  container.appendChild(buttons);
  return container;
}
