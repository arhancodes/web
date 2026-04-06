const DISCORD_USER_ID = '928558715974586399';

/* ---- Time display ---- */
const timeDisplay = document.getElementById('timeDisplay');

function updateTime() {
  if (!timeDisplay) return;
  timeDisplay.textContent = new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

updateTime();
setInterval(updateTime, 15000);

/* ---- Discord status ---- */
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

async function loadStatus() {
  if (!statusText || !statusDot) return;

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
    if (!res.ok) throw new Error(`Lanyard API ${res.status}`);
    const json = await res.json();
    const status = json.data.discord_status;

    statusText.textContent = status;
    statusDot.className = 'status-dot';
    if (status !== 'offline') statusDot.classList.add(status);
  } catch {
    statusText.textContent = 'offline';
    statusDot.classList.remove('online');
  }
}

loadStatus();
setInterval(loadStatus, 60000);
