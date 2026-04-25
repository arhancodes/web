const DISCORD_USER_ID = '928558715974586399';
const WATCHING_API = 'https://streaming-tracker.arhan-harchandani.workers.dev';

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
const activityCardSmallIcon = document.getElementById('activityCardSmallIcon');
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

function getElapsedStart(a) {
  return a?.timestamps?.start || a?.created_at || null;
}

function renderCardContent() {
  if (!currentGameActivity) return;
  const a = currentGameActivity;

  activityCardName.textContent = a.name || '';
  activityCardDetails.textContent = a.details || '';

  // Combine state with small_text if present (e.g. "Tier 152" for Fortnite)
  const stateParts = [];
  if (a.state) stateParts.push(a.state);
  if (a.assets?.small_text && !a.state) stateParts.push(a.assets.small_text);
  activityCardState.textContent = stateParts.join(' • ');

  const start = getElapsedStart(a);
  activityCardTime.textContent = start ? formatElapsed(start) : '';

  // Large icon
  const iconUrl = getAssetUrl(a, 'large_image');
  if (iconUrl) {
    activityCardIcon.innerHTML = `<img src="${iconUrl}" alt="${a.name || ''}" />`;
  } else {
    activityCardIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#a8a29e" style="width:32px;height:32px;"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`;
  }

  // Small icon overlay
  const smallUrl = getAssetUrl(a, 'small_image');
  if (smallUrl && activityCardSmallIcon) {
    const tip = a.assets?.small_text || '';
    activityCardSmallIcon.innerHTML = `<img src="${smallUrl}" alt="${tip}" title="${tip}" />`;
    activityCardSmallIcon.classList.add('visible');
  } else if (activityCardSmallIcon) {
    activityCardSmallIcon.innerHTML = '';
    activityCardSmallIcon.classList.remove('visible');
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
  if (!activityCard?.classList.contains('open')) return;
  const start = getElapsedStart(currentGameActivity);
  if (start) activityCardTime.textContent = formatElapsed(start);
}, 1000);

function renderStatus(data) {
  if (!statusText || !statusIcon) return;
  if (!data) {
    statusText.textContent = 'offline';
    statusIcon.innerHTML = STATUS_ICONS.offline;
    if (activityPill) activityPill.style.display = 'none';
    if (spotifyPill) spotifyPill.style.display = 'none';
    if (watchingPill && watchingText.dataset.source !== 'prime') watchingPill.style.display = 'none';
    return;
  }
  const status = data.discord_status;
  statusText.textContent = status;
  statusIcon.innerHTML = STATUS_ICONS[status] || STATUS_ICONS.offline;

  const activities = data.activities || [];

  const watching = activities.find(a =>
    a.type === 3 || (a.name && STREAMING_SERVICES.includes(a.name.toLowerCase()))
  );
  if (watching && watchingPill && watchingText) {
    const title = watching.details || watching.state || watching.name;
    watchingText.textContent = `watching ${title} on ${watching.name}`;
    watchingText.dataset.source = 'discord';
    watchingPill.style.display = '';
  } else if (watchingPill && watchingText.dataset.source !== 'prime') {
    watchingPill.style.display = 'none';
  }

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

  if (data.spotify && spotifyPill && spotifyText) {
    spotifyText.textContent = `${data.spotify.song} — ${data.spotify.artist}`;
    spotifyPill.style.display = '';
  } else if (spotifyPill) {
    spotifyPill.style.display = 'none';
  }
}

let lanyardWs = null;
let lanyardHeartbeat = null;
let lanyardReconnectDelay = 1000;

function connectLanyard() {
  if (lanyardWs && lanyardWs.readyState <= 1) return;
  lanyardWs = new WebSocket('wss://api.lanyard.rest/socket');

  lanyardWs.addEventListener('open', () => {
    lanyardReconnectDelay = 1000;
    lanyardWs.send(JSON.stringify({
      op: 2,
      d: { subscribe_to_id: DISCORD_USER_ID },
    }));
  });

  lanyardWs.addEventListener('message', (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }
    if (msg.op === 1 && msg.d?.heartbeat_interval) {
      clearInterval(lanyardHeartbeat);
      lanyardHeartbeat = setInterval(() => {
        if (lanyardWs?.readyState === 1) lanyardWs.send(JSON.stringify({ op: 3 }));
      }, msg.d.heartbeat_interval);
    } else if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
      renderStatus(msg.d);
    }
  });

  lanyardWs.addEventListener('close', () => {
    clearInterval(lanyardHeartbeat);
    setTimeout(connectLanyard, lanyardReconnectDelay);
    lanyardReconnectDelay = Math.min(lanyardReconnectDelay * 2, 30000);
  });

  lanyardWs.addEventListener('error', () => lanyardWs.close());
}

connectLanyard();

/* ---- Prime Video tracker (worker API) ---- */
async function loadWatching() {
  if (!WATCHING_API || !watchingPill || !watchingText) return;
  try {
    const res = await fetch(WATCHING_API + '?t=' + Date.now());
    if (!res.ok) throw new Error(`watching API ${res.status}`);
    const data = await res.json();
    const FRESH_MS = 90 * 1000;
    const isFresh = data && data.updatedAt && (Date.now() - data.updatedAt < FRESH_MS);
    const discordPillOpen = watchingPill.style.display !== 'none' && watchingText.textContent && !watchingText.dataset.source?.startsWith('prime');
    if (data && data.title && isFresh) {
      if (discordPillOpen) return;
      watchingText.textContent = `watching ${data.title} on ${data.service || 'Prime Video'}`;
      watchingText.dataset.source = 'prime';
      watchingPill.style.display = '';
    } else if (watchingText.dataset.source === 'prime') {
      watchingText.dataset.source = '';
      watchingPill.style.display = 'none';
    }
  } catch {
    // ignore
  }
}

loadWatching();
setInterval(loadWatching, 30000);

/* ---- Song preview play button ---- */
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const songPreview = document.getElementById('songPreview');

function setPlayingUI(playing) {
  if (playing) {
    playBtn.classList.add('playing');
    playIcon.style.display = 'none';
    pauseIcon.style.display = '';
  } else {
    playBtn.classList.remove('playing');
    playIcon.style.display = '';
    pauseIcon.style.display = 'none';
  }
}

if (playBtn && songPreview) {
  songPreview.addEventListener('play', () => setPlayingUI(true));
  songPreview.addEventListener('pause', () => setPlayingUI(false));
  songPreview.addEventListener('ended', () => setPlayingUI(false));

  playBtn.addEventListener('click', () => {
    if (songPreview.paused) {
      songPreview.pause();
      songPreview.currentTime = 0;
      const startFromZero = () => {
        songPreview.removeEventListener('loadeddata', startFromZero);
        songPreview.currentTime = 0;
        songPreview.play().catch(() => setPlayingUI(false));
      };
      songPreview.addEventListener('loadeddata', startFromZero);
      songPreview.load();
    } else {
      songPreview.pause();
      songPreview.currentTime = 0;
    }
  });
}
