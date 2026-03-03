import state from '../state.js';
import { initializeRandomization } from '../randomization.js';

export function renderLanding() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const landing = document.createElement('div');
  landing.className = 'landing';

  const card = document.createElement('div');
  card.className = 'landing__card';

  const study = state.config.study;

  card.innerHTML = `
    <h1 class="landing__title">${study.title}</h1>
    <p class="landing__description">${study.description}</p>
    <div class="landing__instructions">${study.instructions}</div>
    <form class="landing__form">
      <input type="email" class="landing__input" placeholder="Enter your email to begin" required>
      <button type="submit" class="btn btn--primary">Start Study</button>
    </form>
  `;

  const form = card.querySelector('form');
  const input = card.querySelector('input');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!email || !email.includes('@')) {
      input.classList.add('invalid');
      return;
    }

    state.email = email;
    state.sessionId = crypto.randomUUID();
    state.startTime = new Date().toISOString();

    const { seed, promptOrder, sideAssignments } = initializeRandomization(email, state.config.experiments);
    state.randomizationSeed = seed;
    state.promptOrder = promptOrder;
    state.sideAssignments = sideAssignments;
    state.currentPromptIndex = 0;
    state.responses = {};

    window.location.hash = '#eval/0';
  });

  input.addEventListener('input', () => input.classList.remove('invalid'));

  landing.appendChild(card);
  app.appendChild(landing);
}
