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

  var gridEl = null;
  var timerEl = null;
  var counterEl = null;
  var smileyEl = null;
  var wrapperEl = null;

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

    // Build the grid data
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
      // No mine on the first click cell or its neighbours
      if (Math.abs(r - excludeR) <= 1 && Math.abs(c - excludeC) <= 1) continue;
      grid[r][c] = -1;
      placed++;
    }

    // Calculate numbers
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

  function createGameHTML() {
    var wrapper = document.createElement('div');
    wrapper.className = 'ms-game-wrapper';

    // Top panel: mine counter, smiley, timer
    var topPanel = document.createElement('div');
    topPanel.className = 'ms-top-panel';

    counterEl = document.createElement('div');
    counterEl.className = 'ms-counter';
    counterEl.textContent = pad3(MINES);

    smileyEl = document.createElement('div');
    smileyEl.className = 'ms-smiley';
    smileyEl.textContent = '🙂';
    smileyEl.addEventListener('click', function () {
      resetGame();
    });

    timerEl = document.createElement('div');
    timerEl.className = 'ms-timer';
    timerEl.textContent = '000';

    topPanel.appendChild(counterEl);
    var smileyWrap = document.createElement('div');
    smileyWrap.className = 'ms-smiley-wrap';
    smileyWrap.appendChild(smileyEl);
    topPanel.appendChild(smileyWrap);
    topPanel.appendChild(timerEl);

    wrapper.appendChild(topPanel);

    // Grid
    gridEl = document.createElement('div');
    gridEl.className = 'ms-grid';
    gridEl.style.gridTemplateColumns = 'repeat(' + COLS + ', 26px)';

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = document.createElement('div');
        cell.className = 'ms-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        // Left click
        cell.addEventListener('click', (function (row, col) {
          return function () { handleClick(row, col); };
        })(r, c));

        // Right click (flag)
        cell.addEventListener('contextmenu', (function (row, col) {
          return function (e) {
            e.preventDefault();
            handleRightClick(row, col);
          };
        })(r, c));

        gridEl.appendChild(cell);
      }
    }

    wrapper.appendChild(gridEl);
    return wrapper;
  }

  function handleClick(r, c) {
    if (gameOver || gameWon) return;
    if (flagged[r][c]) return;
    if (revealed[r][c]) return;

    if (firstClick) {
      placeMines(r, c);
      firstClick = false;
      // Start timer
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
      // Hit a mine
      gameOver = true;
      clearInterval(timerInterval);
      timerInterval = null;
      smileyEl.textContent = '😵';
      revealAllMines(r, c);
      return;
    }

    renderCell(r, c);

    // If number is 0, flood fill
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
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] === -1) {
          revealed[r][c] = true;
          var cell = getCellElement(r, c);
          if (!cell) continue;
          if (r === hitR && c === hitC) {
            cell.classList.add('mine-hit');
            cell.textContent = '💥';
          } else {
            cell.textContent = '💣';
          }
          cell.classList.add('revealed');
        } else if (flagged[r][c] && grid[r][c] !== -1) {
          // Wrong flags
          var fc = getCellElement(r, c);
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
      smileyEl.textContent = '😎';
      // Auto-flag remaining mines
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
    var cell = getCellElement(r, c);
    if (!cell) return;

    // Reset
    cell.textContent = '';
    cell.className = 'ms-cell';

    if (revealed[r][c]) {
      cell.classList.add('revealed');
      if (grid[r][c] === -1) {
        cell.textContent = '💣';
      } else if (grid[r][c] > 0) {
        cell.innerHTML = '<span class="ms-num-' + grid[r][c] + '">' + grid[r][c] + '</span>';
      }
      // else 0 — empty
    } else if (flagged[r][c]) {
      cell.classList.add('flagged');
      cell.textContent = '🚩';
    }
  }

  function getCellElement(r, c) {
    return gridEl ? gridEl.querySelector('[data-r="' + r + '"][data-c="' + c + '"]') : null;
  }

  function displayTimer() {
    if (timerEl) timerEl.textContent = pad3(Math.min(seconds, 999));
  }

  function updateCounter() {
    if (counterEl) counterEl.textContent = pad3(Math.max(0, MINES - flagCount));
  }

  function resetGame() {
    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Reset state
    firstClick = true;
    seconds = 0;
    flagCount = 0;
    gameOver = false;
    gameWon = false;
    smileyEl.textContent = '🙂';

    // Clear grid data
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        grid[r][c] = 0;
        revealed[r][c] = false;
        flagged[r][c] = false;
      }
    }

    // Re-render all cells
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

  // Re-launch: destroy old window, create new
  function launchMinesweeper() {
    var content = document.createElement('div');
    content.style.height = '100%';
    content.style.padding = '0';
    content.style.overflow = 'hidden';
    content.appendChild(createGameHTML());

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
      content: content.outerHTML,
      width: 310,
      height: 340,
      x: 120,
      y: 80,
      resizable: false
    });
  }

  // Export
  window.XPDesktop = window.XPDesktop || {};
  window.XPDesktop.Minesweeper = {
    launch: launchMinesweeper
  };

  // Also expose globally for onclick handlers
  window.launchMinesweeper = launchMinesweeper;

  console.log('[XP Apps] Minesweeper loaded');
})();
