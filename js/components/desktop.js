/**
 * Desktop component — renders desktop icons and handles double-click to open windows.
 */
import { bus } from '../pubsub.js';

export function initDesktop(icons) {
  const container = document.getElementById('desktop-icons');
  if (!container) return;

  // Selection handling
  let selectedIcon = null;
  container.addEventListener('click', (e) => {
    const icon = e.target.closest('.desktop-icon');
    if (!icon) return;
    if (selectedIcon) selectedIcon.classList.remove('selected');
    selectedIcon = icon;
    icon.classList.add('selected');
  });

  // Double-click opens window
  container.addEventListener('dblclick', (e) => {
    const icon = e.target.closest('.desktop-icon');
    if (!icon) return;
    const id = icon.dataset.app;
    if (id) {
      bus.emit('desktop:open', { app: id, title: icon.dataset.title });
    }
  });

  // Keyboard navigation
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const icon = container.querySelector('.desktop-icon.selected');
      if (icon) {
        e.preventDefault();
        bus.emit('desktop:open', { app: icon.dataset.app, title: icon.dataset.title });
      }
    }
  });

  // Render icons from data
  icons.forEach(icon => {
    const el = document.createElement('div');
    el.className = 'desktop-icon';
    el.dataset.app = icon.id;
    el.dataset.title = icon.title;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Open ${icon.title}`);
    el.innerHTML = `
      <img src="${icon.icon || ''}" alt="" aria-hidden="true" onerror="this.style.display='none'">
      <span>${icon.title}</span>
    `;
    container.appendChild(el);
  });

  // Handle window open events from taskbar/start menu
  bus.on('desktop:open', ({ app }) => {
    bus.emit('app:launch', app);
  });
}
