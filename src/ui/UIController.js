import { Engine, GAME_STATE } from '../game/Engine.js';
import { audio } from '../game/Audio.js';

export class UIController {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    
    // DOM Elements
    this.hudScore = document.getElementById('hudScore');
    this.hudBestScore = document.getElementById('hudBestScore');
    this.summaryBestScore = document.getElementById('summaryBestScore');
    this.summaryGamesPlayed = document.getElementById('summaryGamesPlayed');
    this.finalScore = document.getElementById('finalScore');
    this.finalBestScore = document.getElementById('finalBestScore');

    this.readyOverlay = document.getElementById('readyOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');
    this.hudPauseBtn = document.getElementById('hudPauseBtn');

    this.themeToggleBtn = document.getElementById('themeToggle');

    // Modals
    this.scoresModal = document.getElementById('scoresModal');
    this.howToPlayModal = document.getElementById('howToPlayModal');
    this.settingsModal = document.getElementById('settingsModal');

    // Initialize Game Engine
    this.engine = new Engine(this.canvas, {
      onScoreChange: (score, best, played) => this.onScoreUpdate(score, best, played),
      onGameStart: () => this.showOverlay(null),
      onPause: () => this.showOverlay('pause'),
      onResume: () => this.showOverlay(null),
      onGameOver: (score, best) => this.onGameOver(score, best)
    });

    this.initEvents();
    this.initTheme();
    this.initSettings();
    this.engine.start();
  }

  onScoreUpdate(score, best, played) {
    this.hudScore.textContent = score;
    this.hudBestScore.textContent = best;
    this.summaryBestScore.textContent = best;
    this.summaryGamesPlayed.textContent = played;
  }

  onGameOver(score, best) {
    this.finalScore.textContent = score;
    this.finalBestScore.textContent = best;
    // Delay game over overlay slightly so user sees the bird falling onto the grass
    setTimeout(() => {
      if (this.engine.state === GAME_STATE.GAMEOVER) {
        this.showOverlay('gameOver');
      }
    }, 400);
  }

  showOverlay(type) {
    this.readyOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');

    if (type === 'ready') this.readyOverlay.classList.remove('hidden');
    if (type === 'pause') this.pauseOverlay.classList.remove('hidden');
    if (type === 'gameOver') this.gameOverOverlay.classList.remove('hidden');
  }

  initEvents() {
    // Buttons in Left Hero Panel
    document.getElementById('btnStartGame').addEventListener('click', () => {
      audio.playClick();
      this.engine.start();
      this.showOverlay('ready');
      // Give initial gentle flap so bird is floating high
      this.engine.triggerJump();
    });

    document.getElementById('btnViewScores').addEventListener('click', () => {
      audio.playClick();
      this.openModal('scores');
    });

    // Ready Overlay Start
    document.getElementById('btnOverlayStart').addEventListener('click', () => {
      audio.playClick();
      this.engine.triggerJump();
    });

    // HUD Pause Button
    this.hudPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.playClick();
      if (this.engine.state === GAME_STATE.PLAYING) {
        this.engine.pause();
      } else if (this.engine.state === GAME_STATE.PAUSED) {
        this.engine.resume();
      }
    });

    // Pause Screen Buttons
    document.getElementById('btnResume').addEventListener('click', () => {
      audio.playClick();
      this.engine.resume();
    });

    document.getElementById('btnRestart').addEventListener('click', () => {
      audio.playClick();
      this.engine.restart();
    });

    document.getElementById('btnPauseHome').addEventListener('click', () => {
      audio.playClick();
      this.engine.start();
      this.showOverlay('ready');
    });

    // Game Over Buttons (Matching Screenshot 2)
    document.getElementById('btnPlayAgain').addEventListener('click', () => {
      audio.playClick();
      this.engine.restart();
    });

    document.getElementById('btnBackHome').addEventListener('click', () => {
      audio.playClick();
      this.engine.start();
      this.showOverlay('ready');
    });

    // Container / Stage Tap or Click to flap
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.addEventListener('mousedown', (e) => {
      // Don't flap if clicking pause button or modal buttons
      if (e.target.closest('.hud-pause-btn') || e.target.closest('.btn')) return;
      e.preventDefault();
      this.engine.triggerJump();
    });

    gameContainer.addEventListener('touchstart', (e) => {
      if (e.target.closest('.hud-pause-btn') || e.target.closest('.btn')) return;
      e.preventDefault();
      this.engine.triggerJump();
    }, { passive: false });

    // Global Keyboard Controls (Space, ArrowUp, W)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        // Prevent page scroll when pressing Space/ArrowUp
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
          e.preventDefault();
          this.engine.triggerJump();
        }
      } else if (e.code === 'KeyP') {
        if (this.engine.state === GAME_STATE.PLAYING) this.engine.pause();
        else if (this.engine.state === GAME_STATE.PAUSED) this.engine.resume();
      } else if (e.code === 'Escape') {
        this.closeAllModals();
      }
    });

    // Sidebar Navigation Tabs
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        audio.playClick();
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        const tab = item.dataset.tab;
        if (tab === 'scores') this.openModal('scores');
        else if (tab === 'howToPlay') this.openModal('howToPlay');
        else if (tab === 'settings') this.openModal('settings');
        else if (tab === 'home') this.closeAllModals();
      });
    });

    // Modal Close Buttons
    document.getElementById('closeScoresModal').addEventListener('click', () => this.closeAllModals());
    document.getElementById('closeHowToPlayModal').addEventListener('click', () => this.closeAllModals());
    document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeAllModals());

    // Theme Toggle
    this.themeToggleBtn.addEventListener('click', () => {
      audio.playClick();
      this.toggleTheme();
    });
  }

  initTheme() {
    const savedTheme = localStorage.getItem('flappy_theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
  }

  toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('flappy_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('flappy_theme', 'dark');
    }
  }

  initSettings() {
    const soundCheck = document.getElementById('settingSoundFx');
    const diffSelect = document.getElementById('settingDifficulty');
    const resetBtn = document.getElementById('btnResetStats');

    soundCheck.addEventListener('change', (e) => {
      audio.enabled = e.target.checked;
    });

    diffSelect.addEventListener('change', (e) => {
      this.engine.setDifficulty(e.target.value);
    });

    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset your high score and games stats?')) {
        localStorage.removeItem('flappy_best_score');
        localStorage.removeItem('flappy_games_played');
        localStorage.removeItem('flappy_scores');
        this.engine.bestScore = 0;
        this.engine.gamesPlayed = 0;
        this.engine.updateUI();
        alert('Stats reset successfully!');
      }
    });
  }

  openModal(type) {
    this.closeAllModals();
    if (type === 'scores') {
      this.renderLeaderboard();
      this.scoresModal.classList.remove('hidden');
    } else if (type === 'howToPlay') {
      this.howToPlayModal.classList.remove('hidden');
    } else if (type === 'settings') {
      this.settingsModal.classList.remove('hidden');
    }
  }

  closeAllModals() {
    this.scoresModal.classList.add('hidden');
    this.howToPlayModal.classList.add('hidden');
    this.settingsModal.classList.add('hidden');

    // Reset home tab active class
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(n => {
      if (n.dataset.tab === 'home') n.classList.add('active');
      else n.classList.remove('active');
    });
  }

  renderLeaderboard() {
    const list = document.getElementById('scoresList');
    list.innerHTML = '';
    const scores = JSON.parse(localStorage.getItem('flappy_scores') || '[]');

    if (scores.length === 0) {
      list.innerHTML = `<li class="score-item" style="justify-content:center; color: var(--text-muted);">No high scores recorded yet! Play a game to set a record.</li>`;
      return;
    }

    scores.forEach((s, idx) => {
      const li = document.createElement('li');
      li.className = 'score-item';
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
      li.innerHTML = `
        <span>${medal} Score ${s.score}</span>
        <span style="color: var(--text-muted); font-size: 0.8rem;">${s.date}</span>
      `;
      list.appendChild(li);
    });
  }
}
