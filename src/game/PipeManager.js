import { audio } from './Audio.js';

export class PipeManager {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.pipes = [];
    this.pipeWidth = 68;
    this.pipeCapHeight = 26;
    this.pipeCapOverlap = 6;
    this.gapHeight = 160; // Comfortable vertical gap
    this.speed = 1.7; // Relaxed scrolling speed
    this.spawnTimer = 0;
    this.spawnInterval = 135; // Frames between spawns
    this.groundHeight = 64;
  }

  setDifficulty(level) {
    if (level === 'easy') {
      this.gapHeight = 180;
      this.speed = 1.4;
      this.spawnInterval = 150;
    } else if (level === 'hard') {
      this.gapHeight = 135;
      this.speed = 2.4;
      this.spawnInterval = 105;
    } else { // normal
      this.gapHeight = 160;
      this.speed = 1.7;
      this.spawnInterval = 135;
    }
  }

  reset() {
    this.pipes = [];
    this.spawnTimer = 0;
  }

  update(bird, onScore) {
    this.spawnTimer++;

    // Spawn new pipe pair
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnPipe();
    }

    // Move existing pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= this.speed;

      // Check if bird passed pipe for score
      if (!pipe.passed && pipe.x + this.pipeWidth < bird.x) {
        pipe.passed = true;
        audio.playScore();
        if (onScore) onScore();
      }

      // Remove off-screen pipes
      if (pipe.x + this.pipeWidth < -20) {
        this.pipes.splice(i, 1);
      }
    }
  }

  spawnPipe() {
    const minTop = 60;
    const maxTop = this.height - this.groundHeight - this.gapHeight - 60;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

    this.pipes.push({
      x: this.width + 20,
      topHeight: topHeight,
      bottomY: topHeight + this.gapHeight,
      passed: false
    });
  }

  checkCollision(bird) {
    const birdRadius = bird.radius - 2; // Forgiving hit box

    for (const pipe of this.pipes) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + this.pipeWidth;

      // Check horizontal collision with pipe column
      if (bird.x + birdRadius > pipeLeft && bird.x - birdRadius < pipeRight) {
        // Check vertical collision with Top Pipe or Bottom Pipe
        if (bird.y - birdRadius < pipe.topHeight || bird.y + birdRadius > pipe.bottomY) {
          return true;
        }
      }
    }
    return false;
  }

  draw(ctx) {
    this.pipes.forEach(pipe => {
      // Top Pipe
      this.drawPipe(ctx, pipe.x, 0, this.pipeWidth, pipe.topHeight, true);
      // Bottom Pipe
      const bottomHeight = this.height - this.groundHeight - pipe.bottomY;
      this.drawPipe(ctx, pipe.x, pipe.bottomY, this.pipeWidth, bottomHeight, false);
    });
  }

  drawPipe(ctx, x, y, width, height, isTop) {
    ctx.save();

    const capH = this.pipeCapHeight;
    const capOverlap = this.pipeCapOverlap;
    const stemX = x + capOverlap / 2;
    const stemW = width - capOverlap;

    let stemY = isTop ? y : y + capH;
    let stemH = isTop ? height - capH : height - capH;

    // 1. Draw Main Pipe Body (Stem)
    const stemGrad = ctx.createLinearGradient(stemX, 0, stemX + stemW, 0);
    stemGrad.addColorStop(0, '#4E9B2D');
    stemGrad.addColorStop(0.2, '#8FE363');
    stemGrad.addColorStop(0.6, '#70C646');
    stemGrad.addColorStop(1, '#3D7D22');

    ctx.fillStyle = stemGrad;
    ctx.fillRect(stemX, stemY, stemW, stemH);

    // Stem Outline
    ctx.strokeStyle = '#255017';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(stemX, stemY, stemW, stemH);

    // 2. Draw Pipe Rim Cap
    const capY = isTop ? y + height - capH : y;
    const capGrad = ctx.createLinearGradient(x, 0, x + width, 0);
    capGrad.addColorStop(0, '#59AE34');
    capGrad.addColorStop(0.25, '#A1F076');
    capGrad.addColorStop(0.6, '#70C646');
    capGrad.addColorStop(1, '#32671B');

    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.roundRect(x, capY, width, capH, 5);
    ctx.fill();

    ctx.strokeStyle = '#255017';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Subtle Cap Lip Highlight Line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 4, capY + 3, width - 8, 3);

    ctx.restore();
  }
}
