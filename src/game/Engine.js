import { Bird } from './Bird.js';
import { Background } from './Background.js';
import { PipeManager } from './PipeManager.js';

export const GAME_STATE = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER'
};

export class Engine {
  constructor(canvas, uiCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.uiCallbacks = uiCallbacks || {};

    this.width = canvas.width;
    this.height = canvas.height;

    this.state = GAME_STATE.READY;
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('flappy_best_score') || '0', 10);
    this.gamesPlayed = parseInt(localStorage.getItem('flappy_games_played') || '0', 10);

    this.background = new Background(this.width, this.height);
    this.pipeManager = new PipeManager(this.width, this.height);
    this.bird = new Bird(120, this.height / 2 - 30);

    this.animFrameId = null;
    this.lastTime = 0;
  }

  setDifficulty(level) {
    this.pipeManager.setDifficulty(level);
  }

  start() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.state = GAME_STATE.READY;
    this.score = 0;
    this.bird.reset();
    this.pipeManager.reset();
    this.updateUI();
    this.loop(0);
  }

  triggerJump() {
    if (this.state === GAME_STATE.READY) {
      this.state = GAME_STATE.PLAYING;
      this.gamesPlayed++;
      localStorage.setItem('flappy_games_played', this.gamesPlayed.toString());
      this.bird.flap();
      if (this.uiCallbacks.onGameStart) this.uiCallbacks.onGameStart();
    } else if (this.state === GAME_STATE.PLAYING) {
      this.bird.flap();
    }
  }

  pause() {
    if (this.state === GAME_STATE.PLAYING) {
      this.state = GAME_STATE.PAUSED;
      if (this.uiCallbacks.onPause) this.uiCallbacks.onPause();
    }
  }

  resume() {
    if (this.state === GAME_STATE.PAUSED) {
      this.state = GAME_STATE.PLAYING;
      if (this.uiCallbacks.onResume) this.uiCallbacks.onResume();
    }
  }

  restart() {
    this.start();
    this.triggerJump();
  }

  onScoreIncrement() {
    this.score++;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('flappy_best_score', this.bestScore.toString());
      this.saveLeaderboardScore(this.bestScore);
    }
    this.updateUI();
  }

  saveLeaderboardScore(score) {
    try {
      const scores = JSON.parse(localStorage.getItem('flappy_scores') || '[]');
      const dateStr = new Date().toLocaleDateString();
      scores.push({ score, date: dateStr, timestamp: Date.now() });
      scores.sort((a, b) => b.score - a.score);
      const topScores = scores.slice(0, 10);
      localStorage.setItem('flappy_scores', JSON.stringify(topScores));
    } catch (e) {}
  }

  gameOver() {
    this.state = GAME_STATE.GAMEOVER;
    this.saveLeaderboardScore(this.score);
    this.updateUI();
    if (this.uiCallbacks.onGameOver) {
      this.uiCallbacks.onGameOver(this.score, this.bestScore);
    }
  }

  updateUI() {
    if (this.uiCallbacks.onScoreChange) {
      this.uiCallbacks.onScoreChange(this.score, this.bestScore, this.gamesPlayed);
    }
  }

  loop(timestamp) {
    this.update();
    this.draw();
    this.animFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    const groundY = this.height - this.background.groundHeight;

    if (this.state === GAME_STATE.READY) {
      this.background.update(true);
      this.bird.update(groundY, false);
    } else if (this.state === GAME_STATE.PLAYING) {
      this.background.update(true);
      this.bird.update(groundY, true);
      this.pipeManager.update(this.bird, () => this.onScoreIncrement());

      // Check pipe collisions
      if (this.pipeManager.checkCollision(this.bird)) {
        this.bird.triggerCrash();
        this.gameOver();
      }

      // Check ground collision
      if (this.bird.y + this.bird.radius >= groundY) {
        this.bird.triggerCrash();
        this.gameOver();
      }
    } else if (this.state === GAME_STATE.GAMEOVER) {
      // Background static, bird physics continues until on ground
      this.background.update(false);
      this.bird.update(groundY, true);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Layered Background
    this.background.draw(this.ctx);

    // 2. Render Pipes
    this.pipeManager.draw(this.ctx);

    // 3. Render Bird & Particle Trail
    this.bird.draw(this.ctx);
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}
