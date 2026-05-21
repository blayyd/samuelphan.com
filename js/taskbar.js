/**
 * Taskbar for XP Desktop Shell
 *
 * Features:
 * - Start button (green, XP-style)
 * - Quick launch area
 * - Window tabs (click to focus/minimize)
 * - System tray with clock (updates every second)
 * - Emits/receives events from WindowManager
 */
(function () {
  'use strict';

  var windowTabsContainer = null;
  var clockEl = null;
  var tabMap = {}; // id -> { element, winId }

  function init() {
    windowTabsContainer = document.getElementById('window-tabs');
    clockEl = document.getElementById('clock');

    // Start button
    var startBtn = document.getElementById('start-button');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        if (window.XPDesktop && window.XPDesktop.StartMenu) {
          window.XPDesktop.StartMenu.toggle();
        }
      });
    }

    // Quick launch icons
    var qlIcons = document.querySelectorAll('.quick-launch-icon');
    qlIcons.forEach(function (icon) {
      icon.addEventListener('click', function () {
        var app = icon.dataset.app;
        if (app && window[app]) {
          window[app]();
        }
      });
    });

    // Listen for window manager events
    document.addEventListener('xp:windowCreated', function (e) {
      addTab(e.detail.id, e.detail.title, e.detail.icon);
    });

    document.addEventListener('xp:windowClosed', function (e) {
      removeTab(e.detail.id);
    });

    document.addEventListener('xp:windowMinimized', function (e) {
      updateTabState(e.detail.id, false);
    });

    document.addEventListener('xp:windowRestored', function (e) {
      updateTabState(e.detail.id, true);
    });

    document.addEventListener('xp:windowFocused', function (e) {
      highlightTab(e.detail.id);
    });

    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    console.log('[XP Taskbar] Loaded');
  }

  function addTab(winId, title, icon) {
    if (!windowTabsContainer) return;

    // Don't add duplicate tabs
    if (tabMap[winId]) return;

    var tab = document.createElement('div');
    tab.className = 'window-tab';
    tab.dataset.winId = winId;

    var iconEl = document.createElement('span');
    iconEl.className = 'tab-icon';
    if (icon) {
      iconEl.innerHTML = '<img src="' + icon.replace(/"/g, '&quot;') + '" alt="" style="width:16px;height:16px;">';
    } else {
      iconEl.textContent = '📄';
    }

    var titleEl = document.createElement('span');
    titleEl.className = 'tab-title';
    titleEl.textContent = title;

    tab.appendChild(iconEl);
    tab.appendChild(titleEl);

    tab.addEventListener('click', function () {
      if (window.XPDesktop && window.XPDesktop.WindowManager) {
        var win = window.XPDesktop.WindowManager.get(winId);
        if (win) {
          if (win.state === 'minimized') {
            window.XPDesktop.WindowManager.restore(winId);
          } else {
            // Check if this window is currently focused (highest z-index among visible)
            var allWins = window.XPDesktop.WindowManager.getAll();
            var isFocused = true;
            var thisZ = parseInt(win.element.style.zIndex) || 0;
            allWins.forEach(function (w) {
              if (w.id !== winId && w.element.style.display !== 'none') {
                var z = parseInt(w.element.style.zIndex) || 0;
                if (z > thisZ) {
                  isFocused = false;
                }
              }
            });
            if (isFocused) {
              // Already focused — minimize it (XP behavior)
              window.XPDesktop.WindowManager.minimize(winId);
            } else {
              window.XPDesktop.WindowManager.focus(winId);
            }
          }
        }
      }
    });

    windowTabsContainer.appendChild(tab);
    tabMap[winId] = { element: tab, winId: winId };

    // Highlight new tab
    highlightTab(winId);
  }

  function removeTab(winId) {
    var entry = tabMap[winId];
    if (!entry) return;
    entry.element.remove();
    delete tabMap[winId];
  }

  function updateTabState(winId, isActive) {
    var entry = tabMap[winId];
    if (!entry) return;
    if (isActive) {
      entry.element.classList.remove('minimized');
      highlightTab(winId);
    } else {
      entry.element.classList.remove('active');
      entry.element.classList.add('minimized');
    }
  }

  function highlightTab(winId) {
    // Remove active from all tabs
    Object.keys(tabMap).forEach(function (id) {
      tabMap[id].element.classList.remove('active');
    });

    var entry = tabMap[winId];
    if (entry) {
      entry.element.classList.add('active');
    }
  }

  function updateClock() {
    if (!clockEl) return;
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    var h12 = hours % 12 || 12;
    var timeStr = pad2(h12) + ':' + pad2(minutes) + ' ' + ampm;

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dateStr = months[now.getMonth()] + ' ' + now.getDate();

    clockEl.innerHTML = '<span class="clock-time">' + timeStr + '</span>' +
                        '<span class="clock-date">' + dateStr + '</span>';
  }

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  // --- Init ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
