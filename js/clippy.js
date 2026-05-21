/**
 * Clippy for XP Desktop
 *
 * Optional assistant that appears in the corner of the screen.
 * - Shows contextual dialogues on a timer
 * - Toggle on/off via desktop right-click or Start menu
 * - Small Clippy character with speech bubbles
 */
(function () {
  'use strict';

  var clippyContainer = null;
  var timerInterval = null;
  var tipIndex = 0;
  var visible = false;

  var tips = [
    "It looks like you're browsing the web. Would you like me to show you some cool links?",
    "Did you know? Minesweeper was included with Windows 3.1 and every version since!",
    "Hey there! Try right-clicking on the desktop for more options.",
    "Looking for something? Try the Start menu!",
    "Did you know? Windows XP was released in 2001 and became one of the most beloved OS versions ever.",
    "Psst... check out the Command Prompt for some retro fun!",
    "Internet Explorer 6 was first released in 2001 alongside Windows XP.",
    "Thanks for visiting samuelphan.com! You're awesome! 😊",
    "Tip: You can double-click desktop icons to open windows.",
    "Want to play a game? Minesweeper is always a classic!",
    "The Windows XP Bliss wallpaper is a real photo of a hill in Sonoma County, California!",
    "Did you know? The Start button in XP originally had a 'Click here to begin' animation?",
    "Having fun? There's plenty more to explore!",
    "You can resize windows by dragging their edges. Give it a try!",
    "Clippy says: Don't forget to check your virtual email! 📧"
  ];

  function init(show) {
    // Create Clippy container if not already in DOM
    if (!clippyContainer) {
      clippyContainer = document.createElement('div');
      clippyContainer.id = 'clippy-container';

      // Speech bubble
      var bubble = document.createElement('div');
      bubble.className = 'clippy-bubble';
      bubble.id = 'clippy-bubble';
      bubble.textContent = tips[0];

      // Character
      var character = document.createElement('div');
      character.className = 'clippy-character';
      character.textContent = '📎';

      clippyContainer.appendChild(character);
      clippyContainer.prepend(bubble);
      document.body.appendChild(clippyContainer);

      // Click to cycle to next tip
      clippyContainer.addEventListener('click', function () {
        showNextTip();
      });
    }

    if (show) {
      showClippy();
    }
  }

  function showClippy() {
    if (!clippyContainer) init(false);
    if (visible) return;
    visible = true;
    clippyContainer.classList.add('visible');

    // Show first tip
    tipIndex = Math.floor(Math.random() * tips.length);
    updateBubble(tips[tipIndex]);

    // Rotate tips every 15 seconds
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      showNextTip();
    }, 15000);
  }

  function hideClippy() {
    visible = false;
    if (clippyContainer) {
      clippyContainer.classList.remove('visible');
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function toggleClippy() {
    if (visible) {
      hideClippy();
    } else {
      showClippy();
    }
  }

  function showNextTip() {
    tipIndex = (tipIndex + 1) % tips.length;
    updateBubble(tips[tipIndex]);
  }

  function updateBubble(text) {
    var bubble = document.getElementById('clippy-bubble');
    if (bubble) {
      bubble.textContent = text;
    }
  }

  function isVisible() {
    return visible;
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(false);
    });
  } else {
    init(false);
  }

  // Export
  window.XPDesktop = window.XPDesktop || {};
  window.XPDesktop.Clippy = {
    show: showClippy,
    hide: hideClippy,
    toggle: toggleClippy,
    isVisible: isVisible
  };

  window.toggleClippy = toggleClippy;

  console.log('[XP Apps] Clippy loaded');
})();
