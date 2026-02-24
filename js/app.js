import state from './state.js';
import { renderLanding } from './views/landing.js';
import { renderEvaluation } from './views/evaluation.js';
import { renderSubmit } from './views/submit.js';

function route() {
  const hash = window.location.hash || '#landing';

  if (hash === '#landing' || hash === '#' || hash === '') {
    renderLanding();
  } else if (hash.startsWith('#eval/')) {
    if (!state.email) {
      window.location.hash = '#landing';
      return;
    }
    const index = parseInt(hash.split('/')[1], 10);
    const total = state.promptOrder.length;
    if (isNaN(index) || index < 0 || index >= total) {
      window.location.hash = '#eval/0';
      return;
    }
    renderEvaluation(index);
  } else if (hash === '#submit') {
    if (!state.email) {
      window.location.hash = '#landing';
      return;
    }
    renderSubmit();
  } else {
    window.location.hash = '#landing';
  }
}

async function init() {
  try {
    const res = await fetch('config.json');
    state.config = await res.json();
  } catch (e) {
    document.getElementById('app').innerHTML = `
      <div class="landing">
        <div class="landing__card">
          <h1 class="landing__title">Configuration Error</h1>
          <p class="landing__description">Could not load config.json. Run <code>python scripts/generate_config.py</code> to generate it.</p>
        </div>
      </div>
    `;
    return;
  }

  window.addEventListener('hashchange', route);
  route();
}

init();
