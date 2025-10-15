const scoreboardForm = document.getElementById('scoreboard');
const scoreEl = document.getElementById('score');
const checkboxes = scoreboardForm?.querySelectorAll('input[type="checkbox"]');
const shareButton = document.getElementById('share-btn');
const shareOutput = document.getElementById('share-output');
const shareLinks = document.querySelectorAll('[data-share-target]');
const clipboardLink = document.querySelector('[data-share-target="clipboard"]');
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
      const payload = buildSharePayload(selected);
      lastSharePayload = payload;
      updateShareLinks(payload);
    }
  });

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const selected = Array.from(checkboxes)
        .filter((item) => item.checked)
        .map((item) => item.value);
      persistScoreboard(selected);
      updateScoreboardDisplay(selected);
      if (shareOutput) {
        const payload = buildSharePayload(selected);
        lastSharePayload = payload;
        updateShareLinks(payload);
      }
    });
  });
}

let lastSharePayload = null;

function buildSharePayload(values = loadScoreboard()) {
  const selected = values ?? [];
  const missing = Math.max(0, 7 - selected.length);
  const headline = missing > 0
    ? `SIPFIRE Check-in: ${selected.join(', ')} 🔥 | ${missing} more to ignite before day ends.`
    : 'SIPFIRE Check-in: 7/7 🔥🔥🔥 Fully ignited today! Keep the flame alive.';

  return {
    message: headline,
    url: window.location.href,
    missing,
  };
}

function updateShareLinks(payload) {
  shareLinks.forEach((link) => {
    const target = link.getAttribute('data-share-target');
    if (!target || target === 'clipboard') {
      return;
    }

    const encodedMessage = encodeURIComponent(`${payload.message} ${payload.url}`.trim());
    let href = '#';

    switch (target) {
      case 'twitter':
        href = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
        break;
      case 'telegram':
        href = `https://t.me/share/url?url=${encodeURIComponent(payload.url)}&text=${encodeURIComponent(payload.message)}`;
        break;
      case 'whatsapp':
        href = `https://wa.me/?text=${encodedMessage}`;
        break;
      default:
        href = payload.url;
    }

    link.setAttribute('href', href);
  });
}

async function copyShareText(text) {
  if (!navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn('Clipboard copy not available in this browser.', error);
    return false;
  }
}

const initialPayload = buildSharePayload(loadScoreboard());
lastSharePayload = initialPayload;
updateShareLinks(initialPayload);

if (shareOutput && !shareOutput.textContent) {
  shareOutput.textContent = 'Ready to broadcast your progress? Hit share to ignite your circle.';
}

if (shareButton && shareOutput) {
  shareButton.addEventListener('click', async () => {
    const savedValues = loadScoreboard();
    const payload = buildSharePayload(savedValues);
    lastSharePayload = payload;
    updateShareLinks(payload);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SIPFIRE Daily Check-in',
          text: payload.message,
          url: payload.url,
        });
        shareOutput.textContent = 'Share sheet opened. Keep fueling the movement! If it did not send, use the links below.';
        return;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('Native share failed, falling back to manual options.', error);
        }
      }
    }

    shareOutput.textContent = `${payload.message} Use the links below to signal your streak.`;

    if (!navigator.share) {
      await copyShareText(`${payload.message} ${payload.url}`.trim());
    }
  });
}

if (clipboardLink) {
  clipboardLink.addEventListener('click', async (event) => {
    event.preventDefault();
    const payload = lastSharePayload ?? buildSharePayload(loadScoreboard());
    const copied = await copyShareText(`${payload.message} ${payload.url}`.trim());
    if (shareOutput) {
      shareOutput.textContent = copied
        ? 'Copied to clipboard! Paste it anywhere to spread the flame.'
        : 'Clipboard unavailable. Use the share links above to spread the flame.';
    }
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
