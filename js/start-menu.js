/**
 * Start Menu for XP Desktop Shell
 *
 * Two-column layout with flyout submenus.
 * Click outside to close.
 * Emits events for other components.
 */
(function () {
  'use strict';

  var startMenu = null;
  var overlay = null;
  var isOpen = false;

  var menuConfig = [
    {
      text: 'My Documents',
      icon: '📁',
      submenu: [
        { text: 'School Work', icon: '📚' },
        { text: 'Personal', icon: '📝' },
        { text: 'Downloads', icon: '📥' }
      ]
    },
    {
      text: 'My Pictures',
      icon: '🖼️',
      submenu: [
        { text: 'Screenshots', icon: '📷' },
        { text: 'Wallpapers', icon: '🌄' },
        { text: 'Memes', icon: '😂' }
      ]
    },
    {
      text: 'My Music',
      icon: '🎵',
      submenu: [
        { text: 'All Music', icon: '🎶' },
        { text: 'Playlists', icon: '📋' }
      ]
    },
    { text: 'My Computer', icon: '💻', submenu: [
      { text: 'Local Disk (C:)', icon: '💾' },
      { text: 'Removable Disk (D:)', icon: '📀' },
      { text: 'Shared Documents', icon: '📁' }
    ] },
    { text: 'Control Panel', icon: '⚙️', submenu: null },
    { text: 'Printers and Faxes', icon: '🖨️', submenu: null },
    { separator: true },
    { text: 'Help and Support', icon: '❓', submenu: null },
    { text: 'Search', icon: '🔍', submenu: null },
    { text: 'Run...', icon: '▶️', submenu: null }
  ];

  function init() {
    overlay = document.getElementById('start-menu-overlay');
    startMenu = document.getElementById('start-menu');
    if (!overlay || !startMenu) {
      console.error('[XP Start Menu] Elements not found');
      return;
    }

    // Build left column
    var leftCol = startMenu.querySelector('.start-menu-left');

    menuConfig.forEach(function (item) {
      if (item.separator) {
        var sep = document.createElement('div');
        sep.className = 'start-menu-separator';
        leftCol.appendChild(sep);
        return;
      }

      var menuItem = document.createElement('div');
      menuItem.className = 'start-menu-item';

      var iconSpan = document.createElement('span');
      iconSpan.className = 'menu-icon';
      iconSpan.textContent = item.icon || '📄';

      var textSpan = document.createElement('span');
      textSpan.className = 'menu-text';
      textSpan.textContent = item.text;

      menuItem.appendChild(iconSpan);
      menuItem.appendChild(textSpan);

      if (item.submenu && item.submenu.length > 0) {
        var arrow = document.createElement('span');
        arrow.className = 'menu-arrow';
        arrow.textContent = '▶';
        menuItem.appendChild(arrow);

        var subEl = document.createElement('div');
        subEl.className = 'submenu';

        item.submenu.forEach(function (subItem) {
          var subMenuItem = document.createElement('div');
          subMenuItem.className = 'start-menu-item';

          var subIcon = document.createElement('span');
          subIcon.className = 'menu-icon';
          subIcon.textContent = subItem.icon || '📄';

          var subText = document.createElement('span');
          subText.className = 'menu-text';
          subText.textContent = subItem.text;

          subMenuItem.appendChild(subIcon);
          subMenuItem.appendChild(subText);

          subMenuItem.addEventListener('click', function (e) {
            e.stopPropagation();
            closeMenu();
            openItemWindow(item.text + ' › ' + subItem.text, subItem);
          });

          subEl.appendChild(subMenuItem);
        });

        menuItem.appendChild(subEl);
      } else {
        menuItem.addEventListener('click', function () {
          closeMenu();
          openItemWindow(item.text, item);
        });
      }

      leftCol.appendChild(menuItem);
    });

    // Click outside to close (overlay click)
    overlay.addEventListener('click', function () {
      closeMenu();
    });

    // Prevent start menu click from closing
    startMenu.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  function openItemWindow(text, item) {
    var content = '<div style="padding:20px;text-align:center;color:#666;">' +
      '<div style="font-size:48px;margin-bottom:12px;">' + (item.icon || '📄') + '</div>' +
      '<p><strong>' + escapeHtml(text) + '</strong></p>' +
      '<p>This feature is coming soon.</p>' +
      '</div>';

    window.XPDesktop.WindowManager.createWindow({
      title: text,
      icon: item.icon ? 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text y="28" font-size="28">' + item.icon + '</text></svg>') : '',
      content: content,
      width: 400,
      height: 300,
      x: 100 + Math.random() * 200,
      y: 80 + Math.random() * 150
    });
  }

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    isOpen = true;
    overlay.classList.add('visible');
    startMenu.classList.add('visible');
    var evt = new CustomEvent('xp:startMenuOpened', { detail: {} });
    document.dispatchEvent(evt);
  }

  function closeMenu() {
    isOpen = false;
    overlay.classList.remove('visible');
    startMenu.classList.remove('visible');
    var evt = new CustomEvent('xp:startMenuClosed', { detail: {} });
    document.dispatchEvent(evt);
  }

  // --- Init on DOM ready ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // --- Expose API ---
  window.XPDesktop = window.XPDesktop || {};
  window.XPDesktop.StartMenu = {
    toggle: toggleMenu,
    open: openMenu,
    close: closeMenu,
    isOpen: function () { return isOpen; }
  };
})();
