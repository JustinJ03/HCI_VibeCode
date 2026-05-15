'use strict';

/* ══ STATE ══ */
let currentScreen = 'screen-home';
const navHistory = [];
let recentScreens = []; // tracks last N distinct screens
let cabinTemp = 21;
let isPlaying = false;
let isMuted = false;
let volume = 80;
let volTimer = null;
let trackTimer = null;
let trackSec = 0;
let currentTrack = 0;
let currentMode = 'auto';
let navMap = null, chargingMap = null;
let navActiveMap = null, chargingActiveMap = null;
let selectedLocation = null;
let selectedStation = null;
let entSidebarOpen = false;
let recentOverlayOpen = false;

/* ══ SCREEN META ══ */
const SCREEN_META = {
  'screen-home':              { label: 'Home',           icon: 'home' },
  'screen-battery':           { label: 'Energy',         icon: 'zap' },
  'screen-charging':          { label: 'Charging',       icon: 'zap-circle' },
  'screen-navigation':        { label: 'Navigation',     icon: 'navigation-2' },
  'screen-climate-cabin':     { label: 'Climate',        icon: 'thermometer' },
  'screen-climate-ac':        { label: 'AC Control',     icon: 'wind' },
  'screen-driving':           { label: 'Drive Mode',     icon: 'gauge' },
  'screen-engine':            { label: 'Engine',         icon: 'cpu' },
  'screen-performance':       { label: 'Performance',    icon: 'bar-chart-2' },
  'screen-issues':            { label: 'Issues',         icon: 'shield-check' },
  'screen-fault':             { label: 'Faults',         icon: 'alert-octagon' },
  'screen-entertainment':     { label: 'Entertainment',  icon: 'layout-grid' },
  'screen-music':             { label: 'Music',          icon: 'music-2' },
  'screen-youtube':           { label: 'YouTube',        icon: 'youtube' },
  'screen-settings-display':  { label: 'Settings',       icon: 'settings' },
  'screen-settings-bluetooth':{ label: 'Bluetooth',      icon: 'bluetooth' },
  'screen-settings-network':  { label: 'Network',        icon: 'wifi' },
  'screen-settings-time':     { label: 'Time',           icon: 'clock' },
  'screen-settings-system':   { label: 'System',         icon: 'settings-2' },
};

/* ══ RECENT SCREENS PREVIEWS ══ */
const SCREEN_PREVIEW = {
  'screen-climate-cabin': [
    { label: 'Cabin Temp', value: () => `${cabinTemp}°C` },
    { label: 'Status',     value: () => 'Active' },
  ],
  'screen-music': [
    { label: 'Track',   value: () => TRACKS[currentTrack]?.title || '—' },
    { label: 'Artist',  value: () => TRACKS[currentTrack]?.artist || '—' },
    { label: 'Playing', value: () => isPlaying ? 'Yes' : 'No' },
  ],
  'screen-navigation': [
    { label: 'Destination', value: () => selectedLocation ? NAV_LOCATIONS[selectedLocation]?.name : 'None selected' },
    { label: 'ETA',         value: () => selectedLocation ? NAV_LOCATIONS[selectedLocation]?.eta : '—' },
  ],
  'screen-driving': [
    { label: 'Mode',  value: () => currentMode.toUpperCase() },
    { label: 'Range', value: () => MODE_STATS[currentMode]?.range || '—' },
  ],
  'screen-battery': [
    { label: 'Battery',  value: () => '80%' },
    { label: 'Range',    value: () => '105 KM' },
  ],
  'screen-engine': [
    { label: 'Speed',  value: () => '90 km/h' },
    { label: 'Issues', value: () => 'None' },
  ],
};

/* ══ TRACKS ══ */
const TRACKS = [
  { title: 'Starboy',         artist: 'The Weeknd',    dur: 250 },
  { title: 'Blinding Lights', artist: 'The Weeknd',    dur: 202 },
  { title: 'Save Your Tears', artist: 'The Weeknd',    dur: 215 },
  { title: 'Levitating',      artist: 'Dua Lipa',      dur: 204 },
  { title: 'As It Was',       artist: 'Harry Styles',  dur: 157 },
  { title: 'Anti-Hero',       artist: 'Taylor Swift',  dur: 200 },
  { title: 'Golden Hour',     artist: 'JVKE',           dur: 209 },
  { title: 'Heat Waves',      artist: 'Glass Animals',  dur: 238 },
];

/* ══ MODE STATS ══ */
const MODE_STATS = {
  auto:  { power: '75 kW',  range: '105 KM', regen: '18%', color: '#00d4ff' },
  eco:   { power: '45 kW',  range: '130 KM', regen: '24%', color: '#00e676' },
  sport: { power: '150 kW', range: '75 KM',  regen: '12%', color: '#ff5252' },
};

/* ══ NAV LOCATIONS ══ */
const NAV_LOCATIONS = [
  { name: 'UNIMAS Main Campus',    detail: 'Kota Samarahan · University', dist: '1.2 km', eta: '3 min',  emoji: '🎓', pos: [1.4556, 110.4334] },
  { name: 'Kuching Waterfront',    detail: 'Jalan Main Bazaar · Landmark', dist: '8.4 km', eta: '18 min', emoji: '🌊', pos: [1.5570, 110.3436] },
  { name: 'The Spring Shopping Mall', detail: 'Jln Stutong · Mall',       dist: '6.1 km', eta: '12 min', emoji: '🛍️', pos: [1.5018, 110.3680] },
  { name: 'Satok Weekend Market',  detail: 'Jln Satok · Market',          dist: '9.2 km', eta: '21 min', emoji: '🛒', pos: [1.5560, 110.3378] },
  { name: 'Kuching Airport (KUCA)',  detail: 'Jln Airport · Transport',   dist: '11.3 km', eta: '24 min', emoji: '✈️', pos: [1.4847, 110.3369] },
];

/* ══ CHARGING STATIONS ══ */
const CHARGING_STATIONS = [
  { name: 'JomCharge Station',    detail: 'Jalan Uni Academia',             dist: '0.8 km', eta: '2 min',  emoji: '⚡', open: 'Open · Closes 7 pm', kw: '22 kW', slots: '2/2', color: '#00e676', pos: [1.5570, 110.3550] },
  { name: 'BMW Charging Station', detail: 'Kuching, Sarawak',               dist: '2.1 km', eta: '5 min',  emoji: '🔵', open: 'Open 24 hours',      kw: '12 kW', slots: '2/2', color: '#00d4ff', pos: [1.5510, 110.3620] },
  { name: 'ChargeSini Station',   detail: 'Kuching, Sarawak',               dist: '3.4 km', eta: '8 min',  emoji: '🟠', open: 'Open 24 hours',      kw: '22 kW', slots: '0/3 Full', color: '#ffab40', pos: [1.5490, 110.3580] },
];

/* ══ NAVIGATION ══ */
function navigate(to) {
  closeRecentApps();
  closeEntSidebar();
  if (to === currentScreen) return;
  const prev = document.getElementById(currentScreen);
  const next = document.getElementById(to);
  if (!next) return;

  if (prev) {
    prev.classList.add('exit');
    setTimeout(() => prev.classList.remove('active', 'exit'), 320);
  }

  next.classList.add('active');
  navHistory.push(currentScreen);

  addToRecent(currentScreen);
  currentScreen = to;
  onScreenEnter(to);
}

function goBack() {
  closeRecentApps();
  closeEntSidebar();
  if (navHistory.length === 0) return;
  const prev = navHistory.pop();
  const curr = document.getElementById(currentScreen);
  const target = document.getElementById(prev);
  if (!target) return;
  if (curr) {
    curr.classList.add('exit');
    setTimeout(() => curr.classList.remove('active', 'exit'), 320);
  }
  target.classList.add('active');
  currentScreen = prev;
  onScreenEnter(prev);
}

function onScreenEnter(id) {
  if (id === 'screen-navigation') initNavSelectMap();
  if (id === 'screen-charging')   initChargingMap();
}

/* ══ RECENT SCREENS ══ */
function addToRecent(screenId) {
  if (!SCREEN_META[screenId]) return;
  recentScreens = recentScreens.filter(s => s !== screenId);
  recentScreens.unshift(screenId);
  if (recentScreens.length > 6) recentScreens.pop();
}

function openRecentApps() {
  const overlay = document.getElementById('recent-overlay');
  if (!overlay) return;
  renderRecentCards();
  overlay.classList.add('open');
  recentOverlayOpen = true;
}

function closeRecentApps() {
  const overlay = document.getElementById('recent-overlay');
  if (overlay) overlay.classList.remove('open');
  recentOverlayOpen = false;
}

function clearRecentApps() {
  recentScreens = [];
  renderRecentCards();
}

function renderRecentCards() {
  const container = document.getElementById('recent-cards');
  if (!container) return;

  if (recentScreens.length === 0) {
    container.innerHTML = `<div style="color:var(--text-dim);font-size:16px;margin:auto">No recent apps</div>`;
    return;
  }

  container.innerHTML = recentScreens.map((id, i) => {
    const meta = SCREEN_META[id];
    const preview = SCREEN_PREVIEW[id];
    const previewHtml = preview ? preview.map(p => `
      <div class="recent-preview-row">
        <span class="recent-preview-label">${p.label}</span>
        <span class="recent-preview-value">${p.value()}</span>
      </div>`).join('') : `<div style="color:var(--text-dim);font-size:13px;padding:8px 0">Tap to open</div>`;

    return `
      <div class="recent-card" onclick="recentCardTap('${id}', event)">
        <div class="recent-card-header">
          <div class="recent-card-title">
            <i data-lucide="${meta.icon}" style="width:16px;height:16px;color:var(--cyan)"></i>
            ${meta.label}
          </div>
          <button class="recent-card-close" onclick="removeRecent('${id}',event)">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="recent-card-preview">${previewHtml}</div>
      </div>`;
  }).join('');

  lucide.createIcons({ nodes: [container] });
}

function recentCardTap(id, event) {
  closeRecentApps();
  navigate(id);
}

function removeRecent(id, event) {
  event.stopPropagation();
  recentScreens = recentScreens.filter(s => s !== id);
  renderRecentCards();
}

/* ══ ENTERTAINMENT SIDEBAR ══ */
function toggleEntSidebar() {
  entSidebarOpen = !entSidebarOpen;
  const sidebar = document.getElementById('ent-sidebar');
  if (sidebar) sidebar.classList.toggle('open', entSidebarOpen);
}

function closeEntSidebar() {
  entSidebarOpen = false;
  const sidebar = document.getElementById('ent-sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function navFromSidebar(to) {
  closeEntSidebar();
  navigate(to);
}

/* ══ CLOCK ══ */
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const timeStr = `${hh}:${mm}`;
  ['live-time','status-time'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = timeStr;
  });
  ['status-day','status-day-home'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = days[now.getDay()];
  });
}

setInterval(updateClock, 1000);
updateClock();

/* ══ VOLUME ══ */
function showVolOverlay() {
  const ov = document.getElementById('vol-overlay');
  if (!ov) return;
  ov.querySelector('.vol-bar-fill').style.width = (isMuted ? 0 : volume) + '%';
  ov.querySelector('.vol-value').textContent = isMuted ? '—' : volume;
  ov.classList.add('visible');
  clearTimeout(volTimer);
  volTimer = setTimeout(() => ov.classList.remove('visible'), 2200);
}

function adjustVolume(delta) {
  volume = Math.max(0, Math.min(100, volume + delta));
  if (isMuted && delta > 0) { isMuted = false; updateMuteBtn(); }
  showVolOverlay();
}

function toggleMute() {
  isMuted = !isMuted;
  updateMuteBtn();
  showVolOverlay();
}

function updateMuteBtn() {
  const btn = document.getElementById('btn-mute');
  if (!btn) return;
  btn.classList.toggle('muted', isMuted);
  const ico = btn.querySelector('[data-lucide]');
  if (ico) { ico.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-x'); }
}

/* ══ CABIN TEMP DIAL ══ */
const DIAL_R = 110;
const DIAL_CIRC = 2 * Math.PI * DIAL_R;
const DIAL_ARC = DIAL_CIRC * 0.75;

function updateDial() {
  const pct = (cabinTemp - 16) / (30 - 16);
  const offset = DIAL_ARC - pct * DIAL_ARC;
  const fill = document.getElementById('dial-fill');
  if (fill) fill.style.strokeDashoffset = offset;
  const display = document.getElementById('cabin-temp-display');
  const set = document.getElementById('cabin-temp-set');
  const navSet = document.getElementById('cabin-temp-set-nav');
  if (display) display.textContent = `${cabinTemp}°C`;
  if (set) set.textContent = `Set: ${cabinTemp}°C`;
  if (navSet) navSet.textContent = `${cabinTemp}°C`;
}

function adjustTemp(delta) {
  cabinTemp = Math.max(16, Math.min(30, cabinTemp + delta));
  updateDial();
}

/* ══ AC SLIDERS ══ */
function initSliders() {
  [
    ['fan-speed',  'fan-display',  false],
    ['ac-temp',    'ac-display',   true],
    ['brightness-slider', null,    false],
  ].forEach(([sliderId, displayId, isTemp]) => {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    const display = displayId ? document.getElementById(displayId) : null;
    const update = () => {
      const min = +slider.min, max = +slider.max, val = +slider.value;
      slider.style.setProperty('--pct', ((val - min) / (max - min)) * 100);
      if (display) display.textContent = isTemp ? `${val}°C` : `${val}%`;
    };
    update();
    slider.addEventListener('input', update);
  });

  const prog = document.getElementById('music-progress');
  if (prog) {
    prog.addEventListener('input', () => {
      trackSec = +prog.value;
      updateMusicSlider(prog);
      const el = document.querySelector('.music-time-current');
      if (el) el.textContent = fmtTime(trackSec);
    });
  }
}

/* ══ DRIVING MODE ══ */
function selectMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('mode-' + mode);
  if (btn) btn.classList.add('active');

  const stats = MODE_STATS[mode];
  const nameEl = document.getElementById('driving-mode-name');
  const powerEl = document.getElementById('driving-stat-power');
  const rangeEl = document.getElementById('driving-stat-range');
  const regenEl = document.getElementById('driving-stat-regen');
  if (nameEl) { nameEl.textContent = mode.toUpperCase(); nameEl.style.color = stats.color; }
  if (powerEl) powerEl.textContent = stats.power;
  if (rangeEl) rangeEl.textContent = stats.range;
  if (regenEl) regenEl.textContent = stats.regen;

  const glow = document.querySelector('.car-mode-glow');
  if (glow) glow.style.background = `radial-gradient(ellipse, ${stats.color}55 0%, transparent 70%)`;
}

/* ══ MUSIC ══ */
function fmtTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function loadTrack(idx) {
  currentTrack = idx ?? currentTrack;
  const t = TRACKS[currentTrack];
  trackSec = 0;
  clearInterval(trackTimer);
  isPlaying = false;

  const prog = document.getElementById('music-progress');
  if (prog) { prog.max = t.dur; prog.value = 0; updateMusicSlider(prog); }
  const titleEl = document.querySelector('.music-title');
  const artistEl = document.querySelector('.music-artist');
  const timeEl = document.querySelector('.music-time-current');
  const durEl = document.querySelector('.music-time-total');
  const nowEl = document.getElementById('now-playing-text');
  if (titleEl) titleEl.textContent = t.title;
  if (artistEl) artistEl.textContent = `${t.artist} · Playlist`;
  if (timeEl) timeEl.textContent = '0:00';
  if (durEl) durEl.textContent = fmtTime(t.dur);
  if (nowEl) nowEl.textContent = `${t.title} — ${t.artist}`;

  const art = document.querySelector('.music-art-spinning');
  if (art) art.classList.remove('playing');
  updatePlayBtn();
  renderPlaylist();
}

function updateMusicSlider(slider) {
  if (!slider) return;
  slider.style.setProperty('--pct', (+slider.value / +slider.max) * 100);
}

function togglePlay() {
  isPlaying = !isPlaying;
  updatePlayBtn();
  const art = document.querySelector('.music-art-spinning');
  if (art) art.classList.toggle('playing', isPlaying);
  if (isPlaying) {
    trackTimer = setInterval(() => {
      const t = TRACKS[currentTrack];
      trackSec = Math.min(trackSec + 1, t.dur);
      const prog = document.getElementById('music-progress');
      const timeEl = document.querySelector('.music-time-current');
      if (prog) { prog.value = trackSec; updateMusicSlider(prog); }
      if (timeEl) timeEl.textContent = fmtTime(trackSec);
      if (trackSec >= t.dur) nextTrack();
    }, 1000);
  } else {
    clearInterval(trackTimer);
  }
}

function updatePlayBtn() {
  const btn = document.getElementById('play-btn');
  if (!btn) return;
  const ico = btn.querySelector('[data-lucide]');
  if (ico) { ico.setAttribute('data-lucide', isPlaying ? 'pause' : 'play'); lucide.createIcons({ nodes: [btn] }); }
}

function prevTrack() {
  if (trackSec > 3) { trackSec = 0; return; }
  currentTrack = (currentTrack - 1 + TRACKS.length) % TRACKS.length;
  const wasPlaying = isPlaying;
  isPlaying = false;
  loadTrack();
  if (wasPlaying) togglePlay();
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % TRACKS.length;
  const wasPlaying = isPlaying;
  isPlaying = false;
  loadTrack();
  if (wasPlaying) togglePlay();
}

function selectTrack(idx) {
  isPlaying = false;
  loadTrack(idx);
  togglePlay();
}

function renderPlaylist() {
  const c = document.getElementById('playlist-items');
  if (!c) return;
  c.innerHTML = TRACKS.map((t, i) => `
    <div class="playlist-item ${i === currentTrack ? 'active' : ''}" onclick="selectTrack(${i})">
      <span class="playlist-num">${i === currentTrack && isPlaying ? '▶' : i + 1}</span>
      <div class="playlist-info">
        <div class="playlist-song">${t.title}</div>
        <div class="playlist-artist">${t.artist}</div>
      </div>
      <span class="playlist-dur">${fmtTime(t.dur)}</span>
    </div>`).join('');
}

/* ══ LEAFLET MAPS ══ */
const KUCHING = [1.5535, 110.3593];
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_OPTS = { attribution: '', subdomains: 'abcd', maxZoom: 19 };

function mkMarker(color, size = 14) {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 8px ${color}80"></div>`,
    iconSize: [size, size], iconAnchor: [size/2, size/2], className: ''
  });
}

function mkCarMarker() {
  return L.divIcon({
    html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 0 4px rgba(0,212,255,0.8))">🚗</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14], className: ''
  });
}

/* NAV SELECT MAP */
function initNavSelectMap() {
  if (navMap) { setTimeout(() => navMap.invalidateSize(), 100); return; }
  const el = document.getElementById('nav-map');
  if (!el) return;
  navMap = L.map('nav-map', { zoomControl: true, attributionControl: false }).setView(KUCHING, 13);
  L.tileLayer(DARK_TILES, TILE_OPTS).addTo(navMap);
  L.marker(KUCHING, { icon: mkCarMarker() }).addTo(navMap).bindPopup('<b>You are here</b>');
  NAV_LOCATIONS.forEach((loc, i) => {
    L.marker(loc.pos, { icon: mkMarker('#00d4ff') }).addTo(navMap)
      .bindPopup(`<b>${loc.name}</b><br>${loc.dist} · ${loc.eta}`);
  });
  setTimeout(() => navMap.invalidateSize(), 120);
}

/* NAV ACTIVE MAP */
function initNavActiveMap(locationIdx) {
  const el = document.getElementById('nav-active-map');
  if (!el) return;
  const loc = NAV_LOCATIONS[locationIdx];

  if (navActiveMap) {
    navActiveMap.remove();
    navActiveMap = null;
  }

  navActiveMap = L.map('nav-active-map', { zoomControl: false, attributionControl: false })
    .setView(KUCHING, 14);
  L.tileLayer(DARK_TILES, TILE_OPTS).addTo(navActiveMap);

  L.marker(KUCHING, { icon: mkCarMarker() }).addTo(navActiveMap).bindPopup('<b>Your position</b>');
  L.marker(loc.pos, { icon: mkMarker('#ff5252', 16) }).addTo(navActiveMap).bindPopup(`<b>${loc.name}</b>`);
  L.polyline([KUCHING, loc.pos], { color: '#00d4ff', weight: 4, opacity: 0.85, dashArray: '8 4' }).addTo(navActiveMap);

  setTimeout(() => navActiveMap.invalidateSize(), 120);
}

/* CHARGING SELECT MAP */
function initChargingMap() {
  if (chargingMap) { setTimeout(() => chargingMap.invalidateSize(), 100); return; }
  const el = document.getElementById('charging-map');
  if (!el) return;
  chargingMap = L.map('charging-map', { zoomControl: false, attributionControl: false }).setView(KUCHING, 14);
  L.tileLayer(DARK_TILES, TILE_OPTS).addTo(chargingMap);
  L.marker(KUCHING, { icon: mkCarMarker() }).addTo(chargingMap).bindPopup('<b>Your position</b>');
  CHARGING_STATIONS.forEach(s => {
    L.marker(s.pos, { icon: mkMarker(s.color) }).addTo(chargingMap).bindPopup(`<b>${s.name}</b><br>${s.kw}`);
  });
  setTimeout(() => chargingMap.invalidateSize(), 120);
}

/* CHARGING ACTIVE MAP */
function initChargingActiveMap(idx) {
  const el = document.getElementById('charging-active-map');
  if (!el) return;
  const st = CHARGING_STATIONS[idx];
  if (chargingActiveMap) { chargingActiveMap.remove(); chargingActiveMap = null; }
  chargingActiveMap = L.map('charging-active-map', { zoomControl: false, attributionControl: false })
    .setView(KUCHING, 14);
  L.tileLayer(DARK_TILES, TILE_OPTS).addTo(chargingActiveMap);
  L.marker(KUCHING, { icon: mkCarMarker() }).addTo(chargingActiveMap);
  L.marker(st.pos, { icon: mkMarker(st.color, 16) }).addTo(chargingActiveMap).bindPopup(`<b>${st.name}</b>`);
  L.polyline([KUCHING, st.pos], { color: st.color, weight: 4, opacity: 0.8, dashArray: '8 4' }).addTo(chargingActiveMap);
  setTimeout(() => chargingActiveMap.invalidateSize(), 120);
}

/* ══ NAVIGATION LOCATION SELECT ══ */
function selectNavLocation(idx) {
  selectedLocation = idx;
  document.querySelectorAll('.location-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  if (navMap) {
    navMap.setView(NAV_LOCATIONS[idx].pos, 15, { animate: true });
  }
  const startBtn = document.getElementById('nav-start-btn');
  if (startBtn) { startBtn.disabled = false; startBtn.textContent = `Navigate to ${NAV_LOCATIONS[idx].name}`; }
}

function startNavigation() {
  if (selectedLocation === null) return;
  const loc = NAV_LOCATIONS[selectedLocation];
  const selectView = document.getElementById('nav-view-select');
  const activeView = document.getElementById('nav-view-active');
  if (selectView) selectView.classList.remove('active');
  if (activeView) activeView.classList.add('active');

  const instrEl = document.getElementById('nav-instruction-text');
  const etaEl = document.getElementById('nav-eta-text');
  const destEl = document.getElementById('nav-dest-name');
  if (instrEl) instrEl.textContent = `Head towards ${loc.name}`;
  if (etaEl) etaEl.innerHTML = `<span>${loc.eta}</span> · <span>${loc.dist}</span>`;
  if (destEl) destEl.textContent = loc.name;

  initNavActiveMap(selectedLocation);
}

function stopNavigation() {
  const selectView = document.getElementById('nav-view-select');
  const activeView = document.getElementById('nav-view-active');
  if (selectView) selectView.classList.add('active');
  if (activeView) activeView.classList.remove('active');
  selectedLocation = null;
  document.querySelectorAll('.location-item').forEach(el => el.classList.remove('active'));
  const startBtn = document.getElementById('nav-start-btn');
  if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'Select a destination'; }
}

/* ══ STATION SELECT ══ */
function selectStation(idx) {
  selectedStation = idx;
  document.querySelectorAll('.station-item').forEach((el, i) => el.classList.toggle('selected', i === idx));
  if (chargingMap) chargingMap.setView(CHARGING_STATIONS[idx].pos, 15, { animate: true });
  const navBtn = document.getElementById('station-nav-btn');
  if (navBtn) { navBtn.disabled = false; navBtn.textContent = `Navigate to ${CHARGING_STATIONS[idx].name}`; }
}

function startChargingNav() {
  if (selectedStation === null) return;
  const st = CHARGING_STATIONS[selectedStation];
  const selectView = document.getElementById('charging-view-select');
  const activeView = document.getElementById('charging-view-active');
  if (selectView) selectView.classList.remove('active');
  if (activeView) activeView.classList.add('active');

  const nameEl = document.getElementById('charging-dest-name');
  const distEl = document.getElementById('charging-eta-dist');
  if (nameEl) nameEl.textContent = st.name;
  if (distEl) distEl.innerHTML = `<span>${st.eta}</span> · <span>${st.dist}</span>`;

  initChargingActiveMap(selectedStation);
}

function stopChargingNav() {
  const selectView = document.getElementById('charging-view-select');
  const activeView = document.getElementById('charging-view-active');
  if (selectView) selectView.classList.add('active');
  if (activeView) activeView.classList.remove('active');
  selectedStation = null;
  document.querySelectorAll('.station-item').forEach(el => el.classList.remove('selected'));
}

/* ══ SETTINGS TOGGLES ══ */
function switchToggle(clicked) {
  const row = clicked.closest('.toggle-row');
  if (!row) return;
  row.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  clicked.classList.add('active');
}

/* ══ INIT ══ */
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initSliders();
  updateDial();
  loadTrack(0);
  selectMode('auto');
  updateClock();

  // Seed a couple of recent items on load for demo
  addToRecent('screen-music');
  addToRecent('screen-driving');
  addToRecent('screen-navigation');
  addToRecent('screen-climate-cabin');
});
