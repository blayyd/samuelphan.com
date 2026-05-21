/**
 * Minesweeper component — XP-style Minesweeper game.
 * Classic: 9x9 beginner board, 10 mines.
 */
import { bus } from '../pubsub.js';

export function createMinesweeperWindow(wm) {
  const ROWS = 9;
  const COLS = 9;
  const MINES = 10;

  let board, revealed, flagged, gameOver, gameWon, mineCount, timer, timerInterval;

  function init() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    revealed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    flagged = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    gameOver = false;
    gameWon = false;
    mineCount = MINES;
    timer = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function placeMines(safeR, safeC) {
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      // Avoid placing mine on first click and adjacent cells
      if (board[r][c] === -1) continue;
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      board[r][c] = -1;
      placed++;
    }

    // Calculate numbers
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === -1) count++;
          }
        }
        board[r][c] = count;
      }
    }
  }

  function reveal(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (revealed[r][c] || flagged[r][c] || gameOver) return;
    revealed[r][c] = true;

    if (board[r][c] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          reveal(r + dr, c + dc);
        }
      }
    }
  }

  function checkWin() {
    let allRevealed = true;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] !== -1 && !revealed[r][c]) {
          allRevealed = false;
          break;
        }
      }
    }
    return allRevealed;
  }

  function updateUI() {
    const grid = document.getElementById('minesweeper-grid');
    const counter = document.getElementById('minesweeper-counter');
    const timerEl = document.getElementById('minesweeper-timer');
    const face = document.getElementById('minesweeper-face');

    if (counter) counter.textContent = String(mineCount).padStart(3, '0');
    if (timerEl) timerEl.textContent = String(Math.min(timer, 999)).padStart(3, '0');

    if (gameOver) {
      face.textContent = '😵';
    } else if (gameWon) {
      face.textContent = '😎';
    } else {
      face.textContent = '🙂';
    }

    if (!grid) return;
    grid.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'minesweeper-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (revealed[r][c]) {
          cell.classList.add('revealed');
          if (board[r][c] === -1) {
            cell.innerHTML = '<span class="mine">💣</span>';
          } else if (board[r][c] > 0) {
            const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
            cell.textContent = board[r][c];
            cell.style.color = colors[board[r][c]] || '#000';
          }
        } else if (flagged[r][c]) {
          cell.classList.add('flagged');
          cell.textContent = '🚩';
        }

        cell.addEventListener('click', (e) => {
          e.preventDefault();
          if (gameOver || gameWon || flagged[r][c]) return;
          // Start timer on first click
          if (!timerInterval && !board.some(row => row.some(c => c === -1))) {
            placeMines(r, c);
            timerInterval = setInterval(() => { timer++; updateUI(); }, 1000);
          } else if (!timerInterval) {
            timerInterval = setInterval(() => { timer++; updateUI(); }, 1000);
          }
          if (board[r][c] === -1) {
            gameOver = true;
            // Reveal all mines
            for (let rr = 0; rr < ROWS; rr++) {
              for (let cc = 0; cc < COLS; cc++) {
                if (board[rr][cc] === -1) revealed[rr][cc] = true;
              }
            }
            if (timerInterval) clearInterval(timerInterval);
          } else {
            reveal(r, c);
            if (checkWin()) {
              gameWon = true;
              if (timerInterval) clearInterval(timerInterval);
            }
          }
          updateUI();
        });

        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (gameOver || gameWon || revealed[r][c]) return;
          if (!timerInterval && !board.some(row => row.some(c => c === -1))) {
            // No right-click timer start, only on left click
          }
          flagged[r][c] = !flagged[r][c];
          mineCount += flagged[r][c] ? -1 : 1;
          updateUI();
        });

        grid.appendChild(cell);
      }
    }
  }

  function reset() {
    init();
    updateUI();
  }

  init();

  const content = document.createElement('div');
  content.innerHTML = `
    <div class="minesweeper-header">
      <div class="minesweeper-counter" id="minesweeper-counter">${String(MINES).padStart(3, '0')}</div>
      <button class="minesweeper-face" id="minesweeper-face" aria-label="New game">🙂</button>
      <div class="minesweeper-counter" id="minesweeper-timer">000</div>
    </div>
    <div class="minesweeper-board" id="minesweeper-grid" style="grid-template-columns: repeat(${COLS}, 20px); grid-template-rows: repeat(${ROWS}, 20px);"></div>
  `;

  wm.open({
    id: 'minesweeper',
    title: '💣 Minesweeper',
    content,
    width: 220,
    height: 320,
    resizable: false,
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Ccircle fill=%22%23ff5722%22 cx=%2216%22 cy=%2216%22 r=%2215%22/%3E%3C/svg%3E',
  });

  // Attach reset listener
  document.getElementById('minesweeper-face')?.addEventListener('click', reset);

  // Initial render
  updateUI();
}
