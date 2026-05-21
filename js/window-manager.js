/**
 * Window Manager for XP Desktop Shell
 *
 * Features:
 * - Create, close, minimize, maximize/restore windows
 * - Draggable by title bar
 * - Resizable from edges and corners
 * - Z-index management (click to focus)
 * - Events emitted for taskbar integration
 *
 * ## Public API (window.XPDesktop.WindowManager)
 *
 *   createWindow(opts)    → String (window id)
 *     opts = {
 *       title:      String,             // Window title
 *       icon:       String,             // URL or data URI for icon
 *       width:      Number (default 500),
 *       height:     Number (default 350),
 *       x:          Number,             // Left position
 *       y:          Number,             // Top position
 *       content:    String (HTML),      // Content for window body
 *       resizable:  Boolean (default true),
 *       onClose:    Function            // Called before window is removed
 *     }
 *
 *   close(id)           → void
 *   minimize(id)        → void
 *   maximize(id)        → void  (toggles maximize/restore)
 *   restore(id)         → void
 *   focus(id)           → void
 *   get(id)             → Object | null    // { id, title, icon, element, state, onClose }
 *   getAll()            → Array            // All window objects
 *   focusNext()         → void             // Cycle focus to next window
 *
 * ## Events (CustomEvent on document, 'xp:' prefix)
 *
 *   xp:windowCreated    { id, title, icon }
 *   xp:windowClosed     { id }
 *   xp:windowFocused    { id }
 *   xp:windowMinimized  { id }
 *   xp:windowRestored   { id }
 *   xp:windowMaximized  { id }
 */
(function () {
  'use strict';

  var winIdCounter = 0;
  var windows = {};
  var zCounter = 100;
  var container = null;

  function getContainer() {
    if (!container) {
      container = document.getElementById('window-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'window-container';
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function emit(name, data) {
    var evt = new CustomEvent('xp:' + name, { detail: data });
    document.dispatchEvent(evt);
  }

  function constrainWindow(el) {
    var minLeft = -el.offsetWidth + 100;
    var minTop = -10;
    var maxLeft = window.innerWidth - 100;
    var maxTop = window.innerHeight - 48 - 30;

    var left = parseInt(el.style.left) || 0;
    var top = parseInt(el.style.top) || 0;

    el.style.left = Math.max(minLeft, Math.min(left, maxLeft)) + 'px';
    el.style.top = Math.max(minTop, Math.min(top, maxTop)) + 'px';
  }

  function makeDraggable(el, winData) {
    var titleBar = el.querySelector('.title-bar');
    var isDragging = false;
    var startX, startY, origLeft, origTop;

    titleBar.addEventListener('mousedown', function (e) {
      if (e.target.closest('.title-bar-controls') ||
          e.target.closest('.title-bar-controls-left') ||
          e.target.closest('.xp-btn-minimize') ||
          e.target.closest('.xp-btn-maximize') ||
          e.target.closest('.xp-btn-close')) return;

      if (winData.state === 'maximized') {
        // Restore on drag when maximized (XP behaviour)
        restoreWindow(winData.id);
        // Recalculate after restore
        var rect = el.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origLeft = rect.left;
        origTop = rect.top;
        el.style.left = origLeft + 'px';
        el.style.top = origTop + 'px';
      } else {
        startX = e.clientX;
        startY = e.clientY;
        origLeft = el.offsetLeft;
        origTop = el.offsetTop;
      }

      isDragging = true;
      el.style.cursor = 'move';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      el.style.left = (origLeft + e.clientX - startX) + 'px';
      el.style.top = (origTop + e.clientY - startY) + 'px';
    });

    document.addEventListener('mouseup', function () {
      if (!isDragging) return;
      isDragging = false;
      el.style.cursor = '';
      constrainWindow(el);
    });
  }

  // --- Resize logic ---
  var resizeState = null;

  function makeResizable(el, winData) {
    var edges = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    var handleSize = 6;

    edges.forEach(function (pos) {
      var handle = document.createElement('div');
      handle.className = 'xp-resize-handle xp-resize-' + pos;
      el.appendChild(handle);

      handle.addEventListener('mousedown', function (e) {
        if (winData.state === 'maximized') return;
        resizeState = {
          el: el,
          pos: pos,
          startX: e.clientX,
          startY: e.clientY,
          startW: el.offsetWidth,
          startH: el.offsetHeight,
          startLeft: el.offsetLeft,
          startTop: el.offsetTop
        };
        e.stopPropagation();
        e.preventDefault();
      });
    });

    // Use document-level mousemove/mouseup for resizing
    // (handlers added once, not per window)
  }

  // Shared resize handler (attached once)
  document.addEventListener('mousemove', function (e) {
    if (!resizeState) return;
    var rs = resizeState;
    var el = rs.el;
    var dx = e.clientX - rs.startX;
    var dy = e.clientY - rs.startY;
    var minW = 200;
    var minH = 100;
    var pos = rs.pos;

    if (pos.indexOf('e') !== -1) {
      el.style.width = Math.max(minW, rs.startW + dx) + 'px';
    }
    if (pos.indexOf('s') !== -1) {
      el.style.height = Math.max(minH, rs.startH + dy) + 'px';
    }
    if (pos.indexOf('w') !== -1) {
      var newW = Math.max(minW, rs.startW - dx);
      el.style.width = newW + 'px';
      el.style.left = (rs.startLeft + rs.startW - newW) + 'px';
    }
    if (pos.indexOf('n') !== -1) {
      var newH = Math.max(minH, rs.startH - dy);
      el.style.height = newH + 'px';
      el.style.top = (rs.startTop + rs.startH - newH) + 'px';
    }
  });

  document.addEventListener('mouseup', function () {
    if (resizeState) {
      constrainWindow(resizeState.el);
      resizeState = null;
    }
  });

  // --- Window operations ---
  function createWindow(opts) {
    opts = opts || {};
    var id = 'xp-win-' + (++winIdCounter);
    var title = opts.title || 'Window';
    var icon = opts.icon || '';
    var width = opts.width || 500;
    var height = opts.height || 350;
    var x = opts.x || (50 + (winIdCounter % 10) * 30);
    var y = opts.y || (50 + (winIdCounter % 10) * 30);
    var content = opts.content || '';
    var resizable = opts.resizable !== false;
    var onClose = opts.onClose || null;

    var el = document.createElement('div');
    el.className = 'window xp-window';
    el.id = id;
    el.style.width = width + 'px';
    el.style.height = height + 'px';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.zIndex = ++zCounter;
    el.dataset.windowId = id;
    el.dataset.state = 'normal';

    // Store restore dimensions
    el.dataset.prevWidth = width;
    el.dataset.prevHeight = height;
    el.dataset.prevLeft = x;
    el.dataset.prevTop = y;

    var iconHtml = icon ? '<img class="xp-window-icon" src="' + icon.replace(/"/g, '&quot;') + '" alt="">' : '';

    el.innerHTML =
      '<div class="title-bar xp-title-bar">' +
        '<div class="title-bar-controls-left">' + iconHtml + '</div>' +
        '<div class="title-bar-text" data-title-text="true">' + escapeHtml(title) + '</div>' +
        '<div class="title-bar-controls">' +
          '<button aria-label="Minimize" class="xp-btn-minimize"></button>' +
          '<button aria-label="Maximize" class="xp-btn-maximize"></button>' +
          '<button aria-label="Close" class="xp-btn-close"></button>' +
        '</div>' +
      '</div>' +
      '<div class="window-body" data-body="true">' + content + '</div>';

    getContainer().appendChild(el);

    var winData = {
      id: id,
      title: title,
      icon: icon,
      element: el,
      state: 'normal',
      onClose: onClose
    };

    windows[id] = winData;

    // Click to focus (anywhere on window)
    el.addEventListener('mousedown', function () {
      focusWindow(id);
    });

    // Drag
    makeDraggable(el, winData);

    // Resize
    if (resizable) {
      makeResizable(el, winData);
    }

    // Close
    el.querySelector('.xp-btn-close').addEventListener('click', function (e) {
      e.stopPropagation();
      closeWindow(id);
    });

    // Minimize
    el.querySelector('.xp-btn-minimize').addEventListener('click', function (e) {
      e.stopPropagation();
      minimizeWindow(id);
    });

    // Maximize / Restore
    el.querySelector('.xp-btn-maximize').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMaximize(id);
    });

    // Focus and notify
    focusWindow(id);
    emit('windowCreated', { id: id, title: title, icon: icon });

    return id;
  }

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
  }

  function closeWindow(id) {
    var win = windows[id];
    if (!win) return;
    if (win.onClose) {
      win.onClose(id);
    }
    win.element.remove();
    delete windows[id];
    emit('windowClosed', { id: id });
  }

  function minimizeWindow(id) {
    var win = windows[id];
    if (!win) return;
    var el = win.element;
    var wasVisible = el.style.display !== 'none';
    el.style.display = 'none';
    win.state = 'minimized';
    el.dataset.state = 'minimized';

    // Focus next visible window
    var visible = Object.keys(windows).filter(function (k) {
      return windows[k].element.style.display !== 'none';
    });
    if (visible.length > 0) {
      focusWindow(visible[visible.length - 1]);
    }

    emit('windowMinimized', { id: id, wasVisible: wasVisible });
  }

  function restoreWindow(id) {
    var win = windows[id];
    if (!win) return;
    var el = win.element;

    if (win.state === 'minimized') {
      el.style.display = '';
      win.state = 'normal';
      el.dataset.state = 'normal';
      focusWindow(id);
      emit('windowRestored', { id: id });
    } else if (win.state === 'maximized') {
      // Un-maximize
      el.style.width = el.dataset.prevWidth + 'px';
      el.style.height = el.dataset.prevHeight + 'px';
      el.style.left = el.dataset.prevLeft + 'px';
      el.style.top = el.dataset.prevTop + 'px';
      el.style.position = 'absolute';
      el.style.bottom = '';
      el.style.right = '';
      win.state = 'normal';
      el.dataset.state = 'normal';
      focusWindow(id);
      emit('windowRestored', { id: id });
    }

    // Ensure it's visible
    el.style.display = '';
  }

  function toggleMaximize(id) {
    var win = windows[id];
    if (!win) return;
    var el = win.element;

    if (win.state === 'maximized') {
      restoreWindow(id);
    } else {
      // Save dimensions
      el.dataset.prevWidth = el.offsetWidth;
      el.dataset.prevHeight = el.offsetHeight;
      el.dataset.prevLeft = el.style.left || '0';
      el.dataset.prevTop = el.style.top || '0';

      el.style.left = '0';
      el.style.top = '0';
      el.style.position = 'absolute';
      el.style.width = '100%';
      el.style.height = 'calc(100vh - 48px)'; // minus taskbar
      el.style.bottom = '';
      el.style.right = '';
      win.state = 'maximized';
      el.dataset.state = 'maximized';
      focusWindow(id);
      emit('windowMaximized', { id: id });
    }
  }

  function focusWindow(id) {
    var win = windows[id];
    if (!win) return;
    win.element.style.zIndex = ++zCounter;
    win.element.style.display = '';
    if (win.state === 'minimized') {
      win.state = 'normal';
      win.element.dataset.state = 'normal';
      emit('windowRestored', { id: id });
    }
    emit('windowFocused', { id: id });
  }

  function getWindow(id) {
    return windows[id] || null;
  }

  function getAllWindows() {
    return Object.keys(windows).map(function (k) { return windows[k]; });
  }

  function focusNext() {
    var ids = Object.keys(windows);
    if (ids.length === 0) return;

    // Find currently focused (highest z-index)
    var maxZ = -1;
    var focusedId = null;
    ids.forEach(function (id) {
      var z = parseInt(windows[id].element.style.zIndex) || 0;
      if (z > maxZ) {
        maxZ = z;
        focusedId = id;
      }
    });

    var idx = focusedId ? ids.indexOf(focusedId) : -1;
    var nextIdx = (idx + 1) % ids.length;
    focusWindow(ids[nextIdx]);
  }

  // --- Expose global API ---
  if (!window.XPDesktop) window.XPDesktop = {};

  window.XPDesktop.WindowManager = {
    createWindow: createWindow,
    close: closeWindow,
    minimize: minimizeWindow,
    maximize: toggleMaximize,
    restore: restoreWindow,
    focus: focusWindow,
    get: getWindow,
    getAll: getAllWindows,
    focusNext: focusNext
  };

  // Also expose on the document for event-based access
  document.XPDesktop = window.XPDesktop;

  console.log('[XP Shell] Window Manager loaded');
})();
