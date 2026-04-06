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

    if (status === 'online' || status === 'idle' || status === 'dnd') {
      statusText.textContent = 'online';
      statusDot.classList.add('online');
    } else {
      statusText.textContent = 'offline';
      statusDot.classList.remove('online');
    }
  } catch {
    statusText.textContent = 'offline';
    statusDot.classList.remove('online');
  }
}

loadStatus();
setInterval(loadStatus, 60000);
