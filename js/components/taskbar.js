/**
 * Taskbar component — start button, window buttons, system tray clock.
 */
import { bus } from '../pubsub.js';

export function initTaskbar() {
  const taskbar = document.getElementById('taskbar');
  if (!taskbar) return;

  // Window button tracking
  const windowButtons = new Map();

  function updateClock() {
    const el = document.getElementById('taskbar-clock');
    if (!el) return;
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    el.textContent = `${h12}:${m} ${ampm}`;
  }

  updateClock();
  setInterval(updateClock, 30000);

  // Start button
  const startBtn = document.getElementById('start-button');
  startBtn?.addEventListener('click', () => {
    bus.emit('start-menu:toggle');
  });

  // Window button management
  bus.on('window:opened', ({ id, title }) => {
    const container = document.getElementById('taskbar-windows');
    if (!container || windowButtons.has(id)) return;

    const btn = document.createElement('button');
    btn.className = 'taskbar-btn active';
    btn.textContent = title || id;
    btn.dataset.windowId = id;
    btn.setAttribute('aria-label', `Switch to ${title || id}`);

    btn.addEventListener('click', () => {
      bus.emit('window:focus', id);
    });

    container.appendChild(btn);
    windowButtons.set(id, { btn, minimized: false });
  });

  bus.on('window:closed', ({ id }) => {
    const entry = windowButtons.get(id);
    if (entry) {
      entry.btn.remove();
      windowButtons.delete(id);
      // Activate another button if any
      const next = document.querySelector('.taskbar-btn');
      if (next) next.classList.add('active');
    }
  });

  bus.on('window:minimized', ({ id }) => {
    const entry = windowButtons.get(id);
    if (entry) {
      entry.minimized = true;
      entry.btn.classList.remove('active');
    }
  });

  bus.on('window:restored', ({ id }) => {
    const entry = windowButtons.get(id);
    if (entry) {
      entry.minimized = false;
      document.querySelectorAll('.taskbar-btn.active').forEach(b => b.classList.remove('active'));
      entry.btn.classList.add('active');
    }
  });

  bus.on('window:focus', (id) => {
    // Update active state on all buttons
    document.querySelectorAll('.taskbar-btn.active').forEach(b => b.classList.remove('active'));
    const entry = windowButtons.get(id);
    if (entry) {
      entry.btn.classList.add('active');
      bus.emit('window:restore-request', id);
    }
  });
}
