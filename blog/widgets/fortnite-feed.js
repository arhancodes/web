const REPO = 'Fortnite-Datamining/Fortnite-Datamining';
const API = `https://api.github.com/repos/${REPO}/commits?per_page=30`;
const REFRESH_MS = 60_000;

const CATEGORY_META = {
  'Item Shop': { color: '#22c55e', icon: 'shop' },
  'BR Cosmetics': { color: '#3b82f6', icon: 'cosmetics' },
  'LEGO Cosmetics': { color: '#facc15', icon: 'lego' },
  'News': { color: '#f97316', icon: 'news' },
  'Jam Tracks': { color: '#1db954', icon: 'music' },
  'Cars': { color: '#06b6d4', icon: 'car' },
  'Instruments': { color: '#ec4899', icon: 'music' },
  'Banners': { color: '#14b8a6', icon: 'banner' },
  'Playlists': { color: '#8b5cf6', icon: 'play' },
  'AES Keys': { color: '#a8a29e', icon: 'key' },
  'Build': { color: '#ef4444', icon: 'build' },
  'Other': { color: '#a8a29e', icon: 'dot' },
};

const ICONS = {
  shop: '<path d="M3 6h18l-1.5 11h-15zM8 6V4a4 4 0 018 0v2"/>',
  cosmetics: '<circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>',
  lego: '<rect x="4" y="6" width="16" height="14" rx="1"/><circle cx="9" cy="3" r="1.5" fill="currentColor"/><circle cx="15" cy="3" r="1.5" fill="currentColor"/>',
  news: '<rect x="3" y="4" width="18" height="16" rx="1"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="17" y2="13"/><line x1="7" y1="17" x2="13" y2="17"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  car: '<path d="M3 13l2-7h14l2 7M5 13h14v5H5z"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/>',
  banner: '<path d="M5 4v17l7-4 7 4V4z"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="M11 11l9-9 2 2-2 2 2 2-2 2-2-2-3 3"/>',
  build: '<path d="M14.7 6.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L7 12.6l6.3-6.3a1 1 0 011.4 0z"/><circle cx="12" cy="12" r="9"/>',
  dot: '<circle cx="12" cy="12" r="3" fill="currentColor"/>',
};

function svgIcon(key, color) {
  const d = ICONS[key] || ICONS.dot;
  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(date).toLocaleDateString();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseCommit(commit) {
  // Some commits store literal "\n" sequences instead of real newlines.
  const fullMessage = commit.commit.message.replace(/\\n/g, '\n');
  const lines = fullMessage.split(/\r?\n/);
  const title = lines[0];
  const body = lines.slice(1).join('\n').trim();

  if (/^Build Update:/.test(title)) {
    const versionMatch = title.match(/Release-([\d.]+)/);
    return {
      kind: 'build',
      categories: ['Build'],
      version: versionMatch ? versionMatch[1] : null,
      added: extractAdded(body),
      counts: extractCounts(body),
    };
  }

  if (/^Update:/.test(title)) {
    const cats = title.replace(/^Update:\s*/, '').split(',').map(s => s.trim()).filter(Boolean);
    return {
      kind: 'update',
      categories: cats,
      added: extractAdded(body),
      counts: extractCounts(body),
    };
  }

  return null;
}

function extractAdded(body) {
  const items = [];
  const re = /Added:\s*(.+?)(?:\n|$)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    items.push(...m[1].split(',').map(s => s.trim().replace(/\.\.\.$/, '')).filter(Boolean));
  }
  return items;
}

function extractCounts(body) {
  const counts = {};
  const re = /-\s+`?([^`\n]+\.json)`?(?:\s*\(([^)]+)\))?/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const file = m[1].trim();
    const detail = m[2];
    if (!detail) continue;
    const addM = detail.match(/\+(\d+)\s+items/);
    if (addM) counts[file] = parseInt(addM[1], 10);
  }
  return counts;
}

function renderEntry(commit, parsed) {
  const cat = parsed.categories[0] || 'Other';
  const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
  const time = timeAgo(commit.commit.author.date);
  const sha = commit.sha.slice(0, 7);
  const url = commit.html_url;

  const totalAdded = Object.values(parsed.counts).reduce((s, n) => s + n, 0);
  const addedSummary = totalAdded > 0 ? `<span class="ff-count">+${totalAdded}</span>` : '';

  const otherCats = parsed.categories.slice(1);
  const moreCats = otherCats.length > 0
    ? `<span class="ff-more-cats">+${otherCats.length} more</span>`
    : '';

  const itemPreview = parsed.added.length > 0
    ? `<div class="ff-items">${parsed.added.slice(0, 3).map(escapeHtml).join(' &middot; ')}${parsed.added.length > 3 ? `<span class="ff-items-more"> &middot; +${parsed.added.length - 3}</span>` : ''}</div>`
    : '';

  const versionBadge = parsed.version
    ? `<div class="ff-version">v${escapeHtml(parsed.version)}</div>`
    : '';

  return `
    <a class="ff-entry" href="${url}" target="_blank" rel="noopener">
      <div class="ff-row1">
        <span class="ff-icon" style="color:${meta.color}">${svgIcon(meta.icon, meta.color)}</span>
        <span class="ff-cat" style="color:${meta.color}">${escapeHtml(cat)}</span>
        ${moreCats}
        ${addedSummary}
        <span class="ff-time">${time}</span>
      </div>
      ${versionBadge}
      ${itemPreview}
    </a>
  `;
}

async function fetchCommits() {
  const res = await fetch(API, { headers: { 'Accept': 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}

function renderFeed(container, commits) {
  const entries = commits
    .map(c => ({ commit: c, parsed: parseCommit(c) }))
    .filter(x => x.parsed !== null);

  if (entries.length === 0) {
    container.querySelector('.ff-list').innerHTML = '<div class="ff-empty">No recent updates</div>';
    return;
  }

  const html = entries.slice(0, 20).map(({ commit, parsed }) => renderEntry(commit, parsed)).join('');
  container.querySelector('.ff-list').innerHTML = html;
  const updated = container.querySelector('.ff-updated');
  if (updated) updated.textContent = `Updated ${timeAgo(new Date())}`;
}

function setError(container, msg) {
  container.querySelector('.ff-list').innerHTML = `<div class="ff-empty">${escapeHtml(msg)}</div>`;
}

export function mountFortniteFeed(container) {
  container.innerHTML = `
    <div class="ff-header">
      <span class="ff-pulse"></span>
      <h2 class="ff-title">Live Updates</h2>
    </div>
    <p class="ff-sub">From <a href="https://github.com/${REPO}" target="_blank" rel="noopener">Fortnite-Datamining</a></p>
    <div class="ff-list"><div class="ff-empty">Loading...</div></div>
    <p class="ff-updated"></p>
  `;

  let timer = null;

  async function tick() {
    try {
      const commits = await fetchCommits();
      renderFeed(container, commits);
    } catch (err) {
      console.warn('Fortnite feed error:', err);
      if (!container.querySelector('.ff-entry')) {
        setError(container, 'Could not load feed');
      }
    }
  }

  tick();
  timer = setInterval(tick, REFRESH_MS);

  return () => { if (timer) clearInterval(timer); };
}
