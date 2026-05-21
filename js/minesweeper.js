/**
 * Minesweeper for XP Desktop
 *
 * Classic Minesweeper game:
 * - 9x9 grid, 10 mines
 * - Left-click to reveal, right-click to flag
 * - Numbers show adjacent mine count
 * - Smiley face: resets game (normal), X on loss, sunglasses on win
 * - Mine counter and timer
 * - XP-style beveled cells, classic grey background
 *
 * Uses event delegation on the game wrapper so everything survives
 * innerHTML serialization by the window manager.
 */
(function () {
  'use strict';

  var ROWS = 9;
  var COLS = 9;
  var MINES = 10;

  var grid = [];
  var revealed = [];
  var flagged = [];
  var gameOver = false;
  var gameWon = false;
  var firstClick = true;
  var timerInterval = null;
  var seconds = 0;
  var flagCount = 0;

  // These are re-bound after each render via querySelector on the live DOM
  var gameRoot = null;

  function bindDOM(root) {
    gameRoot = root;
  }

  function getGridEl()    { return gameRoot ? gameRoot.querySelector('.ms-grid') : null; }
  function getTimerEl()   { return gameRoot ? gameRoot.querySelector('.ms-timer') : null; }
  function getCounterEl() { return gameRoot ? gameRoot.querySelector('.ms-counter') : null; }
  function getSmileyEl()  { return gameRoot ? gameRoot.querySelector('.ms-smiley') : null; }

  function init() {
    firstClick = true;
    seconds = 0;
    flagCount = 0;
    gameOver = false;
    gameWon = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    grid = [];
    revealed = [];
    flagged = [];
    for (var r = 0; r < ROWS; r++) {
      grid[r] = [];
      revealed[r] = [];
      flagged[r] = [];
      for (var c = 0; c < COLS; c++) {
        grid[r][c] = 0;
        revealed[r][c] = false;
        flagged[r][c] = false;
      }
    }
  }

  function placeMines(excludeR, excludeC) {
    var placed = 0;
    while (placed < MINES) {
      var r = Math.floor(Math.random() * ROWS);
      var c = Math.floor(Math.random() * COLS);
      if (grid[r][c] === -1) continue;
      if (Math.abs(r - excludeR) <= 1 && Math.abs(c - excludeC) <= 1) continue;
      grid[r][c] = -1;
      placed++;
    }

    for (var rr = 0; rr < ROWS; rr++) {
      for (var cc = 0; cc < COLS; cc++) {
        if (grid[rr][cc] === -1) continue;
        var count = 0;
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            var nr = rr + dr;
            var nc = cc + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === -1) {
              count++;
            }
          }
        }
        grid[rr][cc] = count;
      }
    }
  }

  // Returns plain HTML string — no event listeners, no DOM refs
  function createGameHTML() {
    var cells = '';
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        cells += '<div class="ms-cell" data-r="' + r + '" data-c="' + c + '"></div>';
      }
    }

    return '' +
      '<div class="ms-game-wrapper">' +
        '<div class="ms-top-panel">' +
          '<div class="ms-counter">' + pad3(MINES) + '</div>' +
          '<div class="ms-smiley-wrap"><div class="ms-smiley">🙂</div></div>' +
          '<div class="ms-timer">000</div>' +
        '</div>' +
        '<div class="ms-grid" style="grid-template-columns: repeat(' + COLS + ', 26px);">' +
          cells +
        '</div>' +
      '</div>';
  }

  // Called after the HTML is in the live DOM — wires up event delegation
  function wireEvents(root) {
    bindDOM(root);

    // Smiley click → reset
    var smiley = getSmileyEl();
    if (smiley) {
      smiley.addEventListener('click', function () { resetGame(); });
    }

    // Grid click delegation (left click)
    var gridEl = getGridEl();
    if (gridEl) {
      gridEl.addEventListener('click', function (e) {
        var cell = e.target.closest('.ms-cell');
        if (!cell) return;
        var r = parseInt(cell.dataset.r);
        var c = parseInt(cell.dataset.c);
        if (!isNaN(r) && !isNaN(c)) handleClick(r, c);
      });

      gridEl.addEventListener('contextmenu', function (e) {
        var cell = e.target.closest('.ms-cell');
        if (!cell) return;
        e.preventDefault();
        var r = parseInt(cell.dataset.r);
        var c = parseInt(cell.dataset.c);
        if (!isNaN(r) && !isNaN(c)) handleRightClick(r, c);
      });
    }
  }

  function handleClick(r, c) {
    if (gameOver || gameWon) return;
    if (flagged[r][c]) return;
    if (revealed[r][c]) return;

    if (firstClick) {
      placeMines(r, c);
      firstClick = false;
      seconds = 0;
      timerInterval = setInterval(function () {
        seconds++;
        displayTimer();
      }, 1000);
    }

    revealCell(r, c);
  }

  function handleRightClick(r, c) {
    if (gameOver || gameWon) return;
    if (revealed[r][c]) return;

    flagged[r][c] = !flagged[r][c];
    flagCount += flagged[r][c] ? 1 : -1;
    updateCounter();
    renderCell(r, c);
  }

  function revealCell(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (revealed[r][c]) return;
    if (flagged[r][c]) return;

    revealed[r][c] = true;

    if (grid[r][c] === -1) {
      gameOver = true;
      clearInterval(timerInterval);
      timerInterval = null;
      var smiley = getSmileyEl();
      if (smiley) smiley.textContent = '😵';
      revealAllMines(r, c);
      return;
    }

    renderCell(r, c);

    if (grid[r][c] === 0) {
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          revealCell(r + dr, c + dc);
        }
      }
    }

    checkWin();
  }

  function revealAllMines(hitR, hitC) {
    var gridEl = getGridEl();
    if (!gridEl) return;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] === -1) {
          revealed[r][c] = true;
          var cell = gridEl.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
          if (!cell) continue;
          if (r === hitR && c === hitC) {
            cell.classList.add('mine-hit');
            cell.textContent = '💥';
          } else {
            cell.textContent = '💣';
          }
          cell.classList.add('revealed');
        } else if (flagged[r][c] && grid[r][c] !== -1) {
          var fc = gridEl.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
          if (fc) {
            fc.textContent = '❌';
            fc.classList.add('revealed');
          }
        }
      }
    }
  }

  function checkWin() {
    var unrevealedSafe = 0;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (!revealed[r][c] && grid[r][c] !== -1) {
          unrevealedSafe++;
        }
      }
    }
    if (unrevealedSafe === 0) {
      gameWon = true;
      clearInterval(timerInterval);
      timerInterval = null;
      var smiley = getSmileyEl();
      if (smiley) smiley.textContent = '😎';
      for (var rr = 0; rr < ROWS; rr++) {
        for (var cc = 0; cc < COLS; cc++) {
          if (grid[rr][cc] === -1) {
            flagged[rr][cc] = true;
            flagCount++;
            renderCell(rr, cc);
          }
        }
      }
      updateCounter();
    }
  }

  function renderCell(r, c) {
    var gridEl = getGridEl();
    if (!gridEl) return;
    var cell = gridEl.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
    if (!cell) return;

    cell.textContent = '';
    cell.className = 'ms-cell';

    if (revealed[r][c]) {
      cell.classList.add('revealed');
      if (grid[r][c] === -1) {
        cell.textContent = '💣';
      } else if (grid[r][c] > 0) {
        cell.innerHTML = '<span class="ms-num-' + grid[r][c] + '">' + grid[r][c] + '</span>';
      }
    } else if (flagged[r][c]) {
      cell.classList.add('flagged');
      cell.textContent = '🚩';
    }
  }

  function displayTimer() {
    var el = getTimerEl();
    if (el) el.textContent = pad3(Math.min(seconds, 999));
  }

  function updateCounter() {
    var el = getCounterEl();
    if (el) el.textContent = pad3(Math.max(0, MINES - flagCount));
  }

  function resetGame() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    firstClick = true;
    seconds = 0;
    flagCount = 0;
    gameOver = false;
    gameWon = false;
    var smiley = getSmileyEl();
    if (smiley) smiley.textContent = '🙂';

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        grid[r][c] = 0;
        revealed[r][c] = false;
        flagged[r][c] = false;
      }
    }

    for (var rr = 0; rr < ROWS; rr++) {
      for (var cc = 0; cc < COLS; cc++) {
        renderCell(rr, cc);
      }
    }

    updateCounter();
    displayTimer();
  }

  function pad3(n) {
    if (n < 0) return '000';
    if (n < 10) return '00' + n;
    if (n < 100) return '0' + n;
    return '' + Math.min(n, 999);
  }

  function launchMinesweeper() {
    init();

    // Create a content wrapper element
    var contentDiv = document.createElement('div');
    contentDiv.style.height = '100%';
    contentDiv.style.padding = '0';
    contentDiv.style.overflow = 'hidden';
    contentDiv.innerHTML = createGameHTML();

    window.XPDesktop.WindowManager.createWindow({
      title: 'Minesweeper',
      icon: 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
        '<rect width="32" height="32" rx="4" fill="#808080"/>' +
        '<circle cx="12" cy="12" r="3" fill="#000"/>' +
        '<circle cx="20" cy="20" r="3" fill="#000"/>' +
        '<circle cx="16" cy="8" r="2" fill="#000"/>' +
        '</svg>'
      ),
      content: contentDiv.innerHTML,
      width: 310,
      height: 340,
      x: 120,
      y: 80,
      resizable: false
    });

    // After window manager inserts into DOM, wire up events
    setTimeout(function () {
      // Find the game wrapper inside the window manager's DOM
      var wrapper = document.querySelector('.ms-game-wrapper');
      if (wrapper) wireEvents(wrapper);
    }, 50);
  }

  // Export
  window.XPDesktop = window.XPDesktop || {};
  window.XPDesktop.Minesweeper = {
    launch: launchMinesweeper
  };
  window.launchMinesweeper = launchMinesweeper;

  console.log('[XP Apps] Minesweeper loaded');
})();
