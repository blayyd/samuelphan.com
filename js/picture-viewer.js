/**
 * Picture Viewer for XP Desktop Shell
 *
 * Windows Picture and Fax Viewer component.
 * Integrates with the window manager API (window.XPDesktop.WindowManager).
 *
 * Features:
 * - Photo manifest: reads JSON file listing photos
 * - Previous/Next navigation with toolbar buttons
 * - Zoom In, Zoom Out, Actual Size, Best Fit
 * - Rotate CW, Rotate CCW
 * - Keyboard navigation (Left/Right arrows, Home/End)
 * - Image counter in status bar
 * - Image display scaling to fit window
 */
(function () {
  'use strict';

  // ---- Configuration ----
  var MANIFEST_URL = 'assets/photos.json';
  var PHOTOS_DIR = 'assets/';
  var MIN_ZOOM = 0.1;
  var MAX_ZOOM = 10;
  var ZOOM_STEP = 1.414; // sqrt(2) — each step roughly doubles/halves area

  // ---- State ----
  var photos = [];
  var currentIndex = 0;
  var zoomLevel = 1.0; // 1.0 = fit-to-window baseline, actual pixels tracked separately
  var rotation = 0;    // 0, 90, 180, 270
  var isBestFit = true;
  var windowId = null;
  var elements = {};

  // ---- Public API ----
  window.launchPictureViewer = function () {
    loadManifest();
  };

  // ---- Manifest Loading ----
  function loadManifest() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', MANIFEST_URL, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            photos = data.photos || [];
            if (photos.length === 0) {
              showError('No photos found in manifest.');
              return;
            }
            openViewerWindow();
          } catch (e) {
            showError('Failed to parse photo manifest.');
          }
        } else {
          showError('Failed to load photo manifest.');
        }
      }
    };
    xhr.send();
  }

  function showError(msg) {
    window.XPDesktop.WindowManager.createWindow({
      title: 'Picture Viewer',
      icon: getIconDataUri(),
      content: '<div style="text-align:center;padding:40px 20px;color:#c00;">' +
        '<div style="font-size:48px;margin-bottom:12px;">🖼️</div>' +
        '<p>' + escapeHtml(msg) + '</p>' +
        '</div>',
      width: 350,
      height: 200,
      x: 150,
      y: 100
    });
  }

  // ---- Window Creation ----
  function openViewerWindow() {
    currentIndex = 0;
    rotation = 0;
    isBestFit = true;
    zoomLevel = 1.0;

    var title = photos.length > 0 ? photos[0].title + ' - Picture Viewer' : 'Picture Viewer';

    windowId = window.XPDesktop.WindowManager.createWindow({
      title: title,
      icon: getIconDataUri(),
      content: buildViewerHTML(),
      width: 700,
      height: 500,
      x: 100,
      y: 50,
      resizable: true,
      onClose: onWindowClose
    });

    // After the window element exists in DOM, grab our element references
    // Use a short timeout to ensure the content is rendered
    setTimeout(function () {
      cacheElements();
      if (elements.container) {
        // Remove default window-body padding for full-bleed image area
        var winEl = document.getElementById(windowId);
        var bodyEl = winEl ? winEl.querySelector('[data-body]') : null;
        if (bodyEl) {
          bodyEl.style.padding = '0';
          bodyEl.style.overflow = 'hidden';
        }
        loadPhoto(currentIndex);
        setupKeyboard();
      }
    }, 0);
  }

  function getIconDataUri() {
    return 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
      '<rect width="32" height="32" rx="4" fill="#4CAF50"/>' +
      '<text x="16" y="24" font-size="20" text-anchor="middle" fill="white">🖼️</text></svg>'
    );
  }

  function buildViewerHTML() {
    return '' +
      '<div class="picture-viewer-body">' +
        // Toolbar
        '<div class="pv-toolbar">' +
          '<button class="pv-btn" data-pv="prev" title="Previous image (Left arrow)">' +
            '<span class="pv-btn-icon">◀</span>' +
            '<span class="pv-btn-label">Previous</span>' +
          '</button>' +
          '<button class="pv-btn" data-pv="next" title="Next image (Right arrow)">' +
            '<span class="pv-btn-label">Next</span>' +
            '<span class="pv-btn-icon">▶</span>' +
          '</button>' +
          '<div class="pv-toolbar-separator"></div>' +
          '<button class="pv-btn" data-pv="zoomin" title="Zoom In">' +
            '<span class="pv-btn-icon">🔍</span>' +
            '<span class="pv-btn-label">Zoom In</span>' +
          '</button>' +
          '<button class="pv-btn" data-pv="zoomout" title="Zoom Out">' +
            '<span class="pv-btn-icon">🔍</span>' +
            '<span class="pv-btn-label">Zoom Out</span>' +
          '</button>' +
          '<button class="pv-btn" data-pv="actual" title="Actual Size">' +
            '<span class="pv-btn-label">Actual Size</span>' +
          '</button>' +
          '<button class="pv-btn" data-pv="bestfit" title="Best Fit">' +
            '<span class="pv-btn-label">Best Fit</span>' +
          '</button>' +
          '<div class="pv-toolbar-separator"></div>' +
          '<button class="pv-btn" data-pv="rotatecw" title="Rotate Clockwise">' +
            '<span class="pv-btn-icon">↻</span>' +
            '<span class="pv-btn-label">Rotate CW</span>' +
          '</button>' +
          '<button class="pv-btn" data-pv="rotateccw" title="Rotate Counter-Clockwise">' +
            '<span class="pv-btn-icon">↺</span>' +
            '<span class="pv-btn-label">Rotate CCW</span>' +
          '</button>' +
        '</div>' +
        // Image area
        '<div class="pv-image-area best-fit" id="pv-image-area">' +
          '<div class="pv-empty-state">' +
            '<div class="pv-empty-icon">🖼️</div>' +
            '<div class="pv-empty-text">Loading photos...</div>' +
          '</div>' +
        '</div>' +
        // Status bar
        '<div class="pv-statusbar">' +
          '<div class="pv-statusbar-left">' +
            '<span id="pv-counter">Image 0 of 0</span>' +
          '</div>' +
          '<div class="pv-statusbar-right" id="pv-filename"></div>' +
        '</div>' +
      '</div>';
  }

  // ---- Element References ----
  function cacheElements() {
    var winEl = document.getElementById(windowId);
    if (!winEl) return;
    var body = winEl.querySelector('[data-body]');
    if (!body) return;

    elements.container = body.querySelector('.picture-viewer-body');
    elements.imageArea = body.querySelector('.pv-image-area');
    elements.counter = body.querySelector('#pv-counter');
    elements.filename = body.querySelector('#pv-filename');
    elements.img = null; // will be set when loaded

    // Bind toolbar buttons
    var buttons = body.querySelectorAll('[data-pv]');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function (e) {
        var action = this.getAttribute('data-pv');
        handleAction(action);
      });
    });
  }

  // ---- Photo Loading ----
  function loadPhoto(index) {
    if (!photos.length || index < 0 || index >= photos.length) return;
    currentIndex = index;
    var photo = photos[currentIndex];

    if (!elements.imageArea) return;

    // Show loading state
    elements.imageArea.classList.add('loading');
    elements.imageArea.innerHTML = '';

    var img = new Image();
    elements.img = img;

    img.onload = function () {
      elements.imageArea.classList.remove('loading');
      elements.imageArea.innerHTML = '';
      elements.imageArea.appendChild(img);
      updateImageState();
    };

    img.onerror = function () {
      elements.imageArea.classList.remove('loading');
      elements.imageArea.innerHTML =
        '<div class="pv-empty-state">' +
          '<div class="pv-empty-icon">⚠️</div>' +
          '<div class="pv-empty-text">Failed to load: ' + escapeHtml(photo.filename) + '</div>' +
        '</div>';
    };

    img.src = PHOTOS_DIR + photo.filename;
    img.alt = photo.title || '';
    img.draggable = false;
  }

  // ---- Image State Update ----
  function updateImageState() {
    if (!elements.imageArea || !elements.img) return;
    var photo = photos[currentIndex];
    if (!photo) return;

    // Update title
    var winEl = document.getElementById(windowId);
    if (winEl) {
      var titleTextEl = winEl.querySelector('[data-title-text]');
      if (titleTextEl) {
        titleTextEl.textContent = photo.title + ' - Picture Viewer';
      }
    }

    // Update counter
    if (elements.counter) {
      elements.counter.textContent = 'Image ' + (currentIndex + 1) + ' of ' + photos.length;
    }

    // Update filename
    if (elements.filename) {
      elements.filename.textContent = photo.filename;
    }

    // Apply zoom/rotation
    applyTransform();

    // Update toolbar button states
    updateButtonStates();

    // Update window tab title if taskbar tracks it (CustomEvent)
    emit('pictureViewerUpdated', {
      index: currentIndex,
      total: photos.length,
      title: photo.title
    });
  }

  function applyTransform() {
    if (!elements.img) return;

    var transforms = [];

    // Apply rotation
    if (rotation !== 0) {
      transforms.push('rotate(' + rotation + 'deg)');
    }

    // Apply zoom
    if (!isBestFit) {
      transforms.push('scale(' + zoomLevel + ')');
    }

    // Update CSS classes
    elements.imageArea.classList.remove('best-fit', 'actual-size', 'zoomed');

    if (isBestFit) {
      elements.imageArea.classList.add('best-fit');
      elements.img.style.transform = transforms.length > 0 ? transforms.join(' ') : 'none';
      elements.img.style.maxWidth = '100%';
      elements.img.style.maxHeight = '100%';
    } else if (zoomLevel === 1.0 && rotation === 0) {
      elements.imageArea.classList.add('actual-size');
      elements.img.style.transform = 'none';
      elements.img.style.maxWidth = 'none';
      elements.img.style.maxHeight = 'none';
    } else {
      elements.imageArea.classList.add('zoomed');
      elements.img.style.transform = transforms.join(' ');
      elements.img.style.maxWidth = 'none';
      elements.img.style.maxHeight = 'none';
    }
  }

  // ---- Toolbar Button States ----
  function updateButtonStates() {
    var winEl = document.getElementById(windowId);
    if (!winEl) return;
    var body = winEl.querySelector('[data-body]');
    if (!body) return;

    var prevBtn = body.querySelector('[data-pv="prev"]');
    var nextBtn = body.querySelector('[data-pv="next"]');
    var zoomInBtn = body.querySelector('[data-pv="zoomin"]');
    var zoomOutBtn = body.querySelector('[data-pv="zoomout"]');

    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= photos.length - 1;
    if (zoomInBtn) zoomInBtn.disabled = zoomLevel >= MAX_ZOOM;
    if (zoomOutBtn) zoomOutBtn.disabled = isBestFit || zoomLevel <= MIN_ZOOM;
  }

  // ---- Actions ----
  function handleAction(action) {
    switch (action) {
      case 'prev':     goTo(currentIndex - 1); break;
      case 'next':     goTo(currentIndex + 1); break;
      case 'zoomin':   zoomIn(); break;
      case 'zoomout':  zoomOut(); break;
      case 'actual':   actualSize(); break;
      case 'bestfit':  bestFit(); break;
      case 'rotatecw': rotateCW(); break;
      case 'rotateccw': rotateCCW(); break;
    }
  }

  function goTo(index) {
    if (index < 0 || index >= photos.length) return;
    // Reset to best fit when navigating
    isBestFit = true;
    zoomLevel = 1.0;
    rotation = 0;
    loadPhoto(index);
  }

  function zoomIn() {
    if (zoomLevel >= MAX_ZOOM) return;
    isBestFit = false;
    zoomLevel = Math.min(MAX_ZOOM, zoomLevel * ZOOM_STEP);
    applyTransform();
    updateButtonStates();
  }

  function zoomOut() {
    if (isBestFit) return;
    if (zoomLevel <= MIN_ZOOM) return;
    isBestFit = false;
    zoomLevel = Math.max(MIN_ZOOM, zoomLevel / ZOOM_STEP);
    applyTransform();
    updateButtonStates();
  }

  function actualSize() {
    isBestFit = false;
    zoomLevel = 1.0;
    applyTransform();
    updateButtonStates();
  }

  function bestFit() {
    isBestFit = true;
    zoomLevel = 1.0;
    applyTransform();
    updateButtonStates();
  }

  function rotateCW() {
    rotation = (rotation + 90) % 360;
    applyTransform();
  }

  function rotateCCW() {
    rotation = (rotation - 90 + 360) % 360;
    applyTransform();
  }

  // ---- Keyboard Navigation ----
  function setupKeyboard() {
    document.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    // Only respond if our window exists and is focused
    var win = window.XPDesktop.WindowManager.get(windowId);
    if (!win || win.state === 'minimized') return;

    // Check if our window has focus (highest z-index)
    var allWindows = window.XPDesktop.WindowManager.getAll();
    if (allWindows.length === 0) return;

    // Find the topmost window
    var topWindow = null;
    var topZ = -1;
    allWindows.forEach(function (w) {
      var z = parseInt(w.element.style.zIndex) || 0;
      if (z > topZ) {
        topZ = z;
        topWindow = w;
      }
    });

    if (!topWindow || topWindow.id !== windowId) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goTo(currentIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        goTo(currentIndex + 1);
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(photos.length - 1);
        break;
    }
  }

  // ---- Cleanup ----
  function onWindowClose() {
    document.removeEventListener('keydown', onKeyDown);
    windowId = null;
    elements = {};
    photos = [];
  }

  // ---- Events ----
  function emit(name, data) {
    var evt = new CustomEvent('xp:' + name, { detail: data });
    document.dispatchEvent(evt);
  }

  // ---- Utilities ----
  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
  }

  console.log('[XP Shell] Picture Viewer loaded');
})();
