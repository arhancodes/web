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
const activityPill = document.getElementById('activityPill');
const activityText = document.getElementById('activityText');
const spotifyPill = document.getElementById('spotifyPill');
const spotifyText = document.getElementById('spotifyText');
const watchingPill = document.getElementById('watchingPill');
const watchingText = document.getElementById('watchingText');

const STREAMING_SERVICES = ['netflix', 'disney+', 'disney plus', 'prime video', 'amazon prime video', 'hulu', 'hbo max', 'max', 'youtube', 'apple tv', 'apple tv+', 'crunchyroll', 'peacock', 'paramount+', 'paramount plus'];

const STATUS_ICONS = {
  online: '<svg viewBox="0 0 16 16" fill="#22c55e"><circle cx="8" cy="8" r="8"/></svg>',
  idle: '<svg viewBox="0 0 16 16" fill="#facc15"><path d="M14.3 10.4A8 8 0 1 1 5.6 1.7 6 6 0 1 0 14.3 10.4z"/></svg>',
  dnd: '<svg viewBox="0 0 16 16" fill="#ef4444"><circle cx="8" cy="8" r="8"/><rect x="3.5" y="6.5" width="9" height="3" rx="1.5" fill="#292524"/></svg>',
  offline: '<svg viewBox="0 0 16 16" fill="#666"><circle cx="8" cy="8" r="8"/><circle cx="8" cy="8" r="4" fill="#292524"/></svg>',
};

let currentGameActivity = null;
let expandedView = false;

function formatElapsed(startMs) {
  const secs = Math.floor((Date.now() - startMs) / 1000);
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

function renderGamePill() {
  if (!currentGameActivity || !activityText) return;
  const a = currentGameActivity;

  if (expandedView) {
    const lines = [];
    if (a.details) lines.push(a.details);
    if (a.state) lines.push(a.state);
    if (a.timestamps?.start) lines.push(`for ${formatElapsed(a.timestamps.start)}`);
    activityText.textContent = lines.length ? `${a.name} — ${lines.join(' • ')}` : `playing ${a.name}`;
  } else {
    activityText.textContent = `playing ${a.name}`;
  }
}

if (activityPill) {
  activityPill.addEventListener('click', () => {
    if (!currentGameActivity) return;
    expandedView = !expandedView;
    renderGamePill();
  });
}

// Update elapsed time every 30s when expanded
setInterval(() => {
  if (expandedView && currentGameActivity?.timestamps?.start) {
    renderGamePill();
  }
}, 30000);

async function loadStatus() {
  if (!statusText || !statusIcon) return;

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
    if (!res.ok) throw new Error(`Lanyard API ${res.status}`);
    const json = await res.json();
    const data = json.data;
    const status = data.discord_status;

    statusText.textContent = status;
    statusIcon.innerHTML = STATUS_ICONS[status] || STATUS_ICONS.offline;

    const activities = data.activities || [];

    // Check for streaming service (type 3 = Watching, or PreMiD activity name matches)
    const watching = activities.find(a =>
      a.type === 3 || (a.name && STREAMING_SERVICES.includes(a.name.toLowerCase()))
    );

    if (watching && watchingPill && watchingText) {
      const title = watching.details || watching.state || watching.name;
      watchingText.textContent = `watching ${title} on ${watching.name}`;
      watchingPill.style.display = '';
    } else if (watchingPill) {
      watchingPill.style.display = 'none';
    }

    // Show game activity (type 0 = Playing) but exclude streaming services
    const game = activities.find(a =>
      a.type === 0 && !STREAMING_SERVICES.includes((a.name || '').toLowerCase())
    );
    if (game && activityPill && activityText) {
      currentGameActivity = game;
      activityPill.style.display = '';
      activityPill.style.cursor = 'pointer';
      renderGamePill();
    } else if (activityPill) {
      currentGameActivity = null;
      expandedView = false;
      activityPill.style.display = 'none';
    }

    // Show Spotify activity
    if (data.spotify && spotifyPill && spotifyText) {
      spotifyText.textContent = `${data.spotify.song} — ${data.spotify.artist}`;
      spotifyPill.style.display = '';
    } else if (spotifyPill) {
      spotifyPill.style.display = 'none';
    }
  } catch {
    statusText.textContent = 'offline';
    statusIcon.innerHTML = STATUS_ICONS.offline;
    if (activityPill) activityPill.style.display = 'none';
    if (spotifyPill) spotifyPill.style.display = 'none';
    if (watchingPill) watchingPill.style.display = 'none';
  }
}

loadStatus();
setInterval(loadStatus, 60000);
