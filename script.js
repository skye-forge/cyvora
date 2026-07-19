/**
 * VARNIS Demo — router & controls.
 *
 * Handles navigation between screens (click + keyboard), sidebar
 * highlighting, back-history, and auto-play mode for presentations.
 */

const router = {
  current: 'splash',
  history: [],

  go(screen, pushHistory = true) {
    if (screen === this.current) return;
    if (pushHistory) this.history.push(this.current);
    this.current = screen;
    this.render();
  },

  back() {
    if (this.history.length === 0) return;
    this.current = this.history.pop();
    this.render();
  },

  reset() {
    this.history = [];
    this.current = 'splash';
    this.render();
  },

  render() {
    // Toggle .active on screens
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.toggle('active', s.dataset.screen === this.current);
    });
    // Highlight in the sidebar
    document.querySelectorAll('.index-item').forEach(item => {
      item.classList.toggle('current', item.dataset.nav === this.current);
    });
    // Scroll sidebar so the current item is visible
    const currentItem = document.querySelector('.index-item.current');
    if (currentItem) {
      currentItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    // Reset the scroll position inside the phone screen body
    const activeScreen = document.querySelector('.screen.active .screen-body');
    if (activeScreen) activeScreen.scrollTop = 0;
  },
};

/* ============================================================ Click handling */

// Delegate all clicks — buttons with data-goto navigate, data-back go back.
document.addEventListener('click', (e) => {
  // Ignore clicks on inputs (typing shouldn't navigate)
  if (e.target.matches('input, textarea')) return;

  const goto = e.target.closest('[data-goto]');
  if (goto) {
    // Only nav on user-intent clicks — inputs inside are ignored
    if (e.target.matches('input, textarea')) return;
    e.preventDefault();
    router.go(goto.dataset.goto);
    stopAutoPlay();
    return;
  }

  const back = e.target.closest('[data-back]');
  if (back) {
    e.preventDefault();
    router.back();
    stopAutoPlay();
    return;
  }

  const nav = e.target.closest('[data-nav]');
  if (nav) {
    e.preventDefault();
    router.go(nav.dataset.nav);
    stopAutoPlay();
    return;
  }
});

/* ============================================================ Auto-play mode */

// The pitch flow — walks through the core value proposition.
const PITCH_SEQUENCE = [
  'splash',
  'signin',
  'kyc-intro',
  'kyc-approved',
  'dashboard',
  'recovery-home',
  'ownership',
  'category',
  'device-form',
  'review',
  'payment',
  'case-detail',
  'imei-check',
  'support',
  'ticket-detail',
];

const AUTO_PLAY_INTERVAL = 3200; // ms per screen
let autoPlayTimer = null;
let autoPlayIndex = 0;

function startAutoPlay() {
  autoPlayIndex = 0;
  router.reset();
  document.getElementById('playing-badge').classList.add('show');
  advanceAutoPlay();
}

function advanceAutoPlay() {
  const screen = PITCH_SEQUENCE[autoPlayIndex % PITCH_SEQUENCE.length];
  router.go(screen, false); // don't push to history during autoplay
  autoPlayIndex++;
  autoPlayTimer = setTimeout(advanceAutoPlay, AUTO_PLAY_INTERVAL);
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = null;
  }
  document.getElementById('playing-badge').classList.remove('show');
}

/* ============================================================ Control buttons */

document.getElementById('btn-play').addEventListener('click', () => {
  if (autoPlayTimer) stopAutoPlay();
  else startAutoPlay();
});
document.getElementById('btn-reset').addEventListener('click', () => {
  stopAutoPlay();
  router.reset();
});
document.getElementById('btn-back').addEventListener('click', () => {
  stopAutoPlay();
  router.back();
});

/* ============================================================ Keyboard */

document.addEventListener('keydown', (e) => {
  // Don't interfere when typing
  if (e.target.matches('input, textarea')) return;

  switch (e.key) {
    case ' ':
      e.preventDefault();
      if (autoPlayTimer) stopAutoPlay();
      else startAutoPlay();
      break;
    case 'ArrowLeft':
    case 'Backspace':
      e.preventDefault();
      stopAutoPlay();
      router.back();
      break;
    case 'ArrowRight':
      e.preventDefault();
      // Advance to next screen in pitch sequence
      stopAutoPlay();
      const idx = PITCH_SEQUENCE.indexOf(router.current);
      const next = PITCH_SEQUENCE[(idx + 1) % PITCH_SEQUENCE.length];
      router.go(next);
      break;
    case 'Escape':
      stopAutoPlay();
      break;
    case 'r':
    case 'R':
      stopAutoPlay();
      router.reset();
      break;
  }
});

/* ============================================================ Initial */

// Set the initial sidebar highlight.
router.render();
