/**
 * Internet Explorer for XP Desktop
 *
 * IE6-styled browser window with:
 * - Blue "e" icon, classic IE6 chrome (toolbar, nav buttons, address bar)
 * - Content: links to GitHub, Discord, email, webring navigation
 * - "This page is best viewed in Internet Explorer 6" badge
 */
(function () {
  'use strict';

  function buildIEContent() {
    var wrapper = document.createElement('div');
    wrapper.className = 'ie-wrapper';

    // Toolbar
    var toolbar = document.createElement('div');
    toolbar.className = 'ie-toolbar';

    var navBtns = document.createElement('div');
    navBtns.className = 'ie-nav-buttons';

    var backBtn = document.createElement('button');
    backBtn.className = 'ie-nav-btn';
    backBtn.textContent = '◀';
    backBtn.title = 'Back';
    backBtn.disabled = true;

    var forwardBtn = document.createElement('button');
    forwardBtn.className = 'ie-nav-btn';
    forwardBtn.textContent = '▶';
    forwardBtn.title = 'Forward';
    forwardBtn.disabled = true;

    var stopBtn = document.createElement('button');
    stopBtn.className = 'ie-nav-btn';
    stopBtn.textContent = '✕';
    stopBtn.title = 'Stop';
    stopBtn.disabled = true;

    var refreshBtn = document.createElement('button');
    refreshBtn.className = 'ie-nav-btn';
    refreshBtn.textContent = '⟳';
    refreshBtn.title = 'Refresh';

    var homeBtn = document.createElement('button');
    homeBtn.className = 'ie-nav-btn';
    homeBtn.textContent = '⌂';
    homeBtn.title = 'Home';

    navBtns.appendChild(backBtn);
    navBtns.appendChild(forwardBtn);
    navBtns.appendChild(stopBtn);
    navBtns.appendChild(refreshBtn);
    navBtns.appendChild(homeBtn);

    var addressBar = document.createElement('div');
    addressBar.className = 'ie-address-bar';

    var addrLabel = document.createElement('span');
    addrLabel.className = 'ie-address-label';
    addrLabel.textContent = 'Address';

    var addrInput = document.createElement('input');
    addrInput.className = 'ie-address-input';
    addrInput.value = 'https://samuelphan.com';
    addrInput.readOnly = true;

    var goBtn = document.createElement('button');
    goBtn.className = 'ie-nav-btn';
    goBtn.textContent = 'Go';
    goBtn.disabled = true;

    addressBar.appendChild(addrLabel);
    addressBar.appendChild(addrInput);
    addressBar.appendChild(goBtn);

    toolbar.appendChild(navBtns);
    toolbar.appendChild(addressBar);

    wrapper.appendChild(toolbar);

    // Browser body
    var body = document.createElement('div');
    body.className = 'ie-browser-body';

    body.innerHTML =
      '<div class="ie-logo-area">' +
        '<span class="ie-badge">✓ This page is best viewed in Internet Explorer 6</span>' +
      '</div>' +
      '<div class="ie-content">' +
        '<h1>🏠 Welcome to samuelphan.com</h1>' +
        '<p style="font-size:12px;color:#555;margin:8px 0;">Your portal to the world of Samuel Phan — check out the links below!</p>' +

        '<h2>🔗 Quick Links</h2>' +
        '<ul>' +
          '<li><a href="https://github.com/samuelphan" target="_blank" rel="noopener">🐙 GitHub — View my projects and contributions</a></li>' +
          '<li><a href="https://discord.gg" target="_blank" rel="noopener">💬 Discord — Join the conversation</a></li>' +
          '<li><a href="mailto:samuel@samuelphan.com">📧 Email — samuel@samuelphan.com</a></li>' +
          '<li><a href="https://samuelphan.com" target="_blank" rel="noopener">🌐 Main Website — samuelphan.com</a></li>' +
        '</ul>' +

        '<h2>🕸️ Webring</h2>' +
        '<div class="ie-webring">' +
          '<span>« </span><a>Previous Site</a><span> | </span>' +
          '<a><strong>samuelphan.com</strong></a><span> | </span>' +
          '<a>Next Site</a><span> »</span>' +
          '<br>' +
          '<span style="font-size:10px;color:#999;">Part of the Developer Personal Sites Webring</span>' +
        '</div>' +

        '<h2>📂 Projects</h2>' +
        '<ul>' +
          '<li><a>🪟 Windows XP Desktop — This very site! A nostalgic recreation of XP.</a></li>' +
          '<li><a>🧩 Various Web Apps — Portfolio of web development projects.</a></li>' +
          '<li><a>🤖 AI Projects — Exploring machine learning and agents.</a></li>' +
        '</ul>' +

        '<div class="ie-footer">' +
          '<p>© 2026 samuelphan.com. All rights reserved.</p>' +
          '<p style="color:#999;">Best viewed at 800×600 or higher resolution.<br>' +
          'Microsoft® Internet Explorer 6.0 compatible</p>' +
        '</div>' +
      '</div>';

    wrapper.appendChild(body);
    return wrapper;
  }

  function launchIE() {
    var content = buildIEContent();

    window.XPDesktop.WindowManager.createWindow({
      title: 'Internet Explorer',
      icon: 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
        '<rect width="32" height="32" rx="4" fill="#1a6bba"/>' +
        '<text x="16" y="26" font-size="22" text-anchor="middle" fill="white" font-style="italic" font-weight="bold" font-family="serif">e</text>' +
        '</svg>'
      ),
      content: content.outerHTML,
      width: 700,
      height: 500,
      x: 100,
      y: 50
    });
  }

  // Export
  window.XPDesktop = window.XPDesktop || {};
  window.XPDesktop.InternetExplorer = {
    launch: launchIE
  };

  window.launchInternetExplorer = launchIE;

  console.log('[XP Apps] Internet Explorer loaded');
})();
