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
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');

const STATUS_ICONS = {
  online: '<svg viewBox="0 0 16 16" fill="#22c55e"><circle cx="8" cy="8" r="8"/></svg>',
  idle: '<svg viewBox="0 0 16 16" fill="#facc15"><path d="M14.3 10.4A8 8 0 1 1 5.6 1.7 6 6 0 1 0 14.3 10.4z"/></svg>',
  dnd: '<svg viewBox="0 0 16 16" fill="#ef4444"><circle cx="8" cy="8" r="8"/><rect x="3.5" y="6.5" width="9" height="3" rx="1.5" fill="#292524"/></svg>',
  offline: '<svg viewBox="0 0 16 16" fill="#666"><circle cx="8" cy="8" r="8"/><circle cx="8" cy="8" r="4" fill="#292524"/></svg>',
};

async function loadStatus() {
  if (!statusText || !statusIcon) return;

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
    if (!res.ok) throw new Error(`Lanyard API ${res.status}`);
    const json = await res.json();
    const status = json.data.discord_status;

    statusText.textContent = status;
    statusIcon.innerHTML = STATUS_ICONS[status] || STATUS_ICONS.offline;
  } catch {
    statusText.textContent = 'offline';
    statusIcon.innerHTML = STATUS_ICONS.offline;
  }
}

loadStatus();
setInterval(loadStatus, 60000);
