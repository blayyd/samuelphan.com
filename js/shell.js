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

    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  function boot() {
    console.log('[XP Shell] Desktop ready');

    // Log available API
    console.log('[XP Shell] Window Manager API available at window.XPDesktop.WindowManager');
    console.log('[XP Shell] Start Menu API available at window.XPDesktop.StartMenu');
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
        '<p style="font-size:11px;color:#999;">samuelphan.com v1.0</p>' +
        '<button id="about-ok-btn" style="margin-top:12px;">OK</button>' +
        '</div>',
      width: 380,
      height: 300,
      x: 200,
      y: 150
    });

    // Defer OK button wiring until the window body is in the DOM
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
