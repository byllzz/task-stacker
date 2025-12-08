// ---------- Utilities ----------
function pad(n) {
  return n < 10 ? '0' + n : n;
}
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ---------- Unified clock ----------
function showUnifiedTime() {
  const d = new Date();
  let h = d.getHours(),
    m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const time12 = pad(h) + ':' + pad(m) + ' ' + ampm;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const time24 = `${hh}:${mm}`;

  document.querySelectorAll('.clock').forEach(el => {
    if (!el) return;
    el.textContent = time12;
  });

  const c1 = document.getElementById('clockDisplay');
  if (c1) c1.textContent = time24;

  const c2 = document.querySelector('#todo-app .clock');
  if (c2) c2.textContent = time12;
}
setInterval(showUnifiedTime, 1000);
showUnifiedTime();

// ---------- Base DOM refs ----------
const todoHome = document.getElementById('todo-home');
const todoApp = document.getElementById('todo-app');
const addSection = document.getElementById('add-todo');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const openAddBtn =
  document.getElementById('openAddBtn') ||
  document.querySelector('.the-dock .add-btn') ||
  document.querySelector('.add-btn');
const closeAddBtn = document.getElementById('closeAddBtn');
const emptyAddBtn = document.getElementById('emptyAddBtn');
const aboutSection = document.getElementById('about-section');
const aboutBtn = document.querySelector('.the-dock button:last-child'); // user icon
const closeAboutBtn = document.getElementById('closeAboutBtn');
const aboutLink = document.getElementById('about-link');

// ---------- Ensure loader overlay is present ----------
(function ensureLoader() {
  let loader = document.getElementById('loader-overlay');
  if (loader) return;
  const wrapper = document.getElementById('todo-wrapper') || document.body;
  const div = document.createElement('div');
  div.id = 'loader-overlay';
  div.setAttribute('aria-hidden', 'true');
  div.className = 'loader-hidden';
  div.innerHTML = `
    <svg class="loader-svg" viewBox="0 0 50 50" role="img" aria-label="Loading">
      <circle class="loader-ring" cx="25" cy="25" r="20" fill="none" stroke-width="4"/>
      <path class="loader-head" d="M25 5 A20 20 0 0 1 45 25" fill="none" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `;
  // minimal inline fallback styles
  div.style.position = 'absolute';
  div.style.inset = '0';
  div.style.display = 'grid';
  div.style.placeItems = 'center';
  div.style.background = 'rgba(255,255,255,0.85)';
  div.style.zIndex = '999';
  div.style.transition = 'opacity 220ms ease';
  div.style.pointerEvents = 'none';
  div.style.opacity = '0';
  wrapper.insertBefore(div, wrapper.firstChild);
})();
const loader = document.getElementById('loader-overlay');

// ---------- Loader utility & navigation helper ----------
function showLoader(ms = 500) {
  if (!loader) return Promise.resolve();
  loader.setAttribute('aria-hidden', 'false');
  loader.classList.add('loader-visible');
  loader.style.pointerEvents = 'all';
  loader.style.opacity = '1';
  return new Promise(resolve => {
    setTimeout(() => {
      loader.classList.remove('loader-visible');
      loader.setAttribute('aria-hidden', 'true');
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
      setTimeout(resolve, 240);
    }, ms);
  });
}

/**
 * Navigate to a target section and hide others.
 */
async function navigate(target, opts = {}) {
  const duration = opts.duration ?? 420;
  await showLoader(duration);

  const sections = ['todo-home', 'todo-app', 'add-todo', 'about-section'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el === target) {
      el.style.display = 'flex';
      el.setAttribute('aria-hidden', 'false');
    } else {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    }
  });

  updateEmptyState && typeof updateEmptyState === 'function' && updateEmptyState();
  if (target && target.id === 'todo-app') {
    try {
      updateTodoAppMood(currentMood);
    } catch (e) {}
  }
}

// ---------- Screen toggles (loader-aware handlers) ----------
function replaceNodeAndGet(idOrNode) {
  let node = typeof idOrNode === 'string' ? document.getElementById(idOrNode) : idOrNode;
  if (!node) return null;
  try {
    const clone = node.cloneNode(true);
    node.parentNode.replaceChild(clone, node);
    return clone;
  } catch (e) {
    return node;
  }
}

// START button (home -> app)
if (startBtn && todoApp && todoHome) {
  const newStart = replaceNodeAndGet(startBtn);
  newStart.addEventListener('click', async () => {
    const moodCardsLocal = Array.from(document.querySelectorAll('.mood-card'));
    const selectedMood = moodCardsLocal.find(c => c.classList.contains('selected'));
    if (!selectedMood && typeof getRandomMoodIndex === 'function') {
      showMood(getRandomMoodIndex());
    }
    await navigate(todoApp, { duration: 420 });
  });
}

// BACK button (app -> home)
if (backBtn && todoApp && todoHome) {
  const newBack = replaceNodeAndGet(backBtn);
  newBack.addEventListener('click', async () => {
    await navigate(todoHome, { duration: 320 });
  });
}

// OPEN ADD (app -> add)
if (openAddBtn && addSection && todoApp) {
  const newOpen = replaceNodeAndGet(openAddBtn);
  newOpen.addEventListener('click', async () => {
    await navigate(addSection, { duration: 380 });
  });
}

// CLOSE ADD (add -> app)
if (closeAddBtn && addSection && todoApp) {
  const newClose = replaceNodeAndGet(closeAddBtn);
  newClose.addEventListener('click', async () => {
    await navigate(todoApp, { duration: 320 });
  });
}

// EMPTY STATE ADD button (home/app -> add)
if (emptyAddBtn && addSection && todoApp) {
  const newEmpty = replaceNodeAndGet(emptyAddBtn);
  newEmpty.addEventListener('click', async () => {
    await navigate(addSection, { duration: 380 });
  });
}

// ABOUT button (app -> about)
if (aboutBtn && aboutSection && todoApp) {
  const newAboutBtn = replaceNodeAndGet(aboutBtn);
  newAboutBtn.addEventListener('click', async () => {
    await navigate(aboutSection, { duration: 380 });
  });
}

// CLOSE ABOUT (about -> app)
if (closeAboutBtn && aboutSection && todoApp) {
  const newCloseAbout = replaceNodeAndGet(closeAboutBtn);
  newCloseAbout.addEventListener('click', async () => {
    await navigate(todoApp, { duration: 320 });
  });
}

// ABOUT link inside home (home -> about)
if (aboutLink && aboutSection) {
  const newAboutLink = replaceNodeAndGet(aboutLink);
  newAboutLink.addEventListener('click', async e => {
    e.preventDefault();
    await navigate(aboutSection, { duration: 380 });
  });
}

// ---------- Mood slider ----------
const moodsTrack = document.querySelector('.moods-track');
const moodCards = Array.from(document.querySelectorAll('.mood-card'));
const moodButtons = Array.from(document.querySelectorAll('.mood-buttons button'));
let currentMood = 0;
const moodCount = moodCards.length || 1;
const cycleDelay = 250000; // kept (not used to auto-restart after stop)
let moodTimer = null;
let autoCycleStopped = false; // indicates auto-cycle has been disabled after timeout
let autoStopTimer = null; // holds the timeout that stops auto-cycle

if (moodsTrack) moodsTrack.style.transition = 'transform 0.5s ease-in-out';

const userMoodWrapper = document.querySelector('.user-mood');
let moodDisplay = null;
if (userMoodWrapper) {
  moodDisplay = document.createElement('div');
  moodDisplay.classList.add('active-mood-display');
  userMoodWrapper.appendChild(moodDisplay);
}

function updateTodoAppMood(index) {
  const moodCard = moodCards[index];
  if (!moodCard || !moodDisplay) return;
  const moodName = moodCard.dataset.mood || 'unknown';
  moodDisplay.textContent = `Mood: ${moodName}`;
}

function getRandomMoodIndex() {
  return Math.floor(Math.random() * moodCount);
}

function updateMoodButtons() {
  moodButtons.forEach((btn, i) => btn.classList.toggle('active', i === currentMood));
}

function showMood(index) {
  if (!moodsTrack) return;
  currentMood = (index + moodCount) % moodCount;
  const translateX = -currentMood * 100;
  moodsTrack.style.transform = `translateX(${translateX}%)`;
  moodCards.forEach((card, i) =>
    card.setAttribute('aria-hidden', i === currentMood ? 'false' : 'true'),
  );
  moodCards.forEach((c, i) =>
    i === currentMood ? c.classList.add('selected') : c.classList.remove('selected'),
  );
  updateMoodButtons();
  updateTodoAppMood(currentMood);
}

// Start auto cycle but automatically stop it after 25 seconds and prevent restarts
function startMoodCycle() {
  // if already stopped permanently, do nothing
  if (autoCycleStopped) return;
  clearInterval(moodTimer);
  moodTimer = setInterval(() => showMood(currentMood + 1), cycleDelay);

  // clear any previous auto-stop timer
  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }

  // stop the automatic cycling after 25 seconds (25000 ms)
  autoStopTimer = setTimeout(() => {
    clearInterval(moodTimer);
    moodTimer = null;
    autoCycleStopped = true; // prevent future restarts
  }, 25000);
}

// initialize mood display and start cycle (which will self-stop after 25s)
showMood(0);
startMoodCycle();

const wrapper = document.querySelector('.the-moods-wrapper');
if (wrapper) {
  wrapper.addEventListener('mouseenter', () => {
    // pause only if auto cycling is active
    if (moodTimer) clearInterval(moodTimer);
  });
  wrapper.addEventListener('mouseleave', () => {
    // restart only if auto-cycle hasn't been permanently stopped
    if (!autoCycleStopped) startMoodCycle();
  });
}

moodButtons.forEach(btn =>
  btn.addEventListener('click', () => showMood(parseInt(btn.dataset.index, 10))),
);

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') showMood(currentMood - 1);
  if (e.key === 'ArrowRight') showMood(currentMood + 1);
});

// ---------- Pupil follow & idle nudge ----------
const eyeElements = document.querySelectorAll('.left-eye, .right-eye');
document.addEventListener('mousemove', e => {
  eyeElements.forEach(eye => {
    const pupil = eye.querySelector('.pupil');
    if (!pupil) return;
    const rect = eye.getBoundingClientRect();
    const angle = Math.atan2(
      e.clientY - (rect.top + rect.height / 2),
      e.clientX - (rect.left + rect.width / 2),
    );
    const maxMove = Math.min(rect.width, rect.height) * 0.18;
    pupil.style.transform = `translate(calc(-50% + ${Math.cos(angle) * maxMove}px), calc(-50% + ${
      Math.sin(angle) * maxMove
    }px))`;
  });
});

let idleTimer = null;
function randomNudge() {
  eyeElements.forEach(eye => {
    const pupil = eye.querySelector('.pupil');
    if (!pupil) return;
    const wiggle = 3;
    const rx = (Math.random() * 2 - 1) * wiggle;
    const ry = (Math.random() * 2 - 1) * wiggle;
    pupil.style.transform = `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px))`;
  });
}

document.addEventListener('mousemove', () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => randomNudge(), 1500);
});

// ---------- Touch & wheel for moods ----------
let startX = null;
if (moodsTrack) {
  moodsTrack.addEventListener('touchstart', e => (startX = e.touches[0].clientX));
  moodsTrack.addEventListener('touchmove', e => {
    if (startX === null) return;
    const dx = e.touches[0].clientX - startX;
    if (dx > 40) showMood(currentMood - 1);
    else if (dx < -40) showMood(currentMood + 1);
    startX = null;
  });
  moodsTrack.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.deltaY > 0) showMood(currentMood + 1);
    else if (e.deltaY < 0) showMood(currentMood - 1);
  });
}

// ---------- Category chips behavior ----------
document.querySelectorAll('#categoryRow .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#categoryRow .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

// ---------- Reminder switch ----------
const remindSwitch = document.getElementById('remindSwitch');
let remindOn = false;
if (remindSwitch) {
  remindSwitch.addEventListener('click', () => {
    remindOn = !remindOn;
    remindSwitch.classList.toggle('on', remindOn);
  });
}

// ---------- Stacked UI & task management ----------
function generatePastelColor(seed) {
  const hue = seed != null ? (seed * 47) % 360 : Math.floor(Math.random() * 360);
  const sat = 70;
  const light = 88;
  const bg = `hsl(${hue} ${sat}% ${light}%)`;
  const text = `rgba(0,0,0,0.85)`;
  return { bg, text };
}

function buildTaskCard({ name, date, start, end, cat }, idx) {
  const { bg, text } = generatePastelColor(idx);
  const card = document.createElement('div');
  card.className = 'task-card';
  card.setAttribute('tabindex', '0');
  card.style.background = bg;
  card.style.color = text;

  card.innerHTML = `
    <div class="row-top">
      <div>
        <div class="title">${escapeHtml(name)}</div>
        <div class="meta">${escapeHtml(cat)} • ${date ? date : 'No date'} ${
    start || end ? `• ${start || ''}${end ? ' - ' + end : ''}` : ''
  }</div>
      </div>
    </div>
    <div class="row-bottom">
      <div class="chip">${escapeHtml(cat)}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="mark-done-btn" aria-label="Mark done" style="background:transparent;border:none;font-weight:700">Done</button>
        <button class="delete-btn" aria-label="Delete" style="background:transparent;border:none;color:#c0392b;font-weight:700">Delete</button>
      </div>
    </div>
  `;

  const markBtn = card.querySelector('.mark-done-btn');
  const delBtn = card.querySelector('.delete-btn');

  markBtn &&
    markBtn.addEventListener('click', e => {
      e.stopPropagation();
      card.style.opacity = '0.5';
      card.style.textDecoration = 'line-through';
    });

  delBtn &&
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      card.remove();
      updateEmptyState();
    });

  return card;
}

const todoContainer =
  document.getElementById('todoContent') || document.querySelector('.todo-content');
let focusedCardIndex = -1;

function getCardIndex(card) {
  const container = todoContainer;
  return Array.from(container.querySelectorAll('.task-card')).indexOf(card);
}

function scrollToCardIndex(container, index) {
  const cards = Array.from(container.querySelectorAll('.task-card'));
  if (!cards.length) return;
  const clamped = Math.max(0, Math.min(index, cards.length - 1));
  const card = cards[clamped];
  const containerRect = container.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const currentScroll = container.scrollTop;
  const targetScroll = currentScroll + (cardRect.top - containerRect.top) - 18;
  container.scrollTo({ top: targetScroll, behavior: 'smooth' });
  setTimeout(() => card.focus(), 240);
  focusedCardIndex = clamped;
}

const createBtn = document.getElementById('createTaskBtn');

function updateEmptyState() {
  const empty = document.getElementById('emptyState');
  const hasTasks = todoContainer && todoContainer.querySelectorAll('.task-card').length > 0;
  if (empty) empty.style.display = hasTasks ? 'none' : 'flex';
}

if (createBtn && todoContainer) {
  createBtn.addEventListener('click', ev => {
    ev.preventDefault?.();
    const name = (document.getElementById('taskName')?.value || '').trim();
    if (!name) {
      alert('Please enter a task name');
      return;
    }

    const card = buildTaskCard(
      {
        name,
        date: document.getElementById('taskDate')?.value || '',
        start: document.getElementById('startTime')?.value || '',
        end: document.getElementById('endTime')?.value || '',
        cat: document.querySelector('#categoryRow .chip.active')?.dataset.cat || 'General',
      },
      todoContainer.querySelectorAll('.task-card').length,
    );

    todoContainer.prepend(card);
    updateEmptyState();

    if (closeAddBtn) {
      const closeBtnNode = document.getElementById('closeAddBtn') || closeAddBtn;
      if (closeBtnNode) closeBtnNode.click?.();
    } else if (typeof resetForm === 'function') {
      resetForm();
    }
  });
}

// ---------- Keyboard navigation ----------
document.addEventListener('keydown', e => {
  const active = document.activeElement;
  const isTyping =
    active &&
    (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
  if (isTyping) return;
  if (!todoContainer) return;
  const cards = Array.from(todoContainer.querySelectorAll('.task-card'));
  if (!cards.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = focusedCardIndex < 0 ? 0 : Math.min(cards.length - 1, focusedCardIndex + 1);
    scrollToCardIndex(todoContainer, next);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = focusedCardIndex <= 0 ? 0 : Math.max(0, focusedCardIndex - 1);
    scrollToCardIndex(todoContainer, prev);
  } else if (e.key === 'PageDown') {
    e.preventDefault();
    scrollToCardIndex(todoContainer, Math.min(cards.length - 1, focusedCardIndex + 3));
  } else if (e.key === 'PageUp') {
    e.preventDefault();
    scrollToCardIndex(todoContainer, Math.max(0, focusedCardIndex - 3));
  }
});

if (todoContainer) {
  todoContainer.addEventListener('click', ev => {
    const card = ev.target.closest('.task-card');
    if (card) {
      const idx = getCardIndex(card);
      scrollToCardIndex(todoContainer, idx);
    }
  });
}

// ---------- Reset form ----------
function resetForm() {
  const tn = document.getElementById('taskName');
  if (tn) tn.value = '';
  const td = document.getElementById('taskDate');
  if (td) td.value = '';
  const st = document.getElementById('startTime');
  if (st) st.value = '';
  const et = document.getElementById('endTime');
  if (et) et.value = '';
  document
    .querySelectorAll('#categoryRow .chip')
    .forEach((c, i) => c.classList.toggle('active', i === 0));
  remindOn = false;
  if (remindSwitch) remindSwitch.classList.remove('on');
}

// ---------- Initial UI ----------
if (todoHome) {
  todoHome.style.display = 'flex';
  todoHome.setAttribute('aria-hidden', 'false');
}
if (todoApp) {
  todoApp.style.display = 'none';
  todoApp.setAttribute('aria-hidden', 'true');
}
if (addSection) {
  addSection.style.display = 'none';
  addSection.setAttribute('aria-hidden', 'true');
}
if (aboutSection) {
  aboutSection.style.display = 'none';
  aboutSection.setAttribute('aria-hidden', 'true');
}
updateEmptyState();

// ---------- Ensure loader styles exist ----------
(function ensureLoaderStyles() {
  if (!loader) return;
  if (!document.getElementById('todo-loader-styles')) {
    const style = document.createElement('style');
    style.id = 'todo-loader-styles';
    style.textContent = `
      #loader-overlay { visibility: visible; }
      .loader-svg { width:72px; height:72px; display:block }
      .loader-ring { stroke: rgba(0,0,0,0.12); stroke-width:4; }
      .loader-head { stroke: rgba(0,0,0,0.9); stroke-width:4; stroke-linecap:round; stroke-dasharray:60; transform-origin:50% 50%; animation: loader-rotate 1s linear infinite, head-dash 1s ease-in-out infinite; }
      @keyframes loader-rotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      @keyframes head-dash { 0%{stroke-dashoffset:60} 50%{stroke-dashoffset:15} 100%{stroke-dashoffset:60} }
    `;
    document.head.appendChild(style);
  }
})();

// ----------Instructions Panel Logic------------

const instructionsMenu = document.querySelector('.instructions-menu');
const instructionsToggle = document.getElementById('instructionsToggle');

function handleInstructionsUI() {
  if (window.innerWidth < 768) {
    if (instructionsMenu) instructionsMenu.classList.remove('active');
  } else {
    if (instructionsMenu) instructionsMenu.classList.add('active');
  }
}

// toggle on small screens
if (instructionsToggle && instructionsMenu) {
  instructionsToggle.addEventListener('click', () => {
    instructionsMenu.classList.toggle('active');
  });
}

// run on load
handleInstructionsUI();

// run on resize
window.addEventListener('resize', handleInstructionsUI);

// ---------- End of script ----------
