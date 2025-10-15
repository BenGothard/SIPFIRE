const scoreboardForm = document.getElementById('scoreboard');
const scoreEl = document.getElementById('score');
const checkboxes = scoreboardForm?.querySelectorAll('input[type="checkbox"]');
const shareButton = document.getElementById('share-btn');
const shareOutput = document.getElementById('share-output');
const yearEl = document.getElementById('year');
const simulateTokenBtn = document.getElementById('simulate-token');
const tokenProgressEl = document.getElementById('token-progress');
const tokenLevelEl = document.getElementById('token-level');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const STORAGE_KEY = 'sipfire-scoreboard';

const levelMap = [
  { threshold: 0, label: 'Kindling' },
  { threshold: 15, label: 'Spark' },
  { threshold: 50, label: 'Blaze' },
  { threshold: 120, label: 'Inferno' },
  { threshold: 250, label: 'Nova' }
];

function persistScoreboard(values) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch (error) {
    console.warn('Unable to persist scoreboard to localStorage', error);
  }
}

function loadScoreboard() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('Unable to load scoreboard from localStorage', error);
    return [];
  }
}

function updateScoreboardDisplay(values = []) {
  if (!checkboxes) return;
  let activeCount = 0;

  checkboxes.forEach((checkbox) => {
    const checked = values.includes(checkbox.value);
    checkbox.checked = checked;
    checkbox.closest('label')?.classList.toggle('checked', checked);
    if (checked) activeCount += 1;
  });

  if (scoreEl) {
    scoreEl.textContent = activeCount;
  }
}

if (checkboxes?.length) {
  const savedValues = loadScoreboard();
  updateScoreboardDisplay(savedValues);

  scoreboardForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = Array.from(checkboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
    persistScoreboard(selected);
    updateScoreboardDisplay(selected);

    const timestamp = new Date().toLocaleString();
    scoreboardForm.classList.add('celebrate');
    setTimeout(() => scoreboardForm.classList.remove('celebrate'), 900);

    if (shareOutput) {
      shareOutput.textContent = `Logged ${selected.length}/7 disciplines on ${timestamp}. Keep compounding!`;
    }
  });

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const selected = Array.from(checkboxes)
        .filter((item) => item.checked)
        .map((item) => item.value);
      persistScoreboard(selected);
      updateScoreboardDisplay(selected);
    });
  });
}

if (shareButton && shareOutput) {
  shareButton.addEventListener('click', () => {
    const savedValues = loadScoreboard();
    const missing = 7 - savedValues.length;
    const message = missing > 0
      ? `SIPFIRE Check-in: ${savedValues.join(', ')} 🔥 | ${missing} to ignite before day ends. Join me?`
      : 'SIPFIRE Check-in: 7/7 🔥🔥🔥 Fully ignited today! Keep the flame alive.';

    shareOutput.textContent = message;
    navigator.clipboard?.writeText(message).catch(() => {
      console.warn('Clipboard copy not available in this browser.');
    });
  });
}

if (simulateTokenBtn && tokenProgressEl && tokenLevelEl) {
  simulateTokenBtn.addEventListener('click', () => {
    const holdings = Number(prompt('How many SIPFIRE tokens are you ready to hold?'));
    if (Number.isNaN(holdings) || holdings < 0) {
      alert('Enter a valid, non-negative number.');
      return;
    }

    const cappedHoldings = Math.min(holdings, 500);
    const widthPercent = Math.max(5, Math.min(100, Math.round((cappedHoldings / 500) * 100)));
    tokenProgressEl.style.width = `${widthPercent}%`;

    const level = [...levelMap].reverse().find((entry) => cappedHoldings >= entry.threshold) ?? levelMap[0];
    tokenLevelEl.textContent = level.label;
  });
}
