/**
 * Notepad Application for XP Desktop Shell
 *
 * A fully-featured Notepad component that integrates with the
 * window manager system. Supports multiple independent windows,
 * menu bar with File/Edit/Format menus, word wrap toggle,
 * status bar with cursor position, and content loading from
 * a JSON data file.
 *
 * ## Public API (window.XPDesktop.Notepad)
 *
 *   open(filename)    → String (window id)
 *     Opens an existing note by filename (without .txt extension).
 *     Opens a blank untitled document if no filename given.
 *
 *   openBlank()       → String (window id)
 *     Opens a blank new Notepad window.
 *
 * ## Events
 *
 *   xp:notepadOpened  { winId, filename }
 *
 * @requires window-manager.js (window.XPDesktop.WindowManager)
 */
(function () {
  'use strict';

  var notesData = null;
  var notepadIcon = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<rect width="32" height="32" rx="4" fill="#2196F3"/>' +
    '<text x="16" y="24" font-size="20" text-anchor="middle" fill="white">📝</text></svg>'
  );

  var openCount = 0;

  // ============================================================
  // Data Loading
  // ============================================================

  function loadNotesData(callback) {
    if (notesData) {
      if (callback) callback(notesData);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/notes.json', true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          notesData = JSON.parse(xhr.responseText);
        } catch (e) {
          console.error('[Notepad] Failed to parse notes.json:', e);
          notesData = {};
        }
      } else {
        console.warn('[Notepad] Failed to load notes.json (status ' + xhr.status + ')');
        notesData = {};
      }
      if (callback) callback(notesData);
    };
    xhr.onerror = function () {
      console.warn('[Notepad] Could not load notes.json (offline?)');
      notesData = {};
      if (callback) callback(notesData);
    };
    xhr.send();
  }

  // ============================================================
  // Notepad Window Creation
  // ============================================================

  /**
   * Open a Notepad window with optional content.
   * @param {string} [filename] - The note filename (e.g. "about-samuelphan")
   * @param {string} [initialContent] - Pre-populated content (overrides file data)
   */
  function openNotepad(filename, initialContent) {
    var title, content;

    if (filename && filename !== 'Untitled') {
      // Add .txt extension for display if not present
      var displayFilename = filename.indexOf('.txt') === -1
        ? filename + '.txt'
        : filename;
      title = 'Notepad - ' + displayFilename;
    } else {
      filename = 'Untitled';
      title = 'Untitled - Notepad';
    }

    // Load content from data or use provided content
    if (initialContent !== undefined) {
      content = initialContent;
    } else if (notesData && notesData[filename + '.txt']) {
      content = notesData[filename + '.txt'].content;
    } else if (notesData && notesData[filename]) {
      content = notesData[filename].content;
    } else {
      content = '';
    }

    // Create the window via the window manager
    var x = 80 + (openCount % 5) * 40;
    var y = 60 + (openCount % 5) * 30;
    openCount++;

    var winId = window.XPDesktop.WindowManager.createWindow({
      title: title,
      icon: notepadIcon,
      content: buildNotepadHTML(content, true),
      width: 700,
      height: 480,
      x: x,
      y: y,
      resizable: true,
      onClose: function () {
        // Clean up any open dropdowns / dialogs
        closeAllDropdowns(winId);
      }
    });

    // Wire up event handlers (deferred until DOM renders)
    setTimeout(function () {
      wireNotepadEvents(winId, filename, content);
    }, 10);

    // Emit event
    var evt = new CustomEvent('xp:notepadOpened', {
      detail: { winId: winId, filename: filename }
    });
    document.dispatchEvent(evt);

    return winId;
  }

  // ============================================================
  // HTML Builder
  // ============================================================

  function buildNotepadHTML(content, wordWrap) {
    var wrapClass = wordWrap ? 'word-wrap' : '';

    return '' +
      '<div class="notepad-container" data-notepad="true">' +
        '<div class="notepad-menubar">' +
          '<div class="notepad-menubar-item" data-menu="file">' +
            'File' +
            '<div class="notepad-menu-dropdown" data-dropdown="file">' +
              '<div class="notepad-menu-item" data-action="new">' +
                '<span class="checkmark"></span>New' +
                '<span class="menu-shortcut">Ctrl+N</span>' +
              '</div>' +
              '<div class="notepad-menu-item" data-action="open">' +
                '<span class="checkmark"></span>Open...' +
                '<span class="menu-shortcut">Ctrl+O</span>' +
              '</div>' +
              '<div class="notepad-menu-item" data-action="save">' +
                '<span class="checkmark"></span>Save' +
                '<span class="menu-shortcut">Ctrl+S</span>' +
              '</div>' +
              '<div class="notepad-menu-separator"></div>' +
              '<div class="notepad-menu-item" data-action="exit">' +
                '<span class="checkmark"></span>Exit' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="notepad-menubar-item" data-menu="edit">' +
            'Edit' +
            '<div class="notepad-menu-dropdown" data-dropdown="edit">' +
              '<div class="notepad-menu-item" data-action="copy">' +
                '<span class="checkmark"></span>Copy' +
                '<span class="menu-shortcut">Ctrl+C</span>' +
              '</div>' +
              '<div class="notepad-menu-separator"></div>' +
              '<div class="notepad-menu-item" data-action="selectall">' +
                '<span class="checkmark"></span>Select All' +
                '<span class="menu-shortcut">Ctrl+A</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="notepad-menubar-item" data-menu="format">' +
            'Format' +
            '<div class="notepad-menu-dropdown" data-dropdown="format">' +
              '<div class="notepad-menu-item" data-action="wordwrap">' +
                '<span class="checkmark">✓</span>Word Wrap' +
              '</div>' +
              '<div class="notepad-menu-separator"></div>' +
              '<div class="notepad-menu-item disabled" data-action="font">' +
                '<span class="checkmark"></span>Font...' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="notepad-body">' +
          '<textarea class="notepad-textarea ' + wrapClass + '"' +
            ' spellcheck="false" wrap="' + (wordWrap ? 'on' : 'off') + '">' +
            escapeHtml(content) +
          '</textarea>' +
        '</div>' +
        '<div class="notepad-statusbar">' +
          '<span class="notepad-status-cursor">Ln 1, Col 1</span>' +
          '<span class="notepad-status-encoding">UTF-8</span>' +
        '</div>' +
      '</div>';
  }

  // ============================================================
  // Event Wiring
  // ============================================================

  function wireNotepadEvents(winId, filename, originalContent) {
    var winEl = document.getElementById(winId);
    if (!winEl) return;

    var container = winEl.querySelector('.notepad-container');
    if (!container) return;

    var textarea = container.querySelector('.notepad-textarea');
    var statusCursor = container.querySelector('.notepad-status-cursor');
    var menuItems = container.querySelectorAll('.notepad-menubar-item');
    var dropdowns = container.querySelectorAll('.notepad-menu-dropdown');

    // ---- Menu bar: click to open/close dropdowns ----
    menuItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();

        var menu = item.dataset.menu;
        var dropdown = container.querySelector('[data-dropdown="' + menu + '"]');

        // Close all other dropdowns in this window
        closeAllDropdowns(winId);

        if (dropdown && !dropdown.classList.contains('open')) {
          dropdown.classList.add('open');
          item.classList.add('active');
        }
      });

      item.addEventListener('mouseenter', function () {
        // If any dropdown is open in this window, switch to this menu
        var anyOpen = container.querySelector('.notepad-menu-dropdown.open');
        if (anyOpen) {
          closeAllDropdowns(winId);
          var menu = item.dataset.menu;
          var dropdown = container.querySelector('[data-dropdown="' + menu + '"]');
          if (dropdown) {
            dropdown.classList.add('open');
            item.classList.add('active');
          }
        }
      });
    });

    // ---- Dropdown menu item clicks ----
    container.querySelectorAll('.notepad-menu-item[data-action]').forEach(function (item) {
      // Skip disabled items
      if (item.classList.contains('disabled')) return;

      item.addEventListener('click', function (e) {
        e.stopPropagation();
        var action = item.dataset.action;
        handleAction(winId, filename, originalContent, action);
        closeAllDropdowns(winId);
      });
    });

    // ---- Close dropdowns on body click ----
    var bodyEl = container.querySelector('.notepad-body');
    if (bodyEl) {
      bodyEl.addEventListener('mousedown', function () {
        closeAllDropdowns(winId);
      });
    }

    // ---- Textarea events ----
    if (textarea) {
      // Update cursor position in status bar
      textarea.addEventListener('click', function () {
        updateCursorPosition(textarea, statusCursor);
      });
      textarea.addEventListener('keyup', function () {
        updateCursorPosition(textarea, statusCursor);
      });
      textarea.addEventListener('scroll', function () {
        updateCursorPosition(textarea, statusCursor);
      });
    }

    // ---- Keyboard shortcuts ----
    if (textarea) {
      textarea.addEventListener('keydown', function (e) {
        if (e.ctrlKey) {
          switch (e.key.toLowerCase()) {
            case 'n':
              e.preventDefault();
              handleAction(winId, 'Untitled', '', 'new');
              closeAllDropdowns(winId);
              break;
            case 'o':
              e.preventDefault();
              handleAction(winId, filename, originalContent, 'open');
              closeAllDropdowns(winId);
              break;
            case 's':
              e.preventDefault();
              handleAction(winId, filename, originalContent, 'save');
              closeAllDropdowns(winId);
              break;
            case 'a':
              // Select All is native browser Ctrl+A in textarea
              // Don't prevent default, it works natively
              break;
            case 'c':
              // Copy is native browser Ctrl+C in textarea
              break;
          }
        }
      });
    }

    // Init cursor position display
    updateCursorPosition(textarea, statusCursor);
  }

  // ============================================================
  // Actions
  // ============================================================

  function handleAction(winId, filename, originalContent, action) {
    var winEl = document.getElementById(winId);
    if (!winEl) return;
    var container = winEl.querySelector('.notepad-container');
    var textarea = container ? container.querySelector('.notepad-textarea') : null;

    switch (action) {
      case 'new':
        // Open a brand new blank notepad window
        openNotepad('Untitled', '');
        break;

      case 'open':
        showOpenDialog(winId);
        break;

      case 'save':
        // Save As placeholder — XP Notepad behavior
        if (filename && filename !== 'Untitled') {
          // Already has a name — just save (placeholder)
          alert_safe(winId, 'Save', 'File saved successfully.', 'info');
        } else {
          alert_safe(winId, 'Save As', 'Save As... coming soon!\n\n' +
            '(This is a demo placeholder.)', 'info');
        }
        break;

      case 'exit':
        window.XPDesktop.WindowManager.close(winId);
        break;

      case 'copy': {
        if (textarea) {
          var start = textarea.selectionStart;
          var end = textarea.selectionEnd;
          if (start !== end) {
            var selectedText = textarea.value.substring(start, end);
            // Use the modern clipboard API if available
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(selectedText).catch(function () {
                // Fallback
                copyToClipboardFallback(selectedText);
              });
            } else {
              copyToClipboardFallback(selectedText);
            }
          }
        }
        break;
      }

      case 'selectall':
        if (textarea) {
          textarea.select();
          textarea.focus();
          updateCursorPosition(textarea, container.querySelector('.notepad-status-cursor'));
        }
        break;

      case 'wordwrap':
        if (textarea) {
          var isWrapped = textarea.classList.contains('word-wrap');
          if (isWrapped) {
            textarea.classList.remove('word-wrap');
            textarea.setAttribute('wrap', 'off');
          } else {
            textarea.classList.add('word-wrap');
            textarea.setAttribute('wrap', 'on');
          }
          // Toggle checkbox
          var wrapItem = container.querySelector('[data-action="wordwrap"] .checkmark');
          if (wrapItem) {
            wrapItem.textContent = isWrapped ? '' : '✓';
          }
        }
        break;

      case 'font':
        // Placeholder — do nothing (disabled anyway, but just in case)
        break;
    }
  }

  // ============================================================
  // Open Dialog
  // ============================================================

  function showOpenDialog(winId) {
    var winEl = document.getElementById(winId);
    if (!winEl) return;
    var container = winEl.querySelector('.notepad-container');
    if (!container) return;

    // Remove any existing dialog
    var existing = container.querySelector('.notepad-open-dialog');
    if (existing) existing.remove();

    // Build dialog
    var dialog = document.createElement('div');
    dialog.className = 'notepad-open-dialog';

    var optionsHtml = '';
    // Add "New Document" option
    optionsHtml += '<option value="__new__">(New Document)</option>';

    if (notesData) {
      Object.keys(notesData).sort().forEach(function (key) {
        var note = notesData[key];
        var displayName = key;
        optionsHtml += '<option value="' + escapeAttr(key) + '">' +
          escapeHtml(note.title || key) + ' (' + escapeHtml(key) + ')</option>';
      });
    }

    dialog.innerHTML =
      '<div class="notepad-open-dialog-title">Open</div>' +
      '<div class="notepad-open-dialog-body">' +
        '<label for="notepad-file-select-' + winId + '">Select a note to open:</label>' +
        '<select id="notepad-file-select-' + winId + '">' + optionsHtml + '</select>' +
        '<div class="notepad-open-dialog-actions">' +
          '<button class="notepad-open-cancel">Cancel</button>' +
          '<button class="notepad-open-confirm">Open</button>' +
        '</div>' +
      '</div>';

    container.appendChild(dialog);

    // Wire buttons
    var select = dialog.querySelector('select');
    var confirmBtn = dialog.querySelector('.notepad-open-confirm');
    var cancelBtn = dialog.querySelector('.notepad-open-cancel');

    confirmBtn.addEventListener('click', function () {
      var selected = select.value;
      dialog.remove();
      if (selected === '__new__') {
        openNotepad('Untitled', '');
      } else if (selected) {
        openNotepad(selected.replace('.txt', ''));
      }
    });

    cancelBtn.addEventListener('click', function () {
      dialog.remove();
    });
  }

  // ============================================================
  // Helpers
  // ============================================================

  function updateCursorPosition(textarea, statusEl) {
    if (!textarea || !statusEl) return;
    var val = textarea.value;
    var pos = textarea.selectionStart;
    var text = val.substring(0, pos);
    var lines = text.split('\n');
    var lineNum = lines.length;
    var colNum = lines[lines.length - 1].length + 1;
    statusEl.textContent = 'Ln ' + lineNum + ', Col ' + colNum;
  }

  function closeAllDropdowns(winId) {
    var winEl = document.getElementById(winId);
    if (!winEl) return;
    var containers = winEl.querySelectorAll('.notepad-container');
    containers.forEach(function (c) {
      c.querySelectorAll('.notepad-menu-dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });
      c.querySelectorAll('.notepad-menubar-item.active').forEach(function (d) {
        d.classList.remove('active');
      });
    });
  }

  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
  }

  function escapeAttr(text) {
    return String(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function copyToClipboardFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('[Notepad] Copy failed:', e);
    }
    document.body.removeChild(ta);
  }

  /**
   * Show a simple message box within the notepad window.
   * More authentic than browser alert().
   */
  function alert_safe(winId, title, message, type) {
    var icon = type === 'info' ? 'ℹ️' : '⚠️';
    // Use the window manager to show a small message window
    window.XPDesktop.WindowManager.createWindow({
      title: title,
      icon: 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
        '<rect width="32" height="32" rx="4" fill="#2196F3"/>' +
        '<text x="16" y="24" font-size="20" text-anchor="middle" fill="white">💬</text></svg>'
      ),
      content: '<div style="padding:20px;text-align:center;">' +
        '<div style="font-size:32px;margin-bottom:8px;">' + icon + '</div>' +
        '<p style="margin:0 0 12px;font-size:12px;white-space:pre-wrap;">' +
        escapeHtml(message) + '</p>' +
        '<button class="notepad-dialog-ok" style="min-width:60px;">OK</button>' +
        '</div>',
      width: 300,
      height: 160 + (message.split('\n').length * 4),
      x: 250,
      y: 200
    });
  }

  // ============================================================
  // Public API
  // ============================================================

  /**
   * Open a note by filename (with or without .txt extension).
   * If called with no args, opens a blank notepad.
   */
  function open(filename) {
    if (!filename || filename === 'Untitled') {
      return openNotepad('Untitled', '');
    }

    // Strip .txt if given
    var cleanName = filename;
    if (cleanName.indexOf('.txt') === cleanName.length - 4) {
      cleanName = cleanName.slice(0, -4);
    }

    return openNotepad(cleanName);
  }

  function openBlank() {
    return openNotepad('Untitled', '');
  }

  // ============================================================
  // Initialization
  // ============================================================

  function init() {
    loadNotesData(function () {
      console.log('[Notepad] Loaded ' +
        Object.keys(notesData || {}).length + ' notes');
    });

    // Expose public API
    if (!window.XPDesktop) window.XPDesktop = {};
    window.XPDesktop.Notepad = {
      open: open,
      openBlank: openBlank
    };

    console.log('[Notepad] Ready');
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
