/**
 * Start Menu component
 */
import { bus } from '../pubsub.js';

export function initStartMenu(items) {
  const menu = document.getElementById('start-menu');
  const body = menu?.querySelector('.start-menu-body');
  if (!menu || !body) return;

  let open = false;

  function render() {
    body.innerHTML = '';
    items.forEach(section => {
      const sec = document.createElement('div');
      sec.className = 'start-menu-section';
      if (section.heading) {
        const h = document.createElement('h3');
        h.textContent = section.heading;
        sec.appendChild(h);
      }
      section.items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'start-menu-item';
        el.tabIndex = 0;
        el.setAttribute('role', 'menuitem');
        el.innerHTML = `
          <img src="${item.icon || ''}" alt="" aria-hidden="true" width="24" height="24" onerror="this.style.display='none'">
          <span>${item.label}</span>
        `;
        el.addEventListener('click', () => {
          bus.emit('app:launch', item.app);
          close();
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            bus.emit('app:launch', item.app);
            close();
          }
        });
        sec.appendChild(el);
      });
      body.appendChild(sec);
    });
  }

  function open_() {
    open = true;
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    // Focus first item
    const first = menu.querySelector('.start-menu-item');
    first?.focus();
  }

  function close() {
    open = false;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
  }

  function toggle() {
    if (open) close();
    else open_();
  }

  bus.on('start-menu:toggle', toggle);

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (open && !menu.contains(e.target) && e.target.id !== 'start-button') {
      close();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      close();
      document.getElementById('start-button')?.focus();
    }
  });

  render();
}
