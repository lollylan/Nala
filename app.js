// ==========================================
// NALA TRACKER – App Logic
// ==========================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import {
  getFirestore, doc, setDoc, onSnapshot,
  collection, query, where, getDocs
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

// ==========================================
// FIREBASE SETUP
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyCQmOJrMpv34xyh7cWgqbX_L8hL_sI3C_4",
  authDomain: "nala-tracker-95f94.firebaseapp.com",
  projectId: "nala-tracker-95f94",
  storageBucket: "nala-tracker-95f94.firebasestorage.app",
  messagingSenderId: "293623820181",
  appId: "1:293623820181:web:e70ffa1c9a62445cbfd09c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// STATE
// ==========================================

let currentUser = localStorage.getItem('nala-user');
let currentDate = todayStr();
let currentView = 'today';
let currentMonthDate = new Date();
let currentStatMonth = new Date();
let dayData = null;
let unsubDay = null;

// ==========================================
// HELPERS
// ==========================================

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function nowTime() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDateDisplay(dateStr) {
  const today = todayStr();
  if (dateStr === today) return 'Heute';
  const d = new Date(dateStr + 'T12:00:00');
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Gestern';
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

function defaultDay(date) {
  return {
    date,
    tablet: { given: false, time: null, by: null },
    feeding: {
      morning: { done: false, time: null, by: null },
      evening: { done: false, time: null, by: null }
    },
    poops: []
  };
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const CONSISTENCY_LABELS = {
  fest: 'Fest',
  normal: 'Normal',
  weich: 'Weich',
  breiig: 'Breiig',
  fluessig: 'Flüssig'
};

// ==========================================
// DOM REFERENCES
// ==========================================

const $userScreen = document.getElementById('screen-user');
const $appScreen = document.getElementById('screen-app');
const $switchUser = document.getElementById('btn-switch-user');
const $displayDate = document.getElementById('display-date');
const $poopCount = document.getElementById('poop-count');
const $poopList = document.getElementById('poop-list');
const $poopModal = document.getElementById('poop-modal');
const $monthGrid = document.getElementById('month-grid');
const $displayMonth = document.getElementById('display-month');
const $displayStatMonth = document.getElementById('display-stat-month');
const $statsContent = document.getElementById('stats-content');

// ==========================================
// INITIALIZATION
// ==========================================

function init() {
  if (!currentUser) {
    showScreen('user');
  } else {
    startApp();
  }
  setupEventListeners();
}

function showScreen(name) {
  $userScreen.classList.toggle('hidden', name !== 'user');
  $appScreen.classList.toggle('hidden', name !== 'app');
}

function startApp() {
  showScreen('app');
  $switchUser.textContent = currentUser;
  subscribeToDay(currentDate);
  updateDateDisplay();
}

// ==========================================
// USER MANAGEMENT
// ==========================================

function selectUser(name) {
  currentUser = name;
  localStorage.setItem('nala-user', name);
  startApp();
}

function switchUser() {
  currentUser = currentUser === 'Florian' ? 'Eva' : 'Florian';
  localStorage.setItem('nala-user', currentUser);
  $switchUser.textContent = currentUser;
}

// ==========================================
// DATE NAVIGATION
// ==========================================

function changeDay(offset) {
  const d = new Date(currentDate + 'T12:00:00');
  d.setDate(d.getDate() + offset);
  currentDate = d.toISOString().split('T')[0];
  subscribeToDay(currentDate);
  updateDateDisplay();
}

function updateDateDisplay() {
  $displayDate.textContent = formatDateDisplay(currentDate);
}

// ==========================================
// FIRESTORE – REALTIME LISTENER
// ==========================================

function subscribeToDay(date) {
  if (unsubDay) unsubDay();
  const docRef = doc(db, 'days', date);
  unsubDay = onSnapshot(docRef, (snap) => {
    dayData = snap.exists() ? snap.data() : defaultDay(date);
    // Sicherstellen dass alle Felder existieren
    if (!dayData.tablet) dayData.tablet = { given: false, time: null, by: null };
    if (!dayData.feeding) dayData.feeding = {};
    if (!dayData.feeding.morning) dayData.feeding.morning = { done: false, time: null, by: null };
    if (!dayData.feeding.evening) dayData.feeding.evening = { done: false, time: null, by: null };
    if (!dayData.poops) dayData.poops = [];
    renderToday();
  }, (error) => {
    console.error('Firestore Fehler:', error);
  });
}

async function saveDay(data) {
  const docRef = doc(db, 'days', currentDate);
  await setDoc(docRef, data, { merge: true });
}

// ==========================================
// TOGGLE ACTIONS
// ==========================================

async function toggleTablet() {
  const t = dayData.tablet;
  if (t.given) {
    await saveDay({ tablet: { given: false, time: null, by: null } });
  } else {
    await saveDay({ tablet: { given: true, time: nowTime(), by: currentUser } });
  }
}

async function toggleFeeding(meal) {
  const f = dayData.feeding[meal];
  if (f.done) {
    await saveDay({ feeding: { [meal]: { done: false, time: null, by: null } } });
  } else {
    await saveDay({ feeding: { [meal]: { done: true, time: nowTime(), by: currentUser } } });
  }
}

// ==========================================
// POOP ACTIONS
// ==========================================

function openPoopModal() {
  $poopModal.classList.remove('hidden');
}

function closePoopModal() {
  $poopModal.classList.add('hidden');
}

async function addPoop(consistency) {
  closePoopModal();
  const poops = [...dayData.poops, {
    id: uid(),
    time: nowTime(),
    consistency,
    by: currentUser
  }];
  await saveDay({ date: currentDate, poops });
}

async function removePoop(id) {
  const poops = dayData.poops.filter(p => p.id !== id);
  await saveDay({ date: currentDate, poops });
}

// ==========================================
// RENDER – TODAY VIEW
// ==========================================

function renderToday() {
  if (!dayData) return;

  // Tablette
  renderCard('card-tablet', 'toggle-tablet', 'meta-tablet', dayData.tablet.given, dayData.tablet);

  // Futter morgens
  renderCard('card-morning', 'toggle-morning', 'meta-morning', dayData.feeding.morning.done, dayData.feeding.morning);

  // Futter abends
  renderCard('card-evening', 'toggle-evening', 'meta-evening', dayData.feeding.evening.done, dayData.feeding.evening);

  // Haufen
  $poopCount.textContent = dayData.poops.length;
  renderPoopList();
}

function renderCard(cardId, toggleId, metaId, isDone, data) {
  const card = document.getElementById(cardId);
  card.classList.toggle('done', isDone);
  const meta = document.getElementById(metaId);
  if (isDone && data.time) {
    meta.textContent = `${data.time} Uhr · ${data.by || ''}`;
  } else {
    meta.textContent = '';
  }
}

function renderPoopList() {
  if (dayData.poops.length === 0) {
    $poopList.innerHTML = '<div style="text-align:center;color:#888;padding:12px;font-size:0.9rem">Noch kein Haufen eingetragen</div>';
    return;
  }
  $poopList.innerHTML = dayData.poops.map(p => `
    <div class="poop-entry">
      <span class="poop-time">${p.time}</span>
      <span class="poop-consistency">
        <span class="dot dot-${p.consistency}"></span>
        ${CONSISTENCY_LABELS[p.consistency] || p.consistency}
      </span>
      <span class="poop-by">${p.by || ''}</span>
      <button class="poop-delete" data-id="${p.id}" title="Löschen">✕</button>
    </div>
  `).join('');
}

// ==========================================
// MONTH VIEW
// ==========================================

function monthStr(date) {
  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

function changeMonth(offset) {
  currentMonthDate.setMonth(currentMonthDate.getMonth() + offset);
  loadMonth();
}

async function loadMonth() {
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  $displayMonth.textContent = monthStr(currentMonthDate);

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

  const q = query(
    collection(db, 'days'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );

  const snap = await getDocs(q);
  const data = {};
  snap.forEach(d => { data[d.id] = d.data(); });

  renderMonth(year, month, data);
}

function renderMonth(year, month, data) {
  const today = todayStr();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  // Montag = 0
  let startWeekday = (firstDay.getDay() + 6) % 7;

  const headers = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  let html = headers.map(h => `<div class="month-header">${h}</div>`).join('');

  // Leere Zellen
  for (let i = 0; i < startWeekday; i++) {
    html += '<div class="month-day empty"></div>';
  }

  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = data[dateStr];
    const isToday = dateStr === today;
    const isFuture = dateStr > today;

    let icons = '';
    let allDone = false;

    if (d) {
      const tablet = d.tablet?.given ? '💊' : '';
      const morning = d.feeding?.morning?.done ? '🌅' : '';
      const evening = d.feeding?.evening?.done ? '🌙' : '';
      const poops = d.poops?.length ? `💩${d.poops.length > 1 ? d.poops.length : ''}` : '';
      icons = `${tablet}${morning}${evening}${poops}`;
      allDone = d.tablet?.given && d.feeding?.morning?.done && d.feeding?.evening?.done;
    }

    const classes = ['month-day'];
    if (isToday) classes.push('today');
    if (isFuture) classes.push('future');
    if (allDone) classes.push('all-done');

    html += `
      <div class="${classes.join(' ')}" data-date="${dateStr}">
        <span class="month-day-number">${day}</span>
        <span class="month-day-icons">${icons}</span>
      </div>`;
  }

  $monthGrid.innerHTML = html;
}

// ==========================================
// STATS VIEW
// ==========================================

function changeStatMonth(offset) {
  currentStatMonth.setMonth(currentStatMonth.getMonth() + offset);
  loadStats();
}

async function loadStats() {
  const year = currentStatMonth.getFullYear();
  const month = currentStatMonth.getMonth();
  $displayStatMonth.textContent = monthStr(currentStatMonth);

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

  const q = query(
    collection(db, 'days'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );

  const snap = await getDocs(q);
  const days = [];
  snap.forEach(d => days.push(d.data()));

  renderStats(days, year, month);
}

function renderStats(days, year, month) {
  if (days.length === 0) {
    $statsContent.innerHTML = '<div class="stat-empty">Keine Daten für diesen Monat</div>';
    return;
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const totalDays = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();

  // Tabletten
  const tabletDays = days.filter(d => d.tablet?.given).length;
  const tabletPct = Math.round((tabletDays / totalDays) * 100);

  // Fütterung
  const morningDays = days.filter(d => d.feeding?.morning?.done).length;
  const eveningDays = days.filter(d => d.feeding?.evening?.done).length;
  const morningPct = Math.round((morningDays / totalDays) * 100);
  const eveningPct = Math.round((eveningDays / totalDays) * 100);

  // Haufen
  const allPoops = days.flatMap(d => d.poops || []);
  const totalPoops = allPoops.length;
  const daysWithPoops = days.filter(d => d.poops?.length > 0).length;
  const avgPoops = daysWithPoops > 0 ? (totalPoops / daysWithPoops).toFixed(1) : '0';

  // Konsistenz-Verteilung
  const consCounts = { fest: 0, normal: 0, weich: 0, breiig: 0, fluessig: 0 };
  allPoops.forEach(p => {
    if (consCounts[p.consistency] !== undefined) consCounts[p.consistency]++;
  });

  // Wer hat mehr gemacht?
  const byUser = { Florian: 0, Eva: 0 };
  days.forEach(d => {
    if (d.tablet?.by) byUser[d.tablet.by] = (byUser[d.tablet.by] || 0) + 1;
    if (d.feeding?.morning?.by) byUser[d.feeding.morning.by] = (byUser[d.feeding.morning.by] || 0) + 1;
    if (d.feeding?.evening?.by) byUser[d.feeding.evening.by] = (byUser[d.feeding.evening.by] || 0) + 1;
    (d.poops || []).forEach(p => {
      if (p.by) byUser[p.by] = (byUser[p.by] || 0) + 1;
    });
  });
  const totalActions = (byUser.Florian || 0) + (byUser.Eva || 0);
  const florianPct = totalActions > 0 ? Math.round(((byUser.Florian || 0) / totalActions) * 100) : 50;

  let html = '';

  // Tabletten-Quote
  html += `
    <div class="stat-card">
      <h4>💊 Tabletten-Quote</h4>
      <span class="stat-value">${tabletPct}%</span>
      <span class="stat-sub"> · ${tabletDays} von ${totalDays} Tagen</span>
      <div class="stat-progress"><div class="stat-progress-fill" style="width:${tabletPct}%"></div></div>
    </div>`;

  // Fütterung
  html += `
    <div class="stat-card">
      <h4>🍽️ Fütterung</h4>
      <div class="stat-bar-container">
        <div class="stat-bar-row">
          <span class="stat-bar-label">🌅 Morgens</span>
          <div class="stat-bar-track"><div class="stat-bar-fill normal" style="width:${morningPct}%"></div></div>
          <span class="stat-bar-value">${morningPct}%</span>
        </div>
        <div class="stat-bar-row">
          <span class="stat-bar-label">🌙 Abends</span>
          <div class="stat-bar-track"><div class="stat-bar-fill normal" style="width:${eveningPct}%"></div></div>
          <span class="stat-bar-value">${eveningPct}%</span>
        </div>
      </div>
    </div>`;

  // Haufen-Statistik
  html += `
    <div class="stat-card">
      <h4>💩 Haufen</h4>
      <span class="stat-value">${avgPoops}</span>
      <span class="stat-sub"> pro Tag (∅) · ${totalPoops} gesamt</span>
    </div>`;

  // Konsistenz
  if (totalPoops > 0) {
    html += `<div class="stat-card"><h4>📊 Konsistenz-Verteilung</h4><div class="stat-bar-container">`;
    for (const [key, count] of Object.entries(consCounts)) {
      if (count === 0) continue;
      const pct = Math.round((count / totalPoops) * 100);
      html += `
        <div class="stat-bar-row">
          <span class="stat-bar-label">${CONSISTENCY_LABELS[key]}</span>
          <div class="stat-bar-track"><div class="stat-bar-fill ${key}" style="width:${pct}%"></div></div>
          <span class="stat-bar-value">${count}×</span>
        </div>`;
    }
    html += '</div></div>';
  }

  // Team-Statistik
  html += `
    <div class="stat-card">
      <h4>👫 Team-Einsatz</h4>
      <div class="stat-bar-container">
        <div class="stat-bar-row">
          <span class="stat-bar-label">Florian</span>
          <div class="stat-bar-track"><div class="stat-bar-fill normal" style="width:${florianPct}%"></div></div>
          <span class="stat-bar-value">${florianPct}%</span>
        </div>
        <div class="stat-bar-row">
          <span class="stat-bar-label">Eva</span>
          <div class="stat-bar-track"><div class="stat-bar-fill weich" style="width:${100 - florianPct}%"></div></div>
          <span class="stat-bar-value">${100 - florianPct}%</span>
        </div>
      </div>
    </div>`;

  $statsContent.innerHTML = html;
}

// ==========================================
// VIEW SWITCHING
// ==========================================

function switchView(view) {
  currentView = view;
  document.getElementById('view-today').classList.toggle('hidden', view !== 'today');
  document.getElementById('view-month').classList.toggle('hidden', view !== 'month');
  document.getElementById('view-stats').classList.toggle('hidden', view !== 'stats');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  if (view === 'month') loadMonth();
  if (view === 'stats') loadStats();
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
  // User selection
  document.querySelectorAll('.btn-user').forEach(btn => {
    btn.addEventListener('click', () => selectUser(btn.dataset.user));
  });

  // Switch user
  $switchUser.addEventListener('click', switchUser);

  // Date navigation
  document.getElementById('btn-prev-day').addEventListener('click', () => changeDay(-1));
  document.getElementById('btn-next-day').addEventListener('click', () => changeDay(1));

  // Card toggles
  document.getElementById('card-tablet').addEventListener('click', toggleTablet);
  document.getElementById('card-morning').addEventListener('click', () => toggleFeeding('morning'));
  document.getElementById('card-evening').addEventListener('click', () => toggleFeeding('evening'));

  // Poop
  document.getElementById('btn-add-poop').addEventListener('click', openPoopModal);
  document.getElementById('btn-cancel-poop').addEventListener('click', closePoopModal);
  document.querySelector('.modal-backdrop').addEventListener('click', closePoopModal);

  document.querySelectorAll('.btn-consistency').forEach(btn => {
    btn.addEventListener('click', () => addPoop(btn.dataset.value));
  });

  // Poop delete (delegated)
  $poopList.addEventListener('click', (e) => {
    const btn = e.target.closest('.poop-delete');
    if (btn) removePoop(btn.dataset.id);
  });

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Month navigation
  document.getElementById('btn-prev-month').addEventListener('click', () => changeMonth(-1));
  document.getElementById('btn-next-month').addEventListener('click', () => changeMonth(1));

  // Stats navigation
  document.getElementById('btn-prev-stat-month').addEventListener('click', () => changeStatMonth(-1));
  document.getElementById('btn-next-stat-month').addEventListener('click', () => changeStatMonth(1));

  // Month day click → jump to that day
  $monthGrid.addEventListener('click', (e) => {
    const dayEl = e.target.closest('.month-day:not(.empty)');
    if (dayEl && dayEl.dataset.date && dayEl.dataset.date <= todayStr()) {
      currentDate = dayEl.dataset.date;
      updateDateDisplay();
      subscribeToDay(currentDate);
      switchView('today');
    }
  });
}

// ==========================================
// START
// ==========================================

init();
