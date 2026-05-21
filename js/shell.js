/**
 * XP Desktop Shell Bootstrap
 *
 * Initializes the desktop shell and registers default launch handlers.
 * This is the main entry point that wires all components together.
 */
(function () {
  'use strict';

  function init() {
    console.log('[XP Shell] Booting Windows XP Desktop...');

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  function boot() {
    console.log('[XP Shell] Desktop ready');

    // Register bonus apps in Start menu
    registerBonusAppMenuItems();

    // Add desktop right-click context menu for Clippy
    addDesktopContextMenu();

    console.log('[XP Shell] Window Manager API available at window.XPDesktop.WindowManager');
    console.log('[XP Shell] Start Menu API available at window.XPDesktop.StartMenu');
    console.log('[XP Shell] Bonus apps loaded: Minesweeper, Command Prompt, Internet Explorer, Clippy');
  }

  function registerBonusAppMenuItems() {
    // Wait for start menu to be ready
    var checkInterval = setInterval(function () {
      var startMenuLeft = document.querySelector('.start-menu-left');
      if (!startMenuLeft) return;

      // Check if it has items already populated (start-menu.js inserts them on init)
      if (startMenuLeft.children.length > 0) {
        clearInterval(checkInterval);

        // Insert separator for Games
        var sep = document.createElement('div');
        sep.className = 'start-menu-separator';
        startMenuLeft.appendChild(sep);

        // Games submenu
        var gamesItem = createMenuItem('Games', '🎮', [
          { text: 'Minesweeper', icon: '💣', action: 'launchMinesweeper' }
        ]);
        startMenuLeft.appendChild(gamesItem);

        // Separator
        var sep2 = document.createElement('div');
        sep2.className = 'start-menu-separator';
        startMenuLeft.appendChild(sep2);

        // Internet Explorer
        var ieItem = createMenuItem('Internet Explorer', '🌐', null, 'launchInternetExplorer');
        startMenuLeft.appendChild(ieItem);

        // Command Prompt
        var cmdItem = createMenuItem('Command Prompt', '💻', null, 'launchCommandPrompt');
        startMenuLeft.appendChild(cmdItem);

        // Clippy toggle
        var clippyItem = createMenuItem('Toggle Clippy', '📎', null, 'toggleClippy');
        startMenuLeft.appendChild(clippyItem);
      }
    }, 100);

    // Safety: clear after 5 seconds
    setTimeout(function () { clearInterval(checkInterval); }, 5000);
  }

  function createMenuItem(text, icon, submenu, action) {
    var menuItem = document.createElement('div');
    menuItem.className = 'start-menu-item';

    var iconSpan = document.createElement('span');
    iconSpan.className = 'menu-icon';
    iconSpan.textContent = icon || '📄';

    var textSpan = document.createElement('span');
    textSpan.className = 'menu-text';
    textSpan.textContent = text;

    menuItem.appendChild(iconSpan);
    menuItem.appendChild(textSpan);

    if (submenu && submenu.length > 0) {
      var arrow = document.createElement('span');
      arrow.className = 'menu-arrow';
      arrow.textContent = '▶';
      menuItem.appendChild(arrow);

      var subEl = document.createElement('div');
      subEl.className = 'submenu';

      submenu.forEach(function (subItem) {
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
          if (window.XPDesktop && window.XPDesktop.StartMenu) {
            window.XPDesktop.StartMenu.close();
          }
          if (subItem.action && window[subItem.action]) {
            window[subItem.action]();
          }
        });

        subEl.appendChild(subMenuItem);
      });

      menuItem.appendChild(subEl);
    } else {
      menuItem.addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.XPDesktop && window.XPDesktop.StartMenu) {
          window.XPDesktop.StartMenu.close();
        }
        if (action && window[action]) {
          window[action]();
        }
      });
    }

    return menuItem;
  }

  function addDesktopContextMenu() {
    var desktop = document.getElementById('desktop');
    if (!desktop) return;

    desktop.addEventListener('contextmenu', function (e) {
      e.preventDefault();

      // Create simple context menu
      var menu = document.createElement('div');
      menu.style.cssText =
        'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
        'background:#fff;border:1px solid #aca899;box-shadow:2px 2px 6px rgba(0,0,0,0.3);' +
        'z-index:10000;font-family:Tahoma,sans-serif;font-size:11px;min-width:160px;';

      var items = [
        { text: 'Arrange Icons By', icon: '▸', disabled: true },
        { text: 'Line up Icons', disabled: true },
        { separator: true },
        { text: 'Minesweeper', icon: '💣', action: 'launchMinesweeper' },
        { text: 'Command Prompt', icon: '💻', action: 'launchCommandPrompt' },
        { text: 'Internet Explorer', icon: '🌐', action: 'launchInternetExplorer' },
        { separator: true },
        { text: XPDesktop.Clippy && XPDesktop.Clippy.isVisible() ? 'Hide Clippy' : 'Show Clippy',
          icon: '📎', action: 'toggleClippy', checkable: true },
      ];

      items.forEach(function (item) {
        if (item.separator) {
          var sep = document.createElement('hr');
          sep.style.cssText = 'border:none;border-top:1px solid #aca899;margin:2px 0;';
          menu.appendChild(sep);
          return;
        }

        var el = document.createElement('div');
        el.style.cssText =
          'padding:4px 12px;cursor:' + (item.disabled ? 'default' : 'pointer') + ';' +
          'color:' + (item.disabled ? '#999' : '#000') + ';' +
          'display:flex;align-items:center;gap:6px;';

        if (item.icon) {
          el.innerHTML = '<span style="width:18px;text-align:center;">' + item.icon + '</span> ' +
            escapeHtml(item.text);
        } else {
          el.textContent = item.text;
        }

        if (!item.disabled) {
          el.addEventListener('mouseenter', function () {
            el.style.background = '#000080';
            el.style.color = '#fff';
          });
          el.addEventListener('mouseleave', function () {
            el.style.background = '';
            el.style.color = '#000';
          });
          el.addEventListener('click', function () {
            menu.remove();
            if (item.action && window[item.action]) {
              window[item.action]();
            }
          });
        }

        menu.appendChild(el);
      });

      document.body.appendChild(menu);

      // Close on click outside
      function closeMenu(e2) {
        if (!menu.contains(e2.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
          document.removeEventListener('contextmenu', closeMenu);
        }
      }
      setTimeout(function () {
        document.addEventListener('click', closeMenu);
        document.addEventListener('contextmenu', closeMenu);
      }, 0);
    });
  }

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
  }

  // --- Helper to launch default windows ---
  window.launchNotepad = function () {
    window.XPDesktop.WindowManager.createWindow({
      title: 'Untitled - Notepad',
      icon: 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
        '<rect width="32" height="32" rx="4" fill="#2196F3"/>' +
        '<text x="16" y="24" font-size="20" text-anchor="middle" fill="white">📝</text></svg>'
      ),
      content: '<textarea style="width:100%;height:100%;border:none;outline:none;resize:none;' +
        'font-family:\'Courier New\',monospace;font-size:13px;padding:8px;box-sizing:border-box;' +
        'background:white;" placeholder="Type here..."></textarea>',
      width: 600,
      height: 400,
      x: 150,
      y: 100
    });
  };

  window.launchAboutXP = function () {
    var winId = window.XPDesktop.WindowManager.createWindow({
      title: 'About Windows XP',
      icon: 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
        '<rect width="32" height="32" rx="4" fill="#4CAF50"/>' +
        '<text x="16" y="24" font-size="20" text-anchor="middle" fill="white">ℹ️</text></svg>'
      ),
      content: '<div style="text-align:center;padding:30px 20px;">' +
        '<div style="font-size:48px;margin-bottom:12px;">🪟</div>' +
        '<h2 style="margin:0 0 4px;font-size:16px;">samuelphan.com</h2>' +
        '<p style="color:#666;margin:0 0 16px;">Windows XP Desktop Theme</p>' +
        '<hr style="border:none;border-top:1px solid #ddd;margin:12px 0;">' +
        '<p style="font-size:11px;color:#999;">' +
        'Built with ❤️ using HTML, CSS, and vanilla JavaScript.<br>' +
        'Powered by XP.css &copy; 2024</p>' +
        '<p style="font-size:11px;color:#999;">samuelphan.com v2.0</p>' +
        '<button id="about-ok-btn" style="margin-top:12px;">OK</button>' +
        '</div>',
      width: 380,
      height: 300,
      x: 200,
      y: 150
    });

    setTimeout(function () {
      var okBtn = document.querySelector('#' + winId + ' #about-ok-btn');
      if (okBtn) {
        okBtn.addEventListener('click', function () {
          window.XPDesktop.WindowManager.close(winId);
        });
      }
    }, 0);
  };

  // Kick off
  init();
})();
