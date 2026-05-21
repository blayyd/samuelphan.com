/**
 * samuelphan.com — Window Manager
 * Manages draggable, resizable windows with XP-style chrome.
 * Communicates with the taskbar via pub/sub.
 */
import { bus } from './pubsub.js';

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

let nextZ = 100;
let windowCount = 0;

export function createWindowManager() {
  const windows = new Map();

  function bringToFront(win) {
    win.style.zIndex = ++nextZ;
  }

  function constrainToDesktop(x, y, w, h) {
    const desktop = document.getElementById('desktop');
    const maxX = (desktop.clientWidth || window.innerWidth) - 40;
    const maxY = (desktop.clientHeight || window.innerHeight) - 100;
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
      w: Math.max(MIN_WIDTH, Math.min(w, maxX - (Math.max(0, Math.min(x, maxX))))),
      h: Math.max(MIN_HEIGHT, Math.min(h, maxY - (Math.max(0, Math.min(y, maxY))))),
    };
  }

  return {
    /**
     * Create a new window.
     * @param {Object} opts — { id, title, content, icon, x, y, width, height, resizable }
     * @returns {HTMLElement} the window element
     */
    open(opts) {
      const id = opts.id || `win-${++windowCount}`;

      // Remove existing window with same id
      if (windows.has(id)) {
        this.close(id);
      }

      const pos = constrainToDesktop(
        opts.x ?? 50 + (windowCount % 5) * 30,
        opts.y ?? 50 + (windowCount % 5) * 20,
        opts.width ?? 640,
        opts.height ?? 420,
      );

      const win = document.createElement('div');
      win.className = 'window active';
      win.id = `window-${id}`;
      win.setAttribute('role', 'dialog');
      win.setAttribute('aria-label', opts.title || 'Window');
      win.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        width: ${pos.w}px;
        height: ${pos.h}px;
        z-index: ${++nextZ};
      `;

      // Title bar
      const titleBar = document.createElement('div');
      titleBar.className = 'title-bar';
      titleBar.innerHTML = `
        <div class="title-bar-text">${opts.icon ? `<img src="${opts.icon}" alt="" class="title-bar-icon" style="width:16px;height:16px;margin-right:4px;vertical-align:middle">` : ''}${opts.title || 'Untitled'}</div>
        <div class="title-bar-controls">
          <button aria-label="Minimize" class="minimize-btn"></button>
          <button aria-label="Maximize" class="maximize-btn"></button>
          <button aria-label="Close" class="close-btn"></button>
        </div>
      `;

      // Body
      const body = document.createElement('div');
      body.className = 'window-body';
      if (typeof opts.content === 'string') {
        body.innerHTML = opts.content;
      } else if (opts.content instanceof HTMLElement) {
        body.appendChild(opts.content);
      }

      win.appendChild(titleBar);
      win.appendChild(body);

      // Status bar (optional)
      if (opts.statusBar) {
        const statusBar = document.createElement('div');
        statusBar.className = 'status-bar';
        statusBar.innerHTML = opts.statusBar;
        win.appendChild(statusBar);
      }

      // Bring to front on click
      win.addEventListener('mousedown', () => {
        bringToFront(win);
        document.querySelectorAll('.window.active').forEach(w => w.classList.remove('active'));
        win.classList.add('active');
      });

      // Dragging from title bar
      this._makeDraggable(win, titleBar);

      // Resize handle
      if (opts.resizable !== false) {
        this._makeResizable(win);
      }

      // Button handlers
      titleBar.querySelector('.minimize-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        win.style.display = 'none';
        win.classList.remove('active');
        bus.emit('window:minimized', { id, title: opts.title });
      });

      titleBar.querySelector('.maximize-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const maximized = win.classList.toggle('maximized');
        if (maximized) {
          win._prevRect = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height };
          win.style.left = '0';
          win.style.top = '0';
          win.style.width = '100%';
          win.style.height = '100%';
        } else if (win._prevRect) {
          Object.assign(win.style, win._prevRect);
        }
        bus.emit('window:maximized', { id, maximized });
      });

      titleBar.querySelector('.close-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close(id);
      });

      // Double-click title bar to maximize
      titleBar.addEventListener('dblclick', (e) => {
        if (e.target.closest('.title-bar-controls')) return;
        titleBar.querySelector('.maximize-btn')?.click();
      });

      document.getElementById('desktop')?.appendChild(win);
      windows.set(id, win);
      bringToFront(win);

      bus.emit('window:opened', { id, title: opts.title, win });
      return win;
    },

    close(id) {
      const win = windows.get(id);
      if (!win) return;
      win.remove();
      windows.delete(id);
      bus.emit('window:closed', { id });
    },

    minimize(id) {
      const win = windows.get(id);
      if (!win) return;
      win.style.display = 'none';
      win.classList.remove('active');
      bus.emit('window:minimized', { id });
    },

    restore(id) {
      const win = windows.get(id);
      if (!win) return;
      win.style.display = '';
      win.classList.add('active');
      bringToFront(win);
      bus.emit('window:restored', { id });
    },

    getWindow(id) {
      return windows.get(id);
    },

    _makeDraggable(win, handle) {
      let startX, startY, startLeft, startTop;

      handle.addEventListener('mousedown', (e) => {
        if (e.target.closest('.title-bar-controls')) return;
        if (win.classList.contains('maximized')) return;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(win.style.left, 10) || 0;
        startTop = parseInt(win.style.top, 10) || 0;

        const onMove = (e2) => {
          const pos = constrainToDesktop(
            startLeft + (e2.clientX - startX),
            startTop + (e2.clientY - startY),
            win.offsetWidth,
            win.offsetHeight,
          );
          win.style.left = pos.x + 'px';
          win.style.top = pos.y + 'px';
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.userSelect = '';
        };

        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    },

    _makeResizable(win) {
      const handle = document.createElement('div');
      handle.style.cssText = 'position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize;z-index:1;';
      win.appendChild(handle);

      let startX, startY, startW, startH;

      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (win.classList.contains('maximized')) return;
        startX = e.clientX;
        startY = e.clientY;
        startW = win.offsetWidth;
        startH = win.offsetHeight;

        const onMove = (e2) => {
          const pos = constrainToDesktop(
            parseInt(win.style.left, 10) || 0,
            parseInt(win.style.top, 10) || 0,
            startW + (e2.clientX - startX),
            startH + (e2.clientY - startY),
          );
          win.style.width = pos.w + 'px';
          win.style.height = pos.h + 'px';
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.userSelect = '';
        };

        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    },
  };
}
