/**
 * Desktop Icon Grid for XP Desktop Shell
 *
 * Features:
 * - Icons that can be single-clicked to select
 * - Double-click to open windows
 * - Icons: My Photos, My Notes, Projects, About Me, Recycle Bin, Minesweeper, Cmd, IE
 */
(function () {
  'use strict';

  var icons = [
    { id: 'my-photos',  label: 'My Photos',  icon: '🖼️', color: '#4CAF50' },
    { id: 'my-notes',   label: 'My Notes',   icon: '📝', color: '#2196F3' },
    { id: 'projects',   label: 'Projects',   icon: '💼', color: '#FF9800' },
    { id: 'about-me',   label: 'About Me',   icon: '👤', color: '#9C27B0' },
    { id: 'recycle-bin', label: 'Recycle Bin', icon: '🗑️', color: '#607D8B' },
    { id: 'minesweeper', label: 'Minesweeper', icon: '💣', color: '#808080' },
    { id: 'command-prompt', label: 'Command Prompt', icon: '💻', color: '#000' },
    { id: 'internet-explorer', label: 'Internet Explorer', icon: 'e', color: '#1a6bba' }
  ];

  var selectedId = null;

  function init() {
    var grid = document.getElementById('desktop-icons');
    if (!grid) {
      console.error('[XP Icons] Desktop icons container not found');
      return;
    }

    icons.forEach(function (item) {
      var iconEl = document.createElement('div');
      iconEl.className = 'desktop-icon';
      iconEl.dataset.iconId = item.id;

      var iconContent = document.createElement('div');
      iconContent.className = 'icon-placeholder';
      iconContent.style.cssText =
        'display:flex;align-items:center;justify-content:center;' +
        'font-size:28px;background:' + item.color + ';' +
        'border-radius:6px;color:white;';
      iconContent.textContent = item.icon;

      var label = document.createElement('div');
      label.className = 'icon-label';
      label.textContent = item.label;

      iconEl.appendChild(iconContent);
      iconEl.appendChild(label);

      // Single click to select
      iconEl.addEventListener('click', function (e) {
        e.stopPropagation();
        selectIcon(item.id);
      });

      // Double click to open window
      iconEl.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        openIconWindow(item);
      });

      grid.appendChild(iconEl);
    });

    // Click on desktop to deselect
    document.getElementById('desktop').addEventListener('click', function () {
      deselectAll();
    });

    console.log('[XP Icons] Desktop icons loaded');
  }

  function selectIcon(id) {
    deselectAll();
    selectedId = id;
    var el = document.querySelector('.desktop-icon[data-icon-id="' + id + '"]');
    if (el) el.classList.add('selected');
  }

  function deselectAll() {
    selectedId = null;
    document.querySelectorAll('.desktop-icon.selected').forEach(function (el) {
      el.classList.remove('selected');
    });
  }

  function openIconWindow(item) {
    deselectAll();

    // "My Notes" opens the proper Notepad application
    if (item.id === 'my-notes') {
      if (window.XPDesktop && window.XPDesktop.Notepad) {
        window.XPDesktop.Notepad.open();
      }
      return;
    }

    // Check if this is a bonus app that has its own launch function
    if (item.id === 'minesweeper' && window.launchMinesweeper) {
      window.launchMinesweeper();
      return;
    }
    if (item.id === 'command-prompt' && window.launchCommandPrompt) {
      window.launchCommandPrompt();
      return;
    }
    if (item.id === 'internet-explorer' && window.launchInternetExplorer) {
      window.launchInternetExplorer();
      return;
    }

    // Default: show placeholder content for the original desktop icons
    var content = getDefaultContent(item.id);
    var title = getDefaultTitle(item.id);
    var iconDataUri = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
      '<rect width="32" height="32" rx="4" fill="' + item.color + '"/>' +
      '<text x="16" y="24" font-size="20" text-anchor="middle" fill="white">' +
      item.icon + '</text></svg>'
    );

    window.XPDesktop.WindowManager.createWindow({
      title: title,
      icon: iconDataUri,
      content: content,
      width: 550,
      height: 400,
      x: 80 + Math.random() * 150,
      y: 60 + Math.random() * 100
    });
  }

  function getDefaultTitle(id) {
    var titles = {
      'my-photos': 'My Photos',
      'my-notes': 'My Notes',
      'projects': 'Projects',
      'about-me': 'About Me',
      'recycle-bin': 'Recycle Bin',
      'minesweeper': 'Minesweeper',
      'command-prompt': 'Command Prompt',
      'internet-explorer': 'Internet Explorer'
    };
    return titles[id] || 'Window';
  }

  function getDefaultContent(id) {
    var contents = {
      'my-photos': '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">🖼️</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">My Photos</h2>' +
        '<p>Photo gallery coming soon.</p>' +
        '<p style="font-size:11px;color:#999;">This will display your photo albums.</p>' +
        '</div>',

      'my-notes': '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">📝</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">My Notes</h2>' +
        '<p>Notes app coming soon.</p>' +
        '<p style="font-size:11px;color:#999;">Create and manage your notes here.</p>' +
        '</div>',

      'projects': '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">💼</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">Projects</h2>' +
        '<p>Project portfolio coming soon.</p>' +
        '<p style="font-size:11px;color:#999;">Browse my recent work and projects.</p>' +
        '</div>',

      'about-me': '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">👤</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">About Me</h2>' +
        '<p>Personal biography coming soon.</p>' +
        '<p style="font-size:11px;color:#999;">Learn more about who I am.</p>' +
        '</div>',

      'recycle-bin': '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">🗑️</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">Recycle Bin</h2>' +
        '<p>Your recycle bin is empty.</p>' +
        '<p style="font-size:11px;color:#999;">Deleted items will appear here.</p>' +
        '</div>'
    };
    return contents[id] || '<div style="padding:20px;color:#666;"><p>Content coming soon.</p></div>';
  }

  // --- Init on DOM ready ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
