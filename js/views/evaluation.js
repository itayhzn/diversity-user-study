import state from '../state.js';
import { renderProgressBar } from '../components/progress-bar.js';
import { renderImageGrid } from '../components/image-grid.js';
import { renderMetricControl } from '../components/metric-control.js';

function getImagePaths(expId, modelName, promptId, count) {
  const base = state.config.images_base_path;
  const paths = [];
  for (let j = 0; j < count; j++) {
    paths.push(`${base}/experiment_${expId}/${modelName}/${promptId}/img_${j}.png`);
  }
  return paths;
}

export function renderEvaluation(promptIdx) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const index = promptIdx;
  state.currentPromptIndex = index;

  const totalPrompts = state.promptOrder.length;
  const entry = state.promptOrder[index];
  const { expId, promptId } = entry;
  const stateKey = `${expId}__${promptId}`;

  const exp = state.config.experiments.find(e => e.id === expId);
  const prompt = exp.prompts.find(p => p.id === promptId);
  const models = exp.models;
  const metrics = state.config.metrics;

  // Track time spent on this prompt
  if (!state.promptStartTimes[stateKey]) {
    state.promptStartTimes[stateKey] = Date.now();
  }

  // Side assignment: false = models[0] on left, true = models[0] on right
  const swapped = state.sideAssignments[stateKey];
  const leftModel = swapped ? models[1] : models[0];
  const rightModel = swapped ? models[0] : models[1];

  const leftImages = getImagePaths(expId, leftModel, promptId, prompt.images_per_model);
  const rightImages = getImagePaths(expId, rightModel, promptId, prompt.images_per_model);

  // Initialize responses for this prompt if needed
  if (!state.responses[stateKey]) {
    state.responses[stateKey] = {};
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'evaluation';

  // Progress bar
  wrapper.appendChild(renderProgressBar(index, totalPrompts));

  // Prompt text
  const promptDiv = document.createElement('div');
  promptDiv.className = 'evaluation__prompt';
  promptDiv.innerHTML = `
    <div class="evaluation__prompt-label">Prompt</div>
    <div class="evaluation__prompt-text">"${prompt.text}"</div>
  `;
  wrapper.appendChild(promptDiv);

  // Content: left grid | metrics | right grid
  const content = document.createElement('div');
  content.className = 'evaluation__content';

  // Left side
  const leftSide = document.createElement('div');
  leftSide.className = 'evaluation__side';
  const leftLabel = document.createElement('div');
  leftLabel.className = 'evaluation__side-label';
  leftLabel.textContent = 'Set A';
  leftSide.appendChild(leftLabel);
  leftSide.appendChild(renderImageGrid(leftImages));
  content.appendChild(leftSide);

  // Metrics panel
  const metricsPanel = document.createElement('div');
  metricsPanel.className = 'metrics-panel';

  const updateNextButton = () => {
    const allAnswered = metrics.every(m => state.responses[stateKey][m.id] !== undefined);
    const nextBtn = wrapper.querySelector('.btn--primary');
    if (nextBtn) nextBtn.disabled = !allAnswered;
  };

  for (const metric of metrics) {
    const currentVal = state.responses[stateKey][metric.id];
    const control = renderMetricControl(metric, currentVal, (metricId, value) => {
      state.responses[stateKey][metricId] = value;
      updateNextButton();
    });
    metricsPanel.appendChild(control);
  }
  content.appendChild(metricsPanel);

  // Right side
  const rightSide = document.createElement('div');
  rightSide.className = 'evaluation__side';
  const rightLabel = document.createElement('div');
  rightLabel.className = 'evaluation__side-label';
  rightLabel.textContent = 'Set B';
  rightSide.appendChild(rightLabel);
  rightSide.appendChild(renderImageGrid(rightImages));
  content.appendChild(rightSide);

  wrapper.appendChild(content);

  // Navigation
  const nav = document.createElement('div');
  nav.className = 'evaluation__nav';

  if (index > 0) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn--secondary';
    prevBtn.textContent = 'Previous';
    prevBtn.addEventListener('click', () => {
      recordTimeSpent(stateKey);
      window.location.hash = `#eval/${index - 1}`;
    });
    nav.appendChild(prevBtn);
  }

  const isLast = index === totalPrompts - 1;
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--primary';
  nextBtn.textContent = isLast ? 'Finish' : 'Next';
  nextBtn.disabled = !metrics.every(m => state.responses[stateKey][m.id] !== undefined);
  nextBtn.addEventListener('click', () => {
    recordTimeSpent(stateKey);
    if (isLast) {
      window.location.hash = '#submit';
    } else {
      window.location.hash = `#eval/${index + 1}`;
    }
  });
  nav.appendChild(nextBtn);

  wrapper.appendChild(nav);
  app.appendChild(wrapper);
}

function recordTimeSpent(stateKey) {
  if (state.promptStartTimes[stateKey]) {
    const elapsed = (Date.now() - state.promptStartTimes[stateKey]) / 1000;
    if (!state.responses[stateKey]._timeSpent) {
      state.responses[stateKey]._timeSpent = 0;
    }
    state.responses[stateKey]._timeSpent += elapsed;
    delete state.promptStartTimes[stateKey];
  }
}
