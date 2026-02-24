import state from '../state.js';

function buildSubmissionData() {
  const models = state.config.models;
  const prompts = state.config.prompts;

  const responses = state.promptOrder.map(promptIdx => {
    const prompt = prompts[promptIdx];
    const swapped = state.sideAssignments[prompt.id];
    const leftModel = swapped ? models[1] : models[0];
    const rightModel = swapped ? models[0] : models[1];
    const promptResponses = state.responses[prompt.id] || {};

    const ratings = {};
    for (const metric of state.config.metrics) {
      const raw = promptResponses[metric.id];
      let winner = 'unanswered';
      if (raw === -1) winner = leftModel;
      else if (raw === 0) winner = 'tie';
      else if (raw === 1) winner = rightModel;

      ratings[metric.id] = { winner, raw_value: raw };
    }

    return {
      prompt_id: prompt.id,
      prompt_text: prompt.text,
      left_model: leftModel,
      right_model: rightModel,
      time_spent_seconds: Math.round(promptResponses._timeSpent || 0),
      ratings,
    };
  });

  return {
    session_id: state.sessionId,
    user_email: state.email,
    start_time: state.startTime,
    end_time: new Date().toISOString(),
    randomization_seed: state.randomizationSeed,
    prompt_order: state.promptOrder,
    responses,
  };
}

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `study-response-${state.sessionId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function renderSubmit() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'submit-page';

  const card = document.createElement('div');
  card.className = 'submit-card';

  card.innerHTML = `
    <h2 class="submit-card__title">Thank You!</h2>
    <p class="submit-card__message">Submitting your responses...</p>
    <div class="spinner"></div>
    <div class="submit-card__status"></div>
  `;

  page.appendChild(card);
  app.appendChild(page);

  const data = buildSubmissionData();
  const statusEl = card.querySelector('.submit-card__status');
  const spinner = card.querySelector('.spinner');
  const message = card.querySelector('.submit-card__message');

  const scriptUrl = state.config.googleAppsScriptUrl;

  if (!scriptUrl) {
    spinner.remove();
    message.textContent = 'No submission endpoint configured. Downloading your responses as JSON.';
    downloadJson(data);
    statusEl.className = 'submit-card__status submit-card__status--success';
    statusEl.textContent = 'You can send this file to the study organizer.';
    return;
  }

  fetch(scriptUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(() => {
      spinner.remove();
      message.textContent = 'Responses submitted. Thank you!';
      statusEl.className = 'submit-card__status submit-card__status--success';
      statusEl.textContent = 'Submission sent successfully.';
      // downloadJson(data);
    })
    .catch(() => {
      spinner.remove();
      message.textContent = 'Submission failed. Downloading your responses as JSON instead.';
      statusEl.className = 'submit-card__status submit-card__status--error';
      statusEl.textContent = 'You can send this file to the study organizer.';
      downloadJson(data);
    });
}
