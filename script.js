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

const activityCard = document.getElementById('activityCard');
const activityCardIcon = document.getElementById('activityCardIcon');
const activityCardName = document.getElementById('activityCardName');
const activityCardDetails = document.getElementById('activityCardDetails');
const activityCardState = document.getElementById('activityCardState');
const activityCardTime = document.getElementById('activityCardTime');

let currentGameActivity = null;

function pad(n) { return n < 10 ? `0${n}` : `${n}`; }

function formatElapsed(startMs) {
  const secs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(s)} elapsed`;
  return `${pad(mins)}:${pad(s)} elapsed`;
}

function getAssetUrl(activity, assetKey) {
  const asset = activity?.assets?.[assetKey];
  if (!asset) return null;
  if (asset.startsWith('mp:')) {
    return `https://media.discordapp.net/${asset.slice(3)}`;
  }
  if (activity.application_id) {
    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${asset}.png`;
  }
  return null;
}

function renderCardContent() {
  if (!currentGameActivity) return;
  const a = currentGameActivity;

  activityCardName.textContent = a.name || '';
  activityCardDetails.textContent = a.details || '';
  activityCardState.textContent = a.state || '';
  activityCardTime.textContent = a.timestamps?.start ? formatElapsed(a.timestamps.start) : '';

  const iconUrl = getAssetUrl(a, 'large_image');
  if (iconUrl) {
    activityCardIcon.innerHTML = `<img src="${iconUrl}" alt="${a.name || ''}" />`;
  } else {
    activityCardIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#a8a29e" style="width:32px;height:32px;"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`;
  }
}

function toggleCard(open) {
  if (!activityCard) return;
  if (open === undefined) open = !activityCard.classList.contains('open');
  activityCard.classList.toggle('open', open);
  activityCard.setAttribute('aria-hidden', String(!open));
}

if (activityPill) {
  activityPill.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentGameActivity) return;
    renderCardContent();
    toggleCard();
  });
}

// Close card when clicking outside
document.addEventListener('click', (e) => {
  if (!activityCard?.classList.contains('open')) return;
  if (!activityCard.contains(e.target) && e.target !== activityPill && !activityPill.contains(e.target)) {
    toggleCard(false);
  }
});

// Update elapsed time every second when card is open
setInterval(() => {
  if (activityCard?.classList.contains('open') && currentGameActivity?.timestamps?.start) {
    activityCardTime.textContent = formatElapsed(currentGameActivity.timestamps.start);
  }
}, 1000);

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
      activityText.textContent = `playing ${game.name}`;
      if (activityCard?.classList.contains('open')) renderCardContent();
    } else if (activityPill) {
      currentGameActivity = null;
      activityPill.style.display = 'none';
      toggleCard(false);
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
